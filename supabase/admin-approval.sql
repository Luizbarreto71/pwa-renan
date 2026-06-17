-- ============================================
-- MIGRAÇÃO: Aprovação de usuários + painel admin
-- ============================================
-- Execute este script UMA VEZ no SQL Editor do Supabase (sobre um banco
-- que já tenha rodado supabase/schema.sql). É idempotente o suficiente
-- para ser reexecutado, mas a aprovação em massa dos usuários existentes
-- (passo 2) só deve ser desejada na primeira execução.

-- 1) Coluna de aprovação (novos usuários nascem como NÃO aprovados)
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS aprovado BOOLEAN NOT NULL DEFAULT false;

-- 2) Aprova os usuários que já existiam antes desta migração para não
--    trancá-los para fora do sistema. (Executar apenas na 1ª vez.)
UPDATE public.usuarios SET aprovado = true WHERE aprovado = false;

-- 3) Trigger de criação de perfil: deixa explícito que novos cadastros
--    entram pendentes (role 'user', aprovado false).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (user_id, email, nome, role, aprovado)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'user',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Função auxiliar para checar se o usuário autenticado é admin.
--    SECURITY DEFINER => roda como owner e ignora RLS, evitando recursão
--    quando usada dentro das próprias policies de `usuarios`.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 5) Policies de admin. São PERMISSIVE (somam-se com as policies de dono
--    já existentes via OR), então o admin enxerga/edita tudo.
DROP POLICY IF EXISTS "Admins podem ver todos os usuarios" ON public.usuarios;
CREATE POLICY "Admins podem ver todos os usuarios"
ON public.usuarios FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem atualizar todos os usuarios" ON public.usuarios;
CREATE POLICY "Admins podem atualizar todos os usuarios"
ON public.usuarios FOR UPDATE USING (public.is_admin());

-- Leitura agregada das tabelas de dados para os relatórios do admin.
DROP POLICY IF EXISTS "Admins podem ver todos os clientes" ON public.clientes;
CREATE POLICY "Admins podem ver todos os clientes"
ON public.clientes FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem ver todos os produtos" ON public.produtos;
CREATE POLICY "Admins podem ver todos os produtos"
ON public.produtos FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem ver todas as vendas" ON public.vendas;
CREATE POLICY "Admins podem ver todas as vendas"
ON public.vendas FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem ver todos os emprestimos" ON public.emprestimos;
CREATE POLICY "Admins podem ver todos os emprestimos"
ON public.emprestimos FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem ver todos os lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Admins podem ver todos os lancamentos"
ON public.lancamentos_financeiros FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins podem ver todos os tg_clientes" ON public.tg_clientes;
CREATE POLICY "Admins podem ver todos os tg_clientes"
ON public.tg_clientes FOR SELECT USING (public.is_admin());

-- 6) Seed do administrador (login: admin@admin.com / senha: admin123).
--    Cria o usuário no Auth + identity de email e promove o perfil criado
--    pelo trigger. Só roda se o admin ainda não existir.
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Administrador"}',
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      format('{"sub":"%s","email":"admin@admin.com"}', v_user_id)::jsonb,
      'email',
      now(),
      now(),
      now()
    );

    -- O trigger on_auth_user_created já criou o perfil; promove para admin.
    UPDATE public.usuarios
      SET role = 'admin', aprovado = true, nome = 'Administrador'
      WHERE user_id = v_user_id;
  ELSE
    -- Garante que um admin pré-existente fique consistente.
    UPDATE public.usuarios
      SET role = 'admin', aprovado = true
      WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@admin.com');
  END IF;
END $$;

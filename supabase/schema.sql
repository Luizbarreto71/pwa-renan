-- ============================================
-- PWA GESTÃO - BANCO DE DADOS SUPABASE
-- ============================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA DE USUÁRIOS (perfil)
-- ============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  ativo BOOLEAN DEFAULT true,
  -- Usuários entram imediatamente ativos; a aprovação do admin foi removida.
  aprovado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE CLIENTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cpf TEXT,
  endereco TEXT,
  data_nascimento DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  codigo TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 5,
  valor_compra DECIMAL(10,2) NOT NULL,
  valor_venda DECIMAL(10,2) NOT NULL,
  fornecedor TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE ESTOQUE MOVIMENTAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE VENDAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix', 'dinheiro', 'cartao', 'transferencia')),
  status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('concluida', 'pendente', 'cancelada')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE ITENS DA VENDA
-- ============================================
CREATE TABLE IF NOT EXISTS public.itens_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE RESTRICT NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE CARTÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.cartoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  banco TEXT NOT NULL,
  limite_total DECIMAL(10,2) NOT NULL,
  limite_disponivel DECIMAL(10,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE EMPRÉSTIMOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.emprestimos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL NOT NULL,
  cartao_id UUID REFERENCES public.cartoes(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  juros DECIMAL(5,2) NOT NULL DEFAULT 0,
  parcelas INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'atrasado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE PARCELAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emprestimo_id UUID REFERENCES public.emprestimos(id) ON DELETE CASCADE NOT NULL,
  numero INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE MOVIMENTAÇÕES DE CARTÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.movimentacoes_cartao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cartao_id UUID REFERENCES public.cartoes(id) ON DELETE CASCADE NOT NULL,
  emprestimo_id UUID REFERENCES public.emprestimos(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE CLIENTES TG (TIRZEPATIDA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tg_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  dosagem TEXT NOT NULL,
  data_compra DATE NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL,
  proxima_aplicacao DATE NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE APLICAÇÕES TG
-- ============================================
CREATE TABLE IF NOT EXISTS public.tg_aplicacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tg_cliente_id UUID REFERENCES public.tg_clientes(id) ON DELETE CASCADE NOT NULL,
  data_aplicacao DATE NOT NULL,
  dosagem TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE LANÇAMENTOS FINANCEIROS
-- ============================================
CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento TEXT,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  emprestimo_id UUID REFERENCES public.emprestimos(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA DE NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('estoque', 'vencimento', 'atraso', 'tg', 'sistema')),
  lida BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices de usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON public.usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

-- Índices de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON public.clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);

-- Índices de produtos
CREATE INDEX IF NOT EXISTS idx_produtos_usuario_id ON public.produtos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);

-- Índices de estoque
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_produto_id ON public.estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_usuario_id ON public.estoque_movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_created_at ON public.estoque_movimentacoes(created_at);

-- Índices de vendas
CREATE INDEX IF NOT EXISTS idx_vendas_usuario_id ON public.vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON public.vendas(created_at);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);

-- Índices de itens venda
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id ON public.itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON public.itens_venda(produto_id);

-- Índices de empréstimos
CREATE INDEX IF NOT EXISTS idx_emprestimos_usuario_id ON public.emprestimos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_cliente_id ON public.emprestimos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON public.emprestimos(status);
CREATE INDEX IF NOT EXISTS idx_emprestimos_data_vencimento ON public.emprestimos(data_vencimento);

-- Índices de parcelas
CREATE INDEX IF NOT EXISTS idx_parcelas_emprestimo_id ON public.parcelas(emprestimo_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON public.parcelas(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON public.parcelas(data_vencimento);

-- Índices de cartões
CREATE INDEX IF NOT EXISTS idx_cartoes_usuario_id ON public.cartoes(usuario_id);

-- Índices de movimentações cartão
CREATE INDEX IF NOT EXISTS idx_movimentacoes_cartao_cartao_id ON public.movimentacoes_cartao(cartao_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_cartao_emprestimo_id ON public.movimentacoes_cartao(emprestimo_id);

-- Índices de TG
CREATE INDEX IF NOT EXISTS idx_tg_clientes_usuario_id ON public.tg_clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tg_clientes_status ON public.tg_clientes(status);
CREATE INDEX IF NOT EXISTS idx_tg_clientes_proxima_aplicacao ON public.tg_clientes(proxima_aplicacao);
CREATE INDEX IF NOT EXISTS idx_tg_aplicacoes_tg_cliente_id ON public.tg_aplicacoes(tg_cliente_id);

-- Índices de lançamentos financeiros
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_usuario_id ON public.lancamentos_financeiros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_tipo ON public.lancamentos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_data ON public.lancamentos_financeiros(data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_venda_id ON public.lancamentos_financeiros(venda_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_emprestimo_id ON public.lancamentos_financeiros(emprestimo_id);

-- Índices de notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tg_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tg_aplicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - USUÁRIOS
-- ============================================

CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.usuarios
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.usuarios
FOR UPDATE
USING (auth.uid() = user_id);

-- Função auxiliar: o usuário autenticado é admin?
-- SECURITY DEFINER ignora RLS internamente, evitando recursão nas policies.
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

-- Admin enxerga e gerencia todos os usuários (aprovação, ativação, role).
CREATE POLICY "Admins podem ver todos os usuarios"
ON public.usuarios FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins podem atualizar todos os usuarios"
ON public.usuarios FOR UPDATE USING (public.is_admin());

-- Leitura agregada das tabelas de dados para os relatórios do admin.
CREATE POLICY "Admins podem ver todos os clientes"
ON public.clientes FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins podem ver todos os produtos"
ON public.produtos FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins podem ver todas as vendas"
ON public.vendas FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins podem ver todos os emprestimos"
ON public.emprestimos FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins podem ver todos os lancamentos"
ON public.lancamentos_financeiros FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins podem ver todos os tg_clientes"
ON public.tg_clientes FOR SELECT USING (public.is_admin());

-- ============================================
-- POLICIES - CLIENTES
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios clientes"
ON public.clientes
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir seus próprios clientes"
ON public.clientes
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar seus próprios clientes"
ON public.clientes
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir seus próprios clientes"
ON public.clientes
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - PRODUTOS
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios produtos"
ON public.produtos
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir seus próprios produtos"
ON public.produtos
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar seus próprios produtos"
ON public.produtos
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir seus próprios produtos"
ON public.produtos
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - ESTOQUE MOVIMENTAÇÕES
-- ============================================

CREATE POLICY "Usuários podem ver movimentações de seus produtos"
ON public.estoque_movimentacoes
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir movimentações de estoque"
ON public.estoque_movimentacoes
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - VENDAS
-- ============================================

CREATE POLICY "Usuários podem ver suas próprias vendas"
ON public.vendas
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir suas próprias vendas"
ON public.vendas
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar suas próprias vendas"
ON public.vendas
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir suas próprias vendas"
ON public.vendas
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - ITENS VENDA
-- ============================================

CREATE POLICY "Usuários podem ver itens de suas vendas"
ON public.itens_venda
FOR SELECT
USING (venda_id IN (
  SELECT id FROM public.vendas WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Usuários podem inserir itens em suas vendas"
ON public.itens_venda
FOR INSERT
WITH CHECK (venda_id IN (
  SELECT id FROM public.vendas WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

-- ============================================
-- POLICIES - EMPRÉSTIMOS
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios empréstimos"
ON public.emprestimos
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir seus próprios empréstimos"
ON public.emprestimos
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar seus próprios empréstimos"
ON public.emprestimos
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir seus próprios empréstimos"
ON public.emprestimos
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - PARCELAS
-- ============================================

CREATE POLICY "Usuários podem ver parcelas de seus empréstimos"
ON public.parcelas
FOR SELECT
USING (emprestimo_id IN (
  SELECT id FROM public.emprestimos WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Usuários podem atualizar parcelas de seus empréstimos"
ON public.parcelas
FOR UPDATE
USING (emprestimo_id IN (
  SELECT id FROM public.emprestimos WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

-- ============================================
-- POLICIES - CARTÕES
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios cartões"
ON public.cartoes
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir seus próprios cartões"
ON public.cartoes
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar seus próprios cartões"
ON public.cartoes
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir seus próprios cartões"
ON public.cartoes
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - MOVIMENTAÇÕES CARTÃO
-- ============================================

CREATE POLICY "Usuários podem ver movimentações de seus cartões"
ON public.movimentacoes_cartao
FOR SELECT
USING (cartao_id IN (
  SELECT id FROM public.cartoes WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Usuários podem inserir movimentações em seus cartões"
ON public.movimentacoes_cartao
FOR INSERT
WITH CHECK (cartao_id IN (
  SELECT id FROM public.cartoes WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

-- ============================================
-- POLICIES - TG CLIENTES
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios clientes TG"
ON public.tg_clientes
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir seus próprios clientes TG"
ON public.tg_clientes
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar seus próprios clientes TG"
ON public.tg_clientes
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir seus próprios clientes TG"
ON public.tg_clientes
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - TG APLICAÇÕES
-- ============================================

CREATE POLICY "Usuários podem ver aplicações de seus clientes TG"
ON public.tg_aplicacoes
FOR SELECT
USING (tg_cliente_id IN (
  SELECT id FROM public.tg_clientes WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Usuários podem inserir aplicações em seus clientes TG"
ON public.tg_aplicacoes
FOR INSERT
WITH CHECK (tg_cliente_id IN (
  SELECT id FROM public.tg_clientes WHERE usuario_id IN (
    SELECT id FROM public.usuarios WHERE user_id = auth.uid()
  )
));

-- ============================================
-- POLICIES - LANÇAMENTOS FINANCEIROS
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios lançamentos"
ON public.lancamentos_financeiros
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir seus próprios lançamentos"
ON public.lancamentos_financeiros
FOR INSERT
WITH CHECK (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar seus próprios lançamentos"
ON public.lancamentos_financeiros
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir seus próprios lançamentos"
ON public.lancamentos_financeiros
FOR DELETE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

-- ============================================
-- POLICIES - NOTIFICAÇÕES
-- ============================================

CREATE POLICY "Usuários podem ver suas próprias notificações"
ON public.notificacoes
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
ON public.notificacoes
FOR UPDATE
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE user_id = auth.uid()
));

CREATE POLICY "Sistema pode inserir notificações"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas com updated_at
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emprestimos_updated_at
  BEFORE UPDATE ON public.emprestimos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcelas_updated_at
  BEFORE UPDATE ON public.parcelas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cartoes_updated_at
  BEFORE UPDATE ON public.cartoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tg_clientes_updated_at
  BEFORE UPDATE ON public.tg_clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lancamentos_financeiros_updated_at
  BEFORE UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÕES PARA AUTOMATIZAÇÃO
-- ============================================

-- Função para criar perfil de usuário após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (user_id, email, nome, role, aprovado)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'user',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar estoque após venda
CREATE OR REPLACE FUNCTION public.atualizar_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
  -- Diminuir estoque
  UPDATE public.produtos
  SET quantidade = quantidade - NEW.quantidade
  WHERE id = NEW.produto_id;
  
  -- Registrar movimentação
  INSERT INTO public.estoque_movimentacoes (
    usuario_id, produto_id, tipo, quantidade, motivo, responsavel
  )
  VALUES (
    (SELECT usuario_id FROM public.vendas WHERE id = NEW.venda_id),
    NEW.produto_id,
    'saida',
    NEW.quantidade,
    'Venda realizada',
    'Sistema'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque
CREATE TRIGGER after_item_venda_insert
  AFTER INSERT ON public.itens_venda
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_estoque_venda();

-- ============================================
-- VIEW PARA DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
  COALESCE(SUM(CASE WHEN vf.data = CURRENT_DATE THEN vf.valor ELSE 0 END), 0) as faturamento_dia,
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM vf.data) = EXTRACT(MONTH FROM CURRENT_DATE) 
                     AND EXTRACT(YEAR FROM vf.data) = EXTRACT(YEAR FROM CURRENT_DATE) 
                THEN vf.valor ELSE 0 END), 0) as faturamento_mes,
  COALESCE((SELECT SUM(p.valor_venda * p.quantidade) FROM public.produtos p WHERE p.ativo = true), 0) as estoque_disponivel,
  COALESCE((SELECT COUNT(*) FROM public.clientes WHERE ativo = true), 0) as clientes_cadastrados,
  COALESCE((SELECT COUNT(*) FROM public.emprestimos WHERE status = 'ativo'), 0) as emprestimos_ativos,
  COALESCE((SELECT COUNT(*) FROM public.emprestimos e 
            JOIN public.cartoes c ON e.cartao_id = c.id 
            WHERE e.status = 'ativo'), 0) as cartoes_emprestados
FROM public.vendas v
JOIN public.lancamentos_financeiros vf ON v.id = vf.venda_id;

-- ============================================
-- SEED DATA (DADOS INICIAIS)
-- ============================================

-- Categorias de produtos padrão
INSERT INTO public.produtos (usuario_id, nome, categoria, quantidade, quantidade_minima, valor_compra, valor_venda)
SELECT 
  u.id,
  'Produto Exemplo',
  'Geral',
  100,
  10,
  50.00,
  75.00
FROM public.usuarios u
WHERE NOT EXISTS (SELECT 1 FROM public.produtos WHERE usuario_id = u.id)
LIMIT 1;
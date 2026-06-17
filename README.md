# PWA Gestão - Sistema de Gestão Completa

Um sistema completo de gestão empresarial desenvolvido com Next.js, TypeScript, Tailwind CSS, Shadcn/UI e Supabase, com foco em dispositivos móveis e funcionalidade PWA (Progressive Web App).

## 🚀 Funcionalidades

### Módulos Principais

- **Dashboard** - Visão geral com indicadores, gráficos e notificações
- **TG (Tirzepatida)** - Controle completo de aplicações e clientes TG
- **Estoque** - Gestão de produtos, entradas, saídas e alertas
- **Clientes** - Cadastro e histórico completo
- **Vendas** - Registro de vendas com múltiplas formas de pagamento
- **Empréstimos** - Controle de empréstimos e parcelas
- **Cartões** - Gestão de cartões e limite disponível
- **Financeiro** - Controle de receitas e despesas
- **Relatórios** - Geração de relatórios em PDF e Excel

### Características

- ✅ **Mobile First** - Otimizado para dispositivos móveis
- ✅ **PWA Instalável** - Funciona offline parcialmente
- ✅ **Dark/Light Mode** - Temas claro e escuro
- ✅ **Responsivo** - Adapta-se a qualquer tela
- ✅ **Autenticação** - Login seguro com Supabase Auth
- ✅ **RLS** - Row Level Security no banco de dados
- ✅ **Notificações** - Alertas em tempo real
- ✅ **Exportação** - PDF e Excel

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (gratuita)

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd pwa-gestao
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá até o SQL Editor e execute o script em `supabase/schema.sql`
4. Copie as credenciais do projeto

### 4. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 5. Execute o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000`

## 📱 Como Instalar como PWA

### No Celular (Android/iOS)

1. Abra o site no Chrome (Android) ou Safari (iOS)
2. Toque no menu (três pontos no Android, botão compartilhar no iOS)
3. Selecione "Adicionar à tela inicial" ou "Instalar aplicativo"
4. O app será instalado e poderá ser aberto como um aplicativo nativo

### No Desktop (Chrome/Edge)

1. Abra o site
2. Clique no ícone de instalar na barra de endereços
3. Confirme a instalação

## 🏗️ Estrutura do Projeto

```
pwa-gestao/
├── public/
│   └── icons/              # Ícones do PWA
├── src/
│   ├── app/
│   │   ├── auth/           # Página de autenticação
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── tg/             # Módulo TG
│   │   ├── estoque/        # Módulo Estoque
│   │   ├── clientes/       # Módulo Clientes
│   │   ├── vendas/         # Módulo Vendas
│   │   ├── emprestimos/    # Módulo Empréstimos
│   │   ├── cartoes/        # Módulo Cartões
│   │   ├── financeiro/     # Módulo Financeiro
│   │   ├── relatorios/     # Módulo Relatórios
│   │   ├── config/         # Configurações
│   │   ├── layout.tsx      # Layout raiz
│   │   ├── page.tsx        # Página inicial
│   │   └── globals.css     # Estilos globais
│   ├── components/
│   │   ├── layout/         # Componentes de layout
│   │   ├── shared/         # Componentes compartilhados
│   │   └── ui/             # Componentes Shadcn/UI
│   ├── lib/
│   │   ├── supabase/       # Configuração Supabase
│   │   └── utils.ts        # Utilitários
│   ├── types/
│   │   └── index.ts        # Tipos TypeScript
│   └── middleware.ts       # Middleware Next.js
├── supabase/
│   └── schema.sql          # Schema do banco de dados
└── next.config.ts          # Configuração Next.js
```

## 🗄️ Banco de Dados

O schema do banco de dados inclui as seguintes tabelas:

- `usuarios` - Perfis de usuários
- `clientes` - Cadastro de clientes
- `produtos` - Catálogo de produtos
- `estoque_movimentacoes` - Histórico de estoque
- `vendas` - Registro de vendas
- `itens_venda` - Itens das vendas
- `emprestimos` - Empréstimos ativos
- `parcelas` - Parcelas dos empréstimos
- `cartoes` - Cartões cadastrados
- `movimentacoes_cartao` - Uso dos cartões
- `tg_clientes` - Clientes TG
- `tg_aplicacoes` - Aplicações de TG
- `lancamentos_financeiros` - Lançamentos financeiros
- `notificacoes` - Notificações do sistema

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado, garantindo que cada usuário acesse apenas seus próprios dados.

## 🎨 Personalização

### Temas

O sistema suporta temas claro e escuro. Para alterar:

```tsx
// No componente Header ou em qualquer lugar
document.documentElement.classList.toggle('dark')
localStorage.setItem('theme', 'dark') // ou 'light'
```

### Cores

As cores são definidas via CSS variables no `globals.css`:

```css
:root {
  --primary: #7c3aed;
  --primary-foreground: #ffffff;
  /* ... outras cores */
}
```

## 📊 APIs e Integrações

### Supabase

O sistema utiliza o Supabase para:
- Autenticação de usuários
- Banco de dados PostgreSQL
- Armazenamento de arquivos (opcional)

### Hooks Personalizados

```tsx
import { createClient } from '@/lib/supabase/client'

// No componente
const supabase = createClient()

// Buscar data
const { data, error } = await supabase
  .from('clientes')
  .select('*')
  .eq('usuario_id', userId)
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório no GitHub
2. Configure as variáveis de ambiente
3. Faça o deploy

### Outros provedores

O projeto é compatível com qualquer hosting que suporte Next.js.

## 📝 Licença

MIT

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Crie um Pull Request

## 🆘 Suporte

Para dúvidas e suporte, abra uma issue no repositório.

---

**PWA Gestão** - Sistema completo de gestão empresarial
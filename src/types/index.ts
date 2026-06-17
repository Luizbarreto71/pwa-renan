// Database Types
export interface User {
  id: string
  email: string
  nome: string
  avatar_url?: string
  role: 'admin' | 'user'
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  usuario_id: string
  nome: string
  telefone: string
  cpf?: string
  endereco?: string
  data_nascimento?: string
  observacoes?: string
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  usuario_id: string
  nome: string
  categoria: string
  codigo?: string
  quantidade: number
  quantidade_minima: number
  valor_compra: number
  valor_venda: number
  fornecedor?: string
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface EstoqueMovimentacao {
  id: string
  usuario_id: string
  produto_id: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  motivo: string
  responsavel: string
  created_at: string
}

export interface Venda {
  id: string
  usuario_id: string
  cliente_id: string
  valor_total: number
  forma_pagamento: 'pix' | 'dinheiro' | 'cartao' | 'transferencia'
  status: 'concluida' | 'pendente' | 'cancelada'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface ItemVenda {
  id: string
  venda_id: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
}

export interface Emprestimo {
  id: string
  usuario_id: string
  cliente_id: string
  cartao_id?: string
  valor: number
  juros: number
  parcelas: number
  data_inicio: string
  data_vencimento: string
  status: 'ativo' | 'concluido' | 'atrasado'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Parcela {
  id: string
  emprestimo_id: string
  numero: number
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'paga' | 'atrasada'
  created_at: string
  updated_at: string
}

export interface Cartao {
  id: string
  usuario_id: string
  nome: string
  banco: string
  limite_total: number
  limite_disponivel: number
  dia_vencimento: number
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface MovimentacaoCartao {
  id: string
  cartao_id: string
  emprestimo_id?: string
  valor: number
  descricao: string
  data: string
  created_at: string
}

export interface TGCliente {
  id: string
  usuario_id: string
  cliente_id: string
  nome: string
  telefone: string
  dosagem: string
  data_compra: string
  quantidade: number
  valor_pago: number
  proxima_aplicacao: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface TGAplicacao {
  id: string
  tg_cliente_id: string
  data_aplicacao: string
  dosagem: string
  observacoes?: string
  created_at: string
}

export interface LancamentoFinanceiro {
  id: string
  usuario_id: string
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  data: string
  forma_pagamento?: string
  venda_id?: string
  emprestimo_id?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Notificacao {
  id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: 'estoque' | 'vencimento' | 'atraso' | 'tg' | 'sistema'
  lida: boolean
  link?: string
  created_at: string
}

// Dashboard Types
export interface DashboardStats {
  faturamento_dia: number
  faturamento_mes: number
  estoque_disponivel: number
  clientes_cadastrados: number
  emprestimos_ativos: number
  cartoes_emprestados: number
  lucro_mes: number
  vendas_hoje: number
  estoque_baixo: number
  tg_ativos: number
}

export interface GraficoVenda {
  data: string
  valor: number
}

export interface ProdutoMaisVendido {
  produto_id: string
  nome: string
  quantidade_vendida: number
  valor_total: number
}

// Form Types
export interface ClienteFormData {
  nome: string
  telefone: string
  cpf?: string
  endereco?: string
  data_nascimento?: string
  observacoes?: string
}

export interface ProdutoFormData {
  nome: string
  categoria: string
  codigo?: string
  quantidade: number
  quantidade_minima: number
  valor_compra: number
  valor_venda: number
  fornecedor?: string
}

export interface VendaFormData {
  cliente_id: string
  itens: Array<{
    produto_id: string
    quantidade: number
    valor_unitario: number
  }>
  forma_pagamento: 'pix' | 'dinheiro' | 'cartao' | 'transferencia'
  observacoes?: string
}

export interface EmprestimoFormData {
  cliente_id: string
  cartao_id?: string
  valor: number
  juros: number
  parcelas: number
  data_inicio: string
  observacoes?: string
}

export interface CartaoFormData {
  nome: string
  banco: string
  limite_total: number
  dia_vencimento: number
}

export interface LancamentoFormData {
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  data: string
  forma_pagamento?: string
  observacoes?: string
}

export interface TGClienteFormData {
  cliente_id?: string
  nome: string
  telefone: string
  dosagem: string
  data_compra: string
  quantidade: number
  valor_pago: number
  proxima_aplicacao: string
  observacoes?: string
}
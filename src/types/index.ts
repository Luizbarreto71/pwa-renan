// ═══════════════════════════════════════════
// BRUNELY KIDS — Tipos e Interfaces
// ═══════════════════════════════════════════

// ─── USUÁRIO ───────────────────────────────
export interface UserProfile {
  id: string
  user_id: string
  email: string
  nome: string
  avatar_url?: string
  role: 'admin' | 'gerente' | 'caixa' | 'estoquista'
  ativo: boolean
  aprovado: boolean
  created_at: string
  updated_at: string
}

// ─── PRODUTO (Roupas Infantis) ─────────────
export interface Produto {
  id: string
  usuario_id: string
  nome: string
  categoria: string
  subcategoria: string
  marca: string
  colecao: string
  genero: 'feminino' | 'masculino' | 'unisex'
  faixa_etaria: string
  tamanho: string
  cor: string
  codigo_interno: string
  codigo_barras: string
  sku: string
  foto_url?: string
  valor_custo: number
  valor_venda: number
  margem_lucro: number
  fornecedor: string
  quantidade: number
  quantidade_minima: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ProdutoFormData {
  nome: string
  categoria: string
  subcategoria?: string
  marca?: string
  colecao?: string
  genero?: 'feminino' | 'masculino' | 'unisex'
  faixa_etaria?: string
  tamanho?: string
  cor?: string
  codigo_interno?: string
  codigo_barras?: string
  sku?: string
  valor_custo?: number
  valor_venda: number
  fornecedor?: string
  quantidade: number
  quantidade_minima: number
}

// ─── ESTOQUE ───────────────────────────────
export interface EstoqueMovimentacao {
  id: string
  usuario_id: string
  produto_id: string
  tipo: 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'inventario'
  quantidade: number
  motivo: string
  responsavel: string
  created_at: string
}

export interface AlertaEstoque {
  tipo: 'baixo' | 'zerado' | 'sem_movimento'
  produto_id: string
  produto_nome: string
  quantidade: number
  dias_sem_venda?: number
}

// ─── VENDA / PDV ───────────────────────────
export interface Venda {
  id: string
  usuario_id: string
  cliente_id?: string
  valor_subtotal: number
  valor_desconto: number
  valor_acrescimo: number
  valor_total: number
  forma_pagamento: FormaPagamento[]
  status: 'concluida' | 'pendente' | 'cancelada' | 'trocada'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface FormaPagamento {
  tipo: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'parcelado' | 'fiado'
  valor: number
  parcelas?: number
}

export interface ItemVenda {
  id: string
  venda_id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  desconto: number
}

export interface CarrinhoItem {
  produto: Produto
  quantidade: number
  valor_unitario: number
  desconto: number
}

// ─── CLIENTE / CRM ─────────────────────────
export interface Cliente {
  id: string
  usuario_id: string
  nome: string
  telefone: string
  whatsapp: string
  cpf?: string
  data_nascimento?: string
  endereco?: string
  observacoes?: string
  ativo: boolean
  total_gasto: number
  ultima_compra?: string
  frequencia_compras: number
  classificacao: 'bronze' | 'prata' | 'ouro' | 'diamante'
  created_at: string
  updated_at: string
}

export interface ClienteFormData {
  nome: string
  telefone: string
  whatsapp: string
  cpf?: string
  data_nascimento?: string
  endereco?: string
  observacoes?: string
}

// ─── CRM ───────────────────────────────────
export interface CRMRegistro {
  id: string
  cliente_id: string
  usuario_id: string
  tipo: 'observacao' | 'lembrete' | 'followup' | 'campanha'
  titulo: string
  descricao: string
  concluido: boolean
  data_lembrete?: string
  created_at: string
}

// ─── ETIQUETA ──────────────────────────────
export interface ConfigEtiqueta {
  modelo: 'pequena' | 'media' | 'arara' | 'codigo_barras'
  largura_mm: number
  altura_mm: number
  mostrar_nome: boolean
  mostrar_tamanho: boolean
  mostrar_codigo: boolean
  mostrar_sku: boolean
  mostrar_valor: boolean
  mostrar_barras: boolean
}

// ─── FINANCEIRO ────────────────────────────
export interface LancamentoFinanceiro {
  id: string
  usuario_id: string
  tipo: 'receita' | 'despesa'
  categoria: string
  subcategoria: string
  centro_custo: string
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  forma_pagamento?: string
  cliente_id?: string
  fornecedor?: string
  observacoes?: string
  comprovante_url?: string
  created_at: string
  updated_at: string
}

export interface DRE {
  receitas: number
  deducoes: number
  receita_liquida: number
  custos: number
  lucro_bruto: number
  despesas_operacionais: number
  despesas_fixas: number
  despesas_variaveis: number
  lucro_operacional: number
  imposto: number
  lucro_liquido: number
  margem_liquida: number
}

// ─── DASHBOARD ─────────────────────────────
export interface DashboardIndicadores {
  vendas_dia: number
  vendas_semana: number
  vendas_mes: number
  ticket_medio: number
  lucro_estimado: number
  produtos_vendidos: number
  produtos_estoque: number
  estoque_baixo: number
  clientes_novos: number
  clientes_recorrentes: number
  clientes_inativos: number
}

export interface DashboardGraficos {
  evolucao_vendas: Array<{ data: string; valor: number }>
  produtos_mais_vendidos: Array<{ nome: string; quantidade: number; valor: number }>
  categorias_mais_vendidas: Array<{ nome: string; valor: number; cor: string }>
  formas_pagamento: Array<{ nome: string; valor: number; cor: string }>
  faturamento_mensal: Array<{ mes: string; receita: number; despesa: number }>
  clientes_por_classificacao: Array<{ nome: string; valor: number; cor: string }>
}

// ─── NOTIFICAÇÃO ───────────────────────────
export interface Notificacao {
  id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: 'estoque' | 'financeiro' | 'cliente' | 'venda' | 'meta' | 'sistema'
  lida: boolean
  link?: string
  created_at: string
}

// ─── IA ASSISTENTE ─────────────────────────
export interface IAConversa {
  id: string
  usuario_id: string
  pergunta: string
  resposta: string
  dados?: any
  created_at: string
}

// ─── RELATÓRIO ────────────────────────────
export interface Relatorio {
  id: string
  usuario_id: string
  tipo: 'vendas' | 'produtos' | 'estoque' | 'lucro' | 'clientes' | 'financeiro'
  periodo_inicio: string
  periodo_fim: string
  formato: 'pdf' | 'excel'
  criado_em: string
}

// ─── TG (TIRZEPATIDA) ──────────────────────
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

// ─── LOG DE AUDITORIA ──────────────────────
export interface LogAuditoria {
  id: string
  usuario_id: string
  usuario_nome: string
  acao: string
  entidade: string
  entidade_id: string
  detalhes: any
  ip: string
  created_at: string
}
export * from './clientes'

import { createClient } from '@/lib/supabase/client'
import type { Produto, ProdutoFormData, EstoqueMovimentacao } from '@/types'

const supabase = createClient()

/**
 * Resolve o id do PERFIL (usuarios.id) do usuário autenticado.
 * Todas as FKs `usuario_id` referenciam usuarios.id — NÃO auth.users.id.
 * Retorna null se não houver sessão ou perfil.
 */
export async function getUsuarioId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  return data?.id ?? null
}

// Produtos Service
export const produtosService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('produtos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .order('nome', { ascending: true })
  },

  async getById(id: string) {
    return await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single()
  },

  async create(data: ProdutoFormData, usuarioId: string) {
    return await supabase
      .from('produtos')
      .insert([{ ...data, usuario_id: usuarioId }])
      .select()
      .single()
  },

  async update(id: string, data: Partial<ProdutoFormData>) {
    return await supabase
      .from('produtos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  async delete(id: string) {
    return await supabase
      .from('produtos')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async search(usuarioId: string, term: string) {
    return await supabase
      .from('produtos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .ilike('nome', `%${term}%`)
      .order('nome', { ascending: true })
  },

  async getLowStock(usuarioId: string) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) return { data: null, error }

    // Filter locally for low stock items
    const lowStockItems = data?.filter(p => p.quantidade <= p.quantidade_minima) || []
    return { data: lowStockItems, error: null }
  },
}

// Estoque Movimentacoes Service
export const estoqueService = {
  async getMovimentacoes(usuarioId: string, produtoId?: string) {
    let query = supabase
      .from('estoque_movimentacoes')
      .select('*, produtos(nome)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })

    if (produtoId) {
      query = query.eq('produto_id', produtoId)
    }

    return await query
  },

  async registerEntrada(
    usuarioId: string,
    produtoId: string,
    quantidade: number,
    motivo: string,
    responsavel: string
  ) {
    // Atualiza a quantidade do produto (read-modify-write; não há RPC no schema)
    const { data: produtoEntrada } = await supabase
      .from('produtos')
      .select('quantidade')
      .eq('id', produtoId)
      .single()
    await supabase
      .from('produtos')
      .update({
        quantidade: Number(produtoEntrada?.quantidade ?? 0) + quantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', produtoId)

    // Register movimentacao
    return await supabase
      .from('estoque_movimentacoes')
      .insert([{
        usuario_id: usuarioId,
        produto_id: produtoId,
        tipo: 'entrada',
        quantidade,
        motivo,
        responsavel,
      }])
      .select()
      .single()
  },

  async registerSaida(
    usuarioId: string,
    produtoId: string,
    quantidade: number,
    motivo: string,
    responsavel: string
  ) {
    // Atualiza a quantidade do produto (read-modify-write; não há RPC no schema)
    const { data: produtoSaida } = await supabase
      .from('produtos')
      .select('quantidade')
      .eq('id', produtoId)
      .single()
    await supabase
      .from('produtos')
      .update({
        quantidade: Math.max(0, Number(produtoSaida?.quantidade ?? 0) - quantidade),
        updated_at: new Date().toISOString(),
      })
      .eq('id', produtoId)

    // Register movimentacao
    return await supabase
      .from('estoque_movimentacoes')
      .insert([{
        usuario_id: usuarioId,
        produto_id: produtoId,
        tipo: 'saida',
        quantidade,
        motivo,
        responsavel,
      }])
      .select()
      .single()
  },

  async registerAjuste(
    usuarioId: string,
    produtoId: string,
    quantidade: number,
    motivo: string,
    responsavel: string
  ) {
    // Set exact quantity
    await supabase
      .from('produtos')
      .update({ quantidade, updated_at: new Date().toISOString() })
      .eq('id', produtoId)

    return await supabase
      .from('estoque_movimentacoes')
      .insert([{
        usuario_id: usuarioId,
        produto_id: produtoId,
        tipo: 'ajuste',
        quantidade: Math.abs(quantidade),
        motivo,
        responsavel,
      }])
      .select()
      .single()
  },
}

// Vendas Service
export const vendasService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
  },

  async getById(id: string) {
    return await supabase
      .from('vendas')
      .select('*, clientes(*), itens_venda(*, produtos(*))')
      .eq('id', id)
      .single()
  },

  async create(vendaData: any, usuarioId: string) {
    const { cliente_id, forma_pagamento, observacoes, itens } = vendaData

    // Calculate total
    const valor_total = itens.reduce((sum: number, item: any) => 
      sum + (item.quantidade * item.valor_unitario), 0
    )

    // Create venda
    const { data: venda, error } = await supabase
      .from('vendas')
      .insert([{
        usuario_id: usuarioId,
        cliente_id,
        valor_total,
        forma_pagamento,
        observacoes,
        status: 'concluida',
      }])
      .select()
      .single()

    if (error) throw error

    // Create itens
    for (const item of itens) {
      await supabase
        .from('itens_venda')
        .insert([{
          venda_id: venda.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.quantidade * item.valor_unitario,
        }])
    }

    return venda
  },

  async getVendasByPeriod(usuarioId: string, startDate: string, endDate: string) {
    return await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .eq('usuario_id', usuarioId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
  },
}

// Empréstimos Service
export const emprestimosService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('emprestimos')
      .select('*, clientes(nome), cartoes(nome)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
  },

  async getAtivos(usuarioId: string) {
    return await supabase
      .from('emprestimos')
      .select('*, clientes(nome), cartoes(nome)')
      .eq('usuario_id', usuarioId)
      .eq('status', 'ativo')
      .order('data_vencimento', { ascending: true })
  },

  async getById(id: string) {
    return await supabase
      .from('emprestimos')
      .select('*, clientes(*), cartoes(*), parcelas(*)')
      .eq('id', id)
      .single()
  },

  async create(data: any, usuarioId: string) {
    return await supabase
      .from('emprestimos')
      .insert([{ ...data, usuario_id: usuarioId }])
      .select()
      .single()
  },

  async updateStatus(id: string, status: 'ativo' | 'concluido' | 'atrasado') {
    return await supabase
      .from('emprestimos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },
}

// Parcelas Service
export const parcelasService = {
  async getByEmprestimo(emprestimoId: string) {
    return await supabase
      .from('parcelas')
      .select('*')
      .eq('emprestimo_id', emprestimoId)
      .order('numero', { ascending: true })
  },

  async markAsPaid(id: string, dataPagamento: string) {
    return await supabase
      .from('parcelas')
      .update({
        status: 'paga',
        data_pagamento: dataPagamento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
  },

  async getVencendo(usuarioId: string, days: number = 5) {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return await supabase
      .from('parcelas')
      .select('*, emprestimos(clientes(nome))')
      .in('status', ['pendente'])
      .gte('data_vencimento', today)
      .lte('data_vencimento', futureDate.toISOString().split('T')[0])
  },
}

// Cartões Service
export const cartoesService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('cartoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .order('nome', { ascending: true })
  },

  async getById(id: string) {
    return await supabase
      .from('cartoes')
      .select('*, movimentacoes_cartao(*)')
      .eq('id', id)
      .single()
  },

  async create(data: any, usuarioId: string) {
    return await supabase
      .from('cartoes')
      .insert([{
        ...data,
        usuario_id: usuarioId,
        limite_disponivel: data.limite_total,
      }])
      .select()
      .single()
  },

  async updateLimite(id: string, valor: number) {
    // Get current limit first
    const { data: current } = await supabase
      .from('cartoes')
      .select('limite_disponivel')
      .eq('id', id)
      .single()

    if (!current) throw new Error('Cartão não encontrado')

    const novoLimite = Number(current.limite_disponivel) + valor

    return await supabase
      .from('cartoes')
      .update({
        limite_disponivel: novoLimite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
  },

  async delete(id: string) {
    return await supabase
      .from('cartoes')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
  },
}

// TG Service
export const tgService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('tg_clientes')
      .select('*, clientes(nome)')
      .eq('usuario_id', usuarioId)
      .eq('status', 'ativo')
      .order('proxima_aplicacao', { ascending: true })
  },

  async getById(id: string) {
    return await supabase
      .from('tg_clientes')
      .select('*, clientes(*), tg_aplicacoes(*)')
      .eq('id', id)
      .single()
  },

  async create(data: any, usuarioId: string) {
    return await supabase
      .from('tg_clientes')
      .insert([{ ...data, usuario_id: usuarioId }])
      .select()
      .single()
  },

  async update(id: string, data: any) {
    return await supabase
      .from('tg_clientes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  async registerAplicacao(tgClienteId: string, data: any) {
    return await supabase
      .from('tg_aplicacoes')
      .insert([{ tg_cliente_id: tgClienteId, ...data }])
      .select()
      .single()
  },

  async getProximasAplicacoes(usuarioId: string, days: number = 7) {
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return await supabase
      .from('tg_clientes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('status', 'ativo')
      .gte('proxima_aplicacao', today)
      .lte('proxima_aplicacao', futureDate.toISOString().split('T')[0])
      .order('proxima_aplicacao', { ascending: true })
  },
}

// Financeiro Service
export const financeiroService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('lancamentos_financeiros')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('data', { ascending: false })
  },

  async getByPeriod(usuarioId: string, startDate: string, endDate: string) {
    return await supabase
      .from('lancamentos_financeiros')
      .select('*')
      .eq('usuario_id', usuarioId)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false })
  },

  async create(data: any, usuarioId: string) {
    return await supabase
      .from('lancamentos_financeiros')
      .insert([{ ...data, usuario_id: usuarioId }])
      .select()
      .single()
  },

  async getResumo(usuarioId: string, month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    const { data: receitas } = await supabase
      .from('lancamentos_financeiros')
      .select('valor')
      .eq('usuario_id', usuarioId)
      .eq('tipo', 'receita')
      .gte('data', startDate)
      .lte('data', endDate)

    const { data: despesas } = await supabase
      .from('lancamentos_financeiros')
      .select('valor')
      .eq('usuario_id', usuarioId)
      .eq('tipo', 'despesa')
      .gte('data', startDate)
      .lte('data', endDate)

    const totalReceitas = receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0
    const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0

    return {
      receitas: totalReceitas,
      despesas: totalDespesas,
      lucro: totalReceitas - totalDespesas,
    }
  },
}

// Dashboard Service
export const dashboardService = {
  async getStats(usuarioId: string) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const [
      vendasHojeRes,
      vendasMesRes,
      clientesRes,
      emprestimosRes,
      produtosRes,
      cartoesEmpRes,
      tgRes,
      lancMesRes,
    ] = await Promise.all([
      supabase.from('vendas').select('valor_total').eq('usuario_id', usuarioId).gte('created_at', today),
      supabase.from('vendas').select('valor_total').eq('usuario_id', usuarioId).gte('created_at', firstDayOfMonth),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId).eq('ativo', true),
      supabase.from('emprestimos').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId).eq('status', 'ativo'),
      supabase.from('produtos').select('quantidade, quantidade_minima, valor_venda').eq('usuario_id', usuarioId).eq('ativo', true),
      supabase.from('emprestimos').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId).eq('status', 'ativo').not('cartao_id', 'is', null),
      supabase.from('tg_clientes').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId).eq('status', 'ativo'),
      supabase.from('lancamentos_financeiros').select('tipo, valor').eq('usuario_id', usuarioId).gte('data', firstDayOfMonth),
    ])

    const vendasHoje = vendasHojeRes.data || []
    const faturamento_dia = vendasHoje.reduce((sum, v) => sum + Number(v.valor_total), 0)
    const faturamento_mes = (vendasMesRes.data || []).reduce((sum, v) => sum + Number(v.valor_total), 0)

    const produtos = produtosRes.data || []
    const estoque_disponivel = produtos.reduce(
      (sum, p) => sum + Number(p.quantidade) * Number(p.valor_venda),
      0
    )
    const estoque_baixo = produtos.filter(
      (p) => Number(p.quantidade) <= Number(p.quantidade_minima)
    ).length

    const lancamentos = lancMesRes.data || []
    const receitas = lancamentos
      .filter((l) => l.tipo === 'receita')
      .reduce((s, l) => s + Number(l.valor), 0)
    const despesas = lancamentos
      .filter((l) => l.tipo === 'despesa')
      .reduce((s, l) => s + Number(l.valor), 0)

    return {
      faturamento_dia,
      faturamento_mes,
      clientes_cadastrados: clientesRes.count || 0,
      emprestimos_ativos: emprestimosRes.count || 0,
      estoque_disponivel,
      cartoes_emprestados: cartoesEmpRes.count || 0,
      lucro_mes: receitas - despesas,
      vendas_hoje: vendasHoje.length,
      estoque_baixo,
      tg_ativos: tgRes.count || 0,
    }
  },
}
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

const supabase = createClient()

export interface AdminResumo {
  totalUsuarios: number
  pendentes: number
  ativos: number
  inativos: number
  admins: number
  totalVendas: number
  faturamentoTotal: number
  receitasTotal: number
  despesasTotal: number
}

export interface AtividadeUsuario {
  usuario: UserProfile
  clientes: number
  vendas: number
  faturamento: number
  emprestimos: number
}

export const adminService = {
  // ----- Gestão de usuários -----
  async listUsuarios() {
    return await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
  },

  async setAprovado(id: string, aprovado: boolean) {
    return await supabase
      .from('usuarios')
      .update({ aprovado, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  async setAtivo(id: string, ativo: boolean) {
    return await supabase
      .from('usuarios')
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  async setRole(id: string, role: 'admin' | 'user') {
    return await supabase
      .from('usuarios')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  // ----- Relatórios -----
  async getResumo(): Promise<AdminResumo> {
    const [usuariosRes, vendasRes, lancamentosRes] = await Promise.all([
      supabase.from('usuarios').select('role, aprovado, ativo'),
      supabase.from('vendas').select('valor_total'),
      supabase.from('lancamentos_financeiros').select('tipo, valor'),
    ])

    const usuarios = usuariosRes.data || []
    const vendas = vendasRes.data || []
    const lancamentos = lancamentosRes.data || []

    const faturamentoTotal = vendas.reduce((s, v) => s + Number(v.valor_total || 0), 0)
    const receitasTotal = lancamentos
      .filter((l) => l.tipo === 'receita')
      .reduce((s, l) => s + Number(l.valor || 0), 0)
    const despesasTotal = lancamentos
      .filter((l) => l.tipo === 'despesa')
      .reduce((s, l) => s + Number(l.valor || 0), 0)

    return {
      totalUsuarios: usuarios.length,
      pendentes: usuarios.filter((u) => !u.aprovado).length,
      ativos: usuarios.filter((u) => u.aprovado && u.ativo !== false).length,
      inativos: usuarios.filter((u) => u.ativo === false).length,
      admins: usuarios.filter((u) => u.role === 'admin').length,
      totalVendas: vendas.length,
      faturamentoTotal,
      receitasTotal,
      despesasTotal,
    }
  },

  async getAtividadePorUsuario(): Promise<AtividadeUsuario[]> {
    const [usuariosRes, clientesRes, vendasRes, emprestimosRes] = await Promise.all([
      supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('usuario_id'),
      supabase.from('vendas').select('usuario_id, valor_total'),
      supabase.from('emprestimos').select('usuario_id'),
    ])

    const usuarios = (usuariosRes.data || []) as UserProfile[]
    const clientes = clientesRes.data || []
    const vendas = vendasRes.data || []
    const emprestimos = emprestimosRes.data || []

    const countBy = (rows: { usuario_id: string }[]) => {
      const map = new Map<string, number>()
      for (const r of rows) map.set(r.usuario_id, (map.get(r.usuario_id) || 0) + 1)
      return map
    }

    const clientesMap = countBy(clientes)
    const emprestimosMap = countBy(emprestimos)

    const vendasCountMap = new Map<string, number>()
    const faturamentoMap = new Map<string, number>()
    for (const v of vendas) {
      vendasCountMap.set(v.usuario_id, (vendasCountMap.get(v.usuario_id) || 0) + 1)
      faturamentoMap.set(
        v.usuario_id,
        (faturamentoMap.get(v.usuario_id) || 0) + Number(v.valor_total || 0)
      )
    }

    return usuarios.map((usuario) => ({
      usuario,
      clientes: clientesMap.get(usuario.id) || 0,
      vendas: vendasCountMap.get(usuario.id) || 0,
      faturamento: faturamentoMap.get(usuario.id) || 0,
      emprestimos: emprestimosMap.get(usuario.id) || 0,
    }))
  },
}

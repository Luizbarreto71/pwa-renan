import { createClient } from '@/lib/supabase/client'
import type { ClienteFormData } from '@/types'

const supabase = createClient()

export const clientesService = {
  async getAll(usuarioId: string) {
    return await supabase
      .from('clientes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .order('nome', { ascending: true })
  },

  async getById(id: string) {
    return await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
  },

  async create(data: ClienteFormData, usuarioId: string) {
    return await supabase
      .from('clientes')
      .insert([{ ...data, usuario_id: usuarioId }])
      .select()
      .single()
  },

  async update(id: string, data: Partial<ClienteFormData>) {
    return await supabase
      .from('clientes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  },

  async delete(id: string) {
    return await supabase
      .from('clientes')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
  },

  async search(usuarioId: string, term: string) {
    return await supabase
      .from('clientes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .ilike('nome', `%${term}%`)
      .order('nome', { ascending: true })
  },
}
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { adminService } from '@/lib/services/admin'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { UserProfile } from '@/types'
import { toast } from 'sonner'
import { Check, X, Power, ShieldCheck, ShieldOff, Search, Clock } from 'lucide-react'

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [termo, setTermo] = useState('')
  const [meuId, setMeuId] = useState<string | null>(null)
  const supabase = createClient()

  const carregar = async () => {
    const { data, error } = await adminService.listUsuarios()
    if (error) {
      toast.error('Erro ao carregar usuários')
    } else {
      setUsuarios((data as UserProfile[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        const { data: perfil } = await supabase
          .from('usuarios')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        setMeuId(perfil?.id ?? null)
      }
      await carregar()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aplicar = async (
    id: string,
    fn: () => Promise<{ error: unknown }>,
    msg: string
  ) => {
    setBusy(id)
    try {
      const { error } = await fn()
      if (error) throw error
      toast.success(msg)
      await carregar()
    } catch {
      toast.error('Não foi possível concluir a ação')
    } finally {
      setBusy(null)
    }
  }

  const filtrados = usuarios.filter((u: UserProfile) => {
    if (!termo.trim()) return true
    const t = termo.toLowerCase()
    return u.nome?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t)
  })

  const statusBadge = (u: UserProfile) => {
    if (u.ativo === false) {
      return <Badge variant="secondary">Inativo</Badge>
    }
    return (
      <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
        Ativo
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full bg-primary/20 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email"
            className="pl-9 h-9"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Nenhum usuário encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((u) => {
            const isSelf = u.id === meuId
            const isBusy = busy === u.id
            return (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{u.nome || 'Sem nome'}</p>
                        {statusBadge(u)}
                        {u.role === 'admin' && (
                          <Badge className="bg-primary/15 text-primary border-0">Admin</Badge>
                        )}
                        {isSelf && <span className="text-xs text-muted-foreground">(você)</span>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastro: {formatDate(u.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {!isSelf && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() =>
                            aplicar(
                              u.id,
                              () => adminService.setAtivo(u.id, u.ativo === false),
                              u.ativo === false ? 'Usuário ativado' : 'Usuário desativado'
                            )
                          }
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {u.ativo === false ? 'Ativar' : 'Desativar'}
                        </Button>
                      )}

                      {!isSelf && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() =>
                            aplicar(
                              u.id,
                              () => adminService.setRole(u.id, u.role === 'admin' ? 'user' : 'admin'),
                              u.role === 'admin' ? 'Admin removido' : 'Promovido a admin'
                            )
                          }
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-1" /> Remover admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 mr-1" /> Tornar admin
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

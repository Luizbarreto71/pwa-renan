'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { adminService, type AdminResumo, type AtividadeUsuario } from '@/lib/services/admin'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className={`text-2xl font-bold ${accent ?? ''}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {titulo}
      </h2>
      {children}
    </div>
  )
}

export default function AdminRelatoriosPage() {
  const [resumo, setResumo] = useState<AdminResumo | null>(null)
  const [atividade, setAtividade] = useState<AtividadeUsuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [r, a] = await Promise.all([
          adminService.getResumo(),
          adminService.getAtividadePorUsuario(),
        ])
        setResumo(r)
        setAtividade(a)
      } catch {
        toast.error('Erro ao carregar relatórios')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !resumo) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full bg-primary/20 animate-spin" />
      </div>
    )
  }

  const saldo = resumo.receitasTotal - resumo.despesasTotal

  return (
    <div className="space-y-6">
      <Secao titulo="Cadastros de usuários">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total" value={resumo.totalUsuarios} />
          <Stat label="Pendentes" value={resumo.pendentes} accent="text-amber-500" />
          <Stat label="Ativos" value={resumo.ativos} accent="text-emerald-500" />
          <Stat label="Inativos" value={resumo.inativos} />
          <Stat label="Admins" value={resumo.admins} accent="text-primary" />
        </div>
      </Secao>

      <Secao titulo="Vendas e financeiro (agregado de todos os usuários)">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Vendas" value={resumo.totalVendas} />
          <Stat label="Faturamento" value={formatCurrency(resumo.faturamentoTotal)} />
          <Stat label="Receitas" value={formatCurrency(resumo.receitasTotal)} accent="text-emerald-500" />
          <Stat label="Despesas" value={formatCurrency(resumo.despesasTotal)} accent="text-red-500" />
          <Stat
            label="Saldo"
            value={formatCurrency(saldo)}
            accent={saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}
          />
        </div>
      </Secao>

      <Secao titulo="Atividade por usuário">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Clientes</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Empréstimos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atividade.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  atividade.map((a) => (
                    <TableRow key={a.usuario.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{a.usuario.nome || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground truncate">{a.usuario.email}</p>
                          </div>
                          {a.usuario.role === 'admin' && (
                            <Badge className="bg-primary/15 text-primary border-0 shrink-0">Admin</Badge>
                          )}
                          {!a.usuario.aprovado && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 text-amber-600 dark:text-amber-400 shrink-0"
                            >
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{a.clientes}</TableCell>
                      <TableCell className="text-right">{a.vendas}</TableCell>
                      <TableCell className="text-right">{formatCurrency(a.faturamento)}</TableCell>
                      <TableCell className="text-right">{a.emprestimos}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Secao>
    </div>
  )
}

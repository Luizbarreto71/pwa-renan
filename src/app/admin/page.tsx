'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { adminService, type AdminResumo } from '@/lib/services/admin'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Users,
  Clock,
  UserCheck,
  ShieldCheck,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'

export default function AdminOverviewPage() {
  const [resumo, setResumo] = useState<AdminResumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getResumo()
        setResumo(data)
      } catch {
        toast.error('Erro ao carregar o resumo')
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

  const cards = [
    { label: 'Usuários', value: resumo.totalUsuarios, icon: Users, color: 'text-foreground' },
    { label: 'Pendentes', value: resumo.pendentes, icon: Clock, color: 'text-amber-500' },
    { label: 'Ativos', value: resumo.ativos, icon: UserCheck, color: 'text-emerald-500' },
    { label: 'Admins', value: resumo.admins, icon: ShieldCheck, color: 'text-primary' },
  ]

  const financeiro = [
    { label: 'Vendas', value: String(resumo.totalVendas), icon: ShoppingCart },
    { label: 'Faturamento', value: formatCurrency(resumo.faturamentoTotal), icon: DollarSign },
    { label: 'Receitas', value: formatCurrency(resumo.receitasTotal), icon: TrendingUp },
    { label: 'Despesas', value: formatCurrency(resumo.despesasTotal), icon: TrendingDown },
  ]

  return (
    <div className="space-y-6">
      {resumo.pendentes > 0 && (
        <Link href="/admin/usuarios">
          <Card className="border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">
                    {resumo.pendentes} {resumo.pendentes === 1 ? 'usuário aguardando' : 'usuários aguardando'} aprovação
                  </p>
                  <p className="text-xs text-muted-foreground">Toque para revisar os cadastros</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Usuários
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <Icon className={`w-5 h-5 mb-2 ${c.color}`} />
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Movimentação (todos os usuários)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {financeiro.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <Icon className="w-5 h-5 mb-2 text-muted-foreground" />
                  <p className="text-lg font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/usuarios">
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar usuários</p>
                  <p className="text-xs text-muted-foreground">Aprovar, ativar e definir admins</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/relatorios">
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Relatórios</p>
                  <p className="text-xs text-muted-foreground">Cadastros, financeiro e atividade</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

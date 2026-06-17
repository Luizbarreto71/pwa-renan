'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react'
import { getUsuarioId, dashboardService } from '@/lib/services'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const initialStats = {
  faturamento_dia: 0,
  faturamento_mes: 0,
  estoque_disponivel: 0,
  clientes_cadastrados: 0,
  emprestimos_ativos: 0,
  cartoes_emprestados: 0,
  lucro_mes: 0,
  vendas_hoje: 0,
  estoque_baixo: 0,
  tg_ativos: 0,
}

const mockVendasDiarias = [
  { data: '09:00', valor: 450 },
  { data: '11:00', valor: 780 },
  { data: '13:00', valor: 920 },
  { data: '15:00', valor: 650 },
  { data: '17:00', valor: 1100 },
  { data: '19:00', valor: 890 },
]

const mockCategorias = [
  { name: 'Vendas', value: 45, color: '#7c3aed' },
  { name: 'Empréstimos', value: 30, color: '#a855f7' },
  { name: 'TG', value: 15, color: '#ec4899' },
  { name: 'Outros', value: 10, color: '#f59e0b' },
]

const mockProdutosMaisVendidos = [
  { nome: 'Produto A', quantidade: 45, valor: 3375.00 },
  { nome: 'Produto B', quantidade: 32, valor: 2400.00 },
  { nome: 'Produto C', quantidade: 28, valor: 1960.00 },
  { nome: 'Produto D', quantidade: 21, valor: 1470.00 },
]

const mockNotificacoes = [
  { id: 1, tipo: 'estoque', mensagem: 'Produto X está com estoque baixo', data: '10:30' },
  { id: 2, tipo: 'vencimento', mensagem: 'Parcela de R$ 450,00 vence hoje', data: '09:15' },
  { id: 3, tipo: 'tg', mensagem: 'Cliente Maria - próxima aplicação amanhã', data: 'Ontem' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usuarioId = await getUsuarioId()
        if (usuarioId) {
          const data = await dashboardService.getStats(usuarioId)
          setStats((prev) => ({ ...prev, ...data }))
        }
      } catch {
        // mantém os zeros em caso de erro
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <PageLayout title="Dashboard" showSearch={false}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="h-20 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Dashboard" showSearch={false} notifications={mockNotificacoes.length}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Faturamento Hoje</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.faturamento_dia)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Hoje
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Faturamento Mês</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.faturamento_mes)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Mês atual
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Estoque</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.estoque_disponivel)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Valor total em produtos
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                  <p className="text-xl font-bold">{stats.clientes_cadastrados}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Clientes ativos
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{stats.emprestimos_ativos}</p>
              <p className="text-xs text-muted-foreground">Empréstimos Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.lucro_mes)}</p>
              <p className="text-xs text-muted-foreground">Lucro Mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.vendas_hoje}</p>
              <p className="text-xs text-muted-foreground">Vendas Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.estoque_baixo}</p>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.tg_ativos}</p>
              <p className="text-xs text-muted-foreground">TG Ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendas por Horário</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockVendasDiarias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="valor" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Categories Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas por Categoria</CardTitle>
              <CardDescription>Distribuição mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockCategorias}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={{ stroke: '#666', strokeWidth: 1 }}
                    >
                      {mockCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name as string]}
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {mockCategorias.map((cat, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="text-xs text-muted-foreground">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Most Sold Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
                <CardDescription>Top 4 produtos</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockProdutosMaisVendidos.map((produto, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {produto.quantidade} unidades
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-sm">{formatCurrency(produto.valor)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Notificações Recentes</CardTitle>
                <CardDescription>Alertas e lembretes</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockNotificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.tipo === 'estoque' ? 'bg-orange-500/10' :
                      notif.tipo === 'vencimento' ? 'bg-yellow-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {notif.tipo === 'estoque' ? (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      ) : notif.tipo === 'vencimento' ? (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Calendar className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notif.mensagem}</p>
                      <p className="text-xs text-muted-foreground">{notif.data}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
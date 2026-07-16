'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Target,
  Percent,
  Clock,
  Sparkles,
  ShoppingCart,
  CreditCard,
  PiggyBank,
  Gift,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts'

// Mock data premium
const mockIndicadores = {
  vendas_dia: 4580.00,
  vendas_semana: 28450.00,
  vendas_mes: 128450.00,
  ticket_medio: 89.90,
  lucro_estimado: 45280.00,
  produtos_vendidos: 1428,
  produtos_estoque: 3840,
  estoque_baixo: 12,
  clientes_novos: 18,
  clientes_recorrentes: 45,
  clientes_inativos: 32,
}

const mockEvolucaoVendas = [
  { data: 'Seg', valor: 3200 },
  { data: 'Ter', valor: 4500 },
  { data: 'Qua', valor: 3800 },
  { data: 'Qui', valor: 5200 },
  { data: 'Sex', valor: 6100 },
  { data: 'Sab', valor: 8500 },
  { data: 'Dom', valor: 4200 },
]

const mockProdutosMaisVendidos = [
  { nome: 'Vestido Alice', quantidade: 45, valor: 3375.00, cor: '#e84393' },
  { nome: 'Conjunto Verão', quantidade: 38, valor: 2850.00, cor: '#0c4a6e' },
  { nome: 'Short Baby', quantidade: 32, valor: 1920.00, cor: '#f59e0b' },
  { nome: 'Camiseta Flores', quantidade: 28, valor: 1400.00, cor: '#10b981' },
  { nome: 'Macacão Jeans', quantidade: 24, valor: 2280.00, cor: '#8b5cf6' },
]

const mockVendasPorCategoria = [
  { name: 'Vestidos', value: 35, cor: '#e84393' },
  { name: 'Conjuntos', value: 25, cor: '#0c4a6e' },
  { name: 'Shorts/Bermudas', value: 15, cor: '#f59e0b' },
  { name: 'Camisetas', value: 10, cor: '#10b981' },
  { name: 'Acessórios', value: 8, cor: '#8b5cf6' },
  { name: 'Sapatos', value: 7, cor: '#38bdf8' },
]

const mockFormasPagamento = [
  { name: 'Pix', value: 45, cor: '#10b981' },
  { name: 'Cartão Crédito', value: 30, cor: '#0c4a6e' },
  { name: 'Dinheiro', value: 15, cor: '#f59e0b' },
  { name: 'Cartão Débito', value: 10, cor: '#e84393' },
]

const mockFaturamentoMensal = [
  { mes: 'Fev', receita: 85000, despesa: 52000 },
  { mes: 'Mar', receita: 92000, despesa: 58000 },
  { mes: 'Abr', receita: 78000, despesa: 49000 },
  { mes: 'Mai', receita: 105000, despesa: 61000 },
  { mes: 'Jun', receita: 128450, despesa: 72000 },
  { mes: 'Jul', receita: 95000, despesa: 55000 },
]

const mockEstoqueAlertas = [
  { nome: 'Vestido Alice - Tam 2', quantidade: 3, minima: 10 },
  { nome: 'Short Jeans - Tam 4', quantidade: 2, minima: 8 },
  { nome: 'Camiseta Flores - Tam 6', quantidade: 5, minima: 15 },
]

const CHART_COLORS = [
  '#e84393', '#0c4a6e', '#f59e0b', '#10b981', '#8b5cf6', '#38bdf8'
]

function StatCard({ icon: Icon, label, value, trend, trendValue, color }: any) {
  return (
    <Card className="card-hover relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-transparent to-current opacity-[0.03] pointer-events-none" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
            style={{ background: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend && (
            <Badge variant={trend === 'up' ? 'default' : 'destructive'}
              className={`text-xs ${trend === 'up' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
            >
              {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {trendValue}
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold mb-0.5">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats] = useState(mockIndicadores)
  const [timeFilter, setTimeFilter] = useState('7d')

  return (
    <PageLayout title="Dashboard" showSearch={false}>
      {/* Welcome & Period Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold">Olá, bem-vinda! 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o desempenho da sua loja em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeFilter === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('7d')}
          >
            7 dias
          </Button>
          <Button
            variant={timeFilter === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('30d')}
          >
            30 dias
          </Button>
          <Button
            variant={timeFilter === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('90d')}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* Main Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          label="Vendas Hoje"
          value={formatCurrency(stats.vendas_dia)}
          color="#10b981"
          trend="up"
          trendValue="12%"
        />
        <StatCard
          icon={ShoppingBag}
          label="Vendas do Mês"
          value={formatCurrency(stats.vendas_mes)}
          color="#e84393"
          trend="up"
          trendValue="8%"
        />
        <StatCard
          icon={Target}
          label="Ticket Médio"
          value={formatCurrency(stats.ticket_medio)}
          color="#0c4a6e"
        />
        <StatCard
          icon={Percent}
          label="Lucro Estimado"
          value={formatCurrency(stats.lucro_estimado)}
          color="#f59e0b"
          trend="up"
          trendValue="15%"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.produtos_vendidos}</p>
              <p className="text-xs text-muted-foreground">Produtos Vendidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.produtos_estoque}</p>
              <p className="text-xs text-muted-foreground">Em Estoque</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.clientes_novos}</p>
              <p className="text-xs text-muted-foreground">Clientes Novos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.clientes_recorrentes}</p>
              <p className="text-xs text-muted-foreground">Recorrentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Evolução de Vendas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Evolução de Vendas</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              +23.5% vs semana anterior
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockEvolucaoVendas}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e84393" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e84393" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} stroke="var(--muted-foreground)" />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Vendas']}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#e84393" fill="url(#colorVendas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categorias mais vendidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias</CardTitle>
            <CardDescription>Distribuição de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockVendasPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {mockVendasPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
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
              {mockVendasPorCategoria.slice(0, 4).map((cat, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.cor }} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
              <CardDescription>Top 5 produtos do período</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">Ver todos</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProdutosMaisVendidos.map((produto, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white`}
                    style={{ background: produto.cor }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{produto.quantidade} unidades vendidas</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(produto.valor)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de Pagamento</CardTitle>
            <CardDescription>Preferência dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockFormasPagamento.map((fp, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: fp.cor }} />
                      <span className="text-sm">{fp.name}</span>
                    </div>
                    <span className="text-sm font-medium">{fp.value}%</span>
                  </div>
                  <Progress value={fp.value} className="h-2" style={{
                    '--progress-background': fp.cor,
                    '--progress-foreground': fp.cor,
                  } as any} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faturamento Mensal & Alertas */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Faturamento Mensal */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Faturamento Mensal</CardTitle>
              <CardDescription>Receitas vs Despesas</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              +18.5%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockFaturamentoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v/1000}k`} stroke="var(--muted-foreground)" />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="receita" fill="#e84393" radius={[4, 4, 0, 0]} name="Receita" />
                  <Bar dataKey="despesa" fill="#0c4a6e" radius={[4, 4, 0, 0]} name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas de Estoque</CardTitle>
            <CardDescription>Produtos abaixo do mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEstoqueAlertas.map((alerta, index) => (
                <div key={index} className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
                    <p className="text-sm font-medium truncate">{alerta.nome}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estoque: {alerta.quantidade} unidades</span>
                    <span>Mínimo: {alerta.minima}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full text-sm">
                Ver estoque completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
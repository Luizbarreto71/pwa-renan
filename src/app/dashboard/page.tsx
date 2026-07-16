'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ShoppingCart,
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
} from 'recharts'
import { dashboardService, getUsuarioId } from '@/lib/services'

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
  const [loading, setLoading] = useState(true)
  const [indicadores, setIndicadores] = useState({
    vendas_dia: 0,
    vendas_semana: 0,
    vendas_mes: 0,
    ticket_medio: 0,
    lucro_estimado: 0,
    produtos_vendidos: 0,
    produtos_estoque: 0,
    estoque_baixo: 0,
    clientes_novos: 0,
    clientes_recorrentes: 0,
  })
  const [graficos, setGraficos] = useState({
    evolucao_vendas: [],
    produtos_mais_vendidos: [],
    categorias_mais_vendidas: [],
    formas_pagamento: [],
    faturamento_mensal: [],
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) return

      const stats = await dashboardService.getStats(usuarioId)
      if (stats) {
        setIndicadores({
          vendas_dia: stats.vendas_hoje || 0,
          vendas_semana: 0,
          vendas_mes: stats.faturamento_mes || 0,
          ticket_medio: 0,
          lucro_estimado: stats.lucro_mes || 0,
          produtos_vendidos: 0,
          produtos_estoque: stats.estoque_disponivel || 0,
          estoque_baixo: stats.estoque_baixo || 0,
          clientes_novos: stats.clientes_cadastrados || 0,
          clientes_recorrentes: 0,
        })
      }
    } catch {
      // Sem dados ainda
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Dashboard" showSearch={false}>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full bg-primary/20 animate-spin" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Dashboard" showSearch={false}>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe o desempenho da sua loja
        </p>
      </div>

      {/* Main Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          label="Faturamento Hoje"
          value={formatCurrency(indicadores.vendas_dia)}
          color="#10b981"
        />
        <StatCard
          icon={ShoppingBag}
          label="Faturamento do Mês"
          value={formatCurrency(indicadores.vendas_mes)}
          color="#e84393"
        />
        <StatCard
          icon={Target}
          label="Lucro do Mês"
          value={formatCurrency(indicadores.lucro_estimado)}
          color="#0c4a6e"
        />
        <StatCard
          icon={Package}
          label="Estoque Baixo"
          value={indicadores.estoque_baixo.toString()}
          color="#f59e0b"
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
              <p className="text-lg font-bold">{indicadores.produtos_vendidos}</p>
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
              <p className="text-lg font-bold">{indicadores.produtos_estoque}</p>
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
              <p className="text-lg font-bold">{indicadores.clientes_novos}</p>
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
              <p className="text-lg font-bold">{indicadores.clientes_recorrentes}</p>
              <p className="text-xs text-muted-foreground">Recorrentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{indicadores.produtos_vendidos}</p>
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
              <p className="text-lg font-bold">{indicadores.produtos_estoque}</p>
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
              <p className="text-lg font-bold">{indicadores.clientes_novos}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{indicadores.estoque_baixo}</p>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área para gráficos futuros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho</CardTitle>
          <CardDescription>Os gráficos serão exibidos aqui conforme as vendas forem registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma venda registrada ainda</p>
              <p className="text-xs mt-1">Comece a vender no PDV para ver os gráficos aqui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
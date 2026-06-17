'use client'

import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const relatorios = [
  { nome: 'Relatório de Vendas', descricao: 'Vendas por período, cliente e produto' },
  { nome: 'Relatório de Estoque', descricao: 'Produtos, movimentações e estoque baixo' },
  { nome: 'Relatório Financeiro', descricao: 'Receitas, despesas e fluxo de caixa' },
  { nome: 'Relatório de Empréstimos', descricao: 'Empréstimos ativos, parcelas e inadimplência' },
  { nome: 'Relatório de Clientes', descricao: 'Clientes cadastrados e histórico' },
  { nome: 'Relatório TG', descricao: 'Clientes TG e aplicações' },
]

export default function RelatoriosPage() {
  return (
    <PageLayout title="Relatórios" showSearch={false}>
      <div className="space-y-4">
        <div className="grid gap-3">
          {relatorios.map((relatorio, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{relatorio.nome}</p>
                    <p className="text-xs text-muted-foreground">{relatorio.descricao}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
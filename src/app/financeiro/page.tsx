'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { financeiroService, getUsuarioId } from '@/lib/services'
import type { LancamentoFinanceiro } from '@/types'

interface ResumoFinanceiro {
  receitas: number
  despesas: number
  lucro: number
}

const emptyForm = {
  categoria: '',
  descricao: '',
  valor: '',
  data: '',
  forma_pagamento: '',
  observacoes: '',
}

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])
  const [resumo, setResumo] = useState<ResumoFinanceiro>({ receitas: 0, despesas: 0, lucro: 0 })
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tipoLancamento, setTipoLancamento] = useState<'receita' | 'despesa'>('receita')
  const [formData, setFormData] = useState(emptyForm)

  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        setLoading(false)
        return
      }

      const [{ data, error }, resumoData] = await Promise.all([
        financeiroService.getAll(usuarioId),
        financeiroService.getResumo(usuarioId, mesAtual, anoAtual),
      ])

      if (error) throw error
      setLancamentos(data || [])
      setResumo(resumoData)
    } catch {
      toast.error('Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (tipo: 'receita' | 'despesa') => {
    setTipoLancamento(tipo)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.descricao || !formData.categoria || !formData.valor || !formData.data) {
      toast.error('Preencha descrição, categoria, valor e data')
      return
    }

    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) return

      const payload = {
        tipo: tipoLancamento,
        categoria: formData.categoria,
        descricao: formData.descricao,
        valor: Number(formData.valor),
        data: formData.data,
        forma_pagamento: formData.forma_pagamento || undefined,
        observacoes: formData.observacoes || undefined,
      }

      const { error } = await financeiroService.create(payload, usuarioId)
      if (error) throw error

      toast.success(
        tipoLancamento === 'receita'
          ? 'Receita cadastrada com sucesso!'
          : 'Despesa cadastrada com sucesso!'
      )

      setIsDialogOpen(false)
      setFormData(emptyForm)
      fetchData()
    } catch {
      toast.error('Erro ao salvar lançamento')
    }
  }

  return (
    <PageLayout title="Financeiro" showSearch={false}>
      <div className="space-y-4">
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => openDialog('receita')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
          <Button variant="outline" onClick={() => openDialog('despesa')}>
            <Minus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </div>

        {/* Resumo do mês */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receitas do mês</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(resumo.receitas)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas do mês</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(resumo.despesas)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro do mês</p>
                <p
                  className={`text-xl font-bold ${
                    resumo.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(resumo.lucro)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog (compartilhado entre Receita e Despesa) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {tipoLancamento === 'receita' ? 'Nova Receita' : 'Nova Despesa'}
              </DialogTitle>
              <DialogDescription>
                {tipoLancamento === 'receita'
                  ? 'Registre uma entrada de dinheiro.'
                  : 'Registre uma saída de dinheiro.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex.: Venda de produto, Aluguel..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex.: Vendas, Salários, Fornecedores..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <select
                  id="forma_pagamento"
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais..."
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lista de lançamentos */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="h-12 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lancamentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => openDialog('receita')}>
                  Nova Receita
                </Button>
                <Button variant="outline" onClick={() => openDialog('despesa')}>
                  Nova Despesa
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lancamentos.map((lancamento) => {
              const isReceita = lancamento.tipo === 'receita'
              return (
                <Card key={lancamento.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isReceita ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}
                        >
                          {isReceita ? (
                            <ArrowUpCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lancamento.descricao}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{lancamento.categoria}</span>
                            <span>{formatDate(lancamento.data)}</span>
                          </div>
                        </div>
                      </div>

                      <p
                        className={`font-semibold whitespace-nowrap ${
                          isReceita ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isReceita ? '+' : '-'} {formatCurrency(lancamento.valor)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

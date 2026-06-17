'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  emprestimosService,
  clientesService,
  getUsuarioId,
} from '@/lib/services'

interface EmprestimoRow {
  id: string
  usuario_id: string
  cliente_id: string
  valor: number
  juros: number
  parcelas: number
  data_inicio: string
  data_vencimento: string
  status: 'ativo' | 'concluido' | 'atrasado'
  observacoes?: string
  clientes?: { nome: string } | null
}

interface ClienteOption {
  id: string
  nome: string
}

const statusVariant: Record<EmprestimoRow['status'], 'default' | 'secondary' | 'destructive'> = {
  ativo: 'default',
  concluido: 'secondary',
  atrasado: 'destructive',
}

const statusLabel: Record<EmprestimoRow['status'], string> = {
  ativo: 'Ativo',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
}

const emptyForm = {
  cliente_id: '',
  valor: '',
  juros: '',
  parcelas: '',
  data_inicio: '',
  observacoes: '',
}

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<EmprestimoRow[]>([])
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

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

      const [emprestimosRes, clientesRes] = await Promise.all([
        emprestimosService.getAll(usuarioId),
        clientesService.getAll(usuarioId),
      ])

      if (emprestimosRes.error) throw emprestimosRes.error
      setEmprestimos((emprestimosRes.data as EmprestimoRow[]) || [])
      setClientes((clientesRes.data as ClienteOption[]) || [])
    } catch {
      toast.error('Erro ao carregar empréstimos')
    } finally {
      setLoading(false)
    }
  }

  // Calcula a data de vencimento final somando `parcelas` meses à data de início.
  const calcDataVencimento = (dataInicio: string, parcelas: number): string => {
    const base = new Date(`${dataInicio}T00:00:00`)
    base.setMonth(base.getMonth() + parcelas)
    return base.toISOString().split('T')[0]
  }

  const handleSave = async () => {
    if (!formData.cliente_id) {
      toast.error('Selecione um cliente')
      return
    }
    if (!formData.data_inicio) {
      toast.error('Informe a data de início')
      return
    }

    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) return

      const parcelas = Number(formData.parcelas)
      const data_vencimento = calcDataVencimento(formData.data_inicio, parcelas)

      // Campos opcionais vazios viram undefined; data_vencimento (DATE NOT NULL)
      // é calculada aqui pois não faz parte do EmprestimoFormData.
      const payload = {
        cliente_id: formData.cliente_id,
        valor: Number(formData.valor),
        juros: Number(formData.juros),
        parcelas,
        data_inicio: formData.data_inicio,
        data_vencimento,
        observacoes: formData.observacoes || undefined,
      }

      const { error } = await emprestimosService.create(payload, usuarioId)
      if (error) throw error

      toast.success('Empréstimo cadastrado com sucesso!')
      setIsDialogOpen(false)
      setFormData(emptyForm)
      fetchData()
    } catch {
      toast.error('Erro ao salvar empréstimo')
    }
  }

  const totalEmprestado = emprestimos.reduce((sum, e) => sum + Number(e.valor), 0)
  const ativos = emprestimos.filter((e) => e.status === 'ativo').length

  return (
    <PageLayout title="Empréstimos" showSearch={false}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {emprestimos.length} empréstimo(s) cadastrado(s)
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={<Button />}
              onClick={() => setFormData(emptyForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Empréstimo
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Empréstimo</DialogTitle>
                <DialogDescription>
                  Preencha as informações do empréstimo.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <select
                    id="cliente_id"
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <Label htmlFor="juros">Juros (%) *</Label>
                    <Input
                      id="juros"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.juros}
                      onChange={(e) => setFormData({ ...formData, juros: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="parcelas">Parcelas *</Label>
                    <Input
                      id="parcelas"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.parcelas}
                      onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    />
                  </div>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold">{emprestimos.length}</p>
              <p className="text-xs text-muted-foreground">Total de Empréstimos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold">{ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold">{formatCurrency(totalEmprestado)}</p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="h-16 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : emprestimos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum empréstimo encontrado</p>
              <Button
                variant="link"
                onClick={() => {
                  setFormData(emptyForm)
                  setIsDialogOpen(true)
                }}
                className="mt-2"
              >
                Cadastrar primeiro empréstimo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {emprestimos.map((emprestimo) => (
              <Card key={emprestimo.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {emprestimo.clientes?.nome || 'Cliente'}
                          </p>
                          <Badge variant={statusVariant[emprestimo.status]}>
                            {statusLabel[emprestimo.status]}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Venc.: {formatDate(emprestimo.data_vencimento)}
                          </span>
                          <span>
                            {emprestimo.parcelas}x · {emprestimo.juros}% juros
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(emprestimo.valor)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

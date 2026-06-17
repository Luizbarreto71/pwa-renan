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
import { Plus, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { tgService, clientesService, getUsuarioId } from '@/lib/services'
import type { TGCliente, TGClienteFormData, Cliente } from '@/types'

type TGClienteRow = TGCliente & { clientes?: { nome: string } | null }

const emptyForm: TGClienteFormData = {
  cliente_id: undefined,
  nome: '',
  telefone: '',
  dosagem: '',
  data_compra: '',
  quantidade: 0,
  valor_pago: 0,
  proxima_aplicacao: '',
  observacoes: '',
}

export default function TGPage() {
  const [registros, setRegistros] = useState<TGClienteRow[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<TGClienteFormData>(emptyForm)

  useEffect(() => {
    fetchRegistros()
  }, [])

  const fetchRegistros = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        setLoading(false)
        return
      }

      const [tgRes, clientesRes] = await Promise.all([
        tgService.getAll(usuarioId),
        clientesService.getAll(usuarioId),
      ])

      if (tgRes.error) throw tgRes.error
      setRegistros((tgRes.data as TGClienteRow[]) || [])

      if (!clientesRes.error) {
        setClientes((clientesRes.data as Cliente[]) || [])
      }
    } catch (error) {
      toast.error('Erro ao carregar registros de TG')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) return

      // Campos opcionais vazios viram undefined; datas (DATE) rejeitam "".
      const payload = {
        cliente_id: formData.cliente_id || undefined,
        nome: formData.nome,
        telefone: formData.telefone,
        dosagem: formData.dosagem,
        data_compra: formData.data_compra || undefined,
        quantidade: Number(formData.quantidade),
        valor_pago: Number(formData.valor_pago),
        proxima_aplicacao: formData.proxima_aplicacao || undefined,
        observacoes: formData.observacoes || undefined,
      }

      const { error } = await tgService.create(payload, usuarioId)
      if (error) throw error
      toast.success('Cliente TG cadastrado com sucesso!')

      setIsDialogOpen(false)
      setFormData(emptyForm)
      fetchRegistros()
    } catch (error) {
      toast.error('Erro ao salvar cliente TG')
    }
  }

  return (
    <PageLayout title="TG - Tirzepatida" showSearch={false}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {registros.length} cliente(s) em tratamento
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={<Button />}
              onClick={() => setFormData(emptyForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente TG
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Cliente TG</DialogTitle>
                <DialogDescription>
                  Cadastre um cliente em tratamento com Tirzepatida.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente vinculado (opcional)</Label>
                  <select
                    id="cliente_id"
                    value={formData.cliente_id ?? ''}
                    onChange={(e) => {
                      const id = e.target.value || undefined
                      const cliente = clientes.find((c) => c.id === id)
                      setFormData({
                        ...formData,
                        cliente_id: id,
                        nome: cliente?.nome ?? formData.nome,
                        telefone: cliente?.telefone ?? formData.telefone,
                      })
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Nenhum / cliente avulso</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosagem">Dosagem *</Label>
                  <Input
                    id="dosagem"
                    value={formData.dosagem}
                    onChange={(e) => setFormData({ ...formData, dosagem: e.target.value })}
                    placeholder="Ex.: 2,5 mg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_compra">Data da Compra *</Label>
                  <Input
                    id="data_compra"
                    type="date"
                    value={formData.data_compra}
                    onChange={(e) => setFormData({ ...formData, data_compra: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min={0}
                    value={formData.quantidade}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidade: Number(e.target.value) })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_pago">Valor Pago *</Label>
                  <Input
                    id="valor_pago"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.valor_pago}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_pago: Number(e.target.value) })
                    }
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxima_aplicacao">Próxima Aplicação *</Label>
                  <Input
                    id="proxima_aplicacao"
                    type="date"
                    value={formData.proxima_aplicacao}
                    onChange={(e) =>
                      setFormData({ ...formData, proxima_aplicacao: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <textarea
                    id="observacoes"
                    value={formData.observacoes ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
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
        ) : registros.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <img
                src="/tg-produto.webp"
                alt="Produto TG"
                className="w-24 h-24 mx-auto rounded-xl object-cover mb-4 ring-1 ring-border"
              />
              <h3 className="text-lg font-semibold mb-2">Controle de TG</h3>
              <p className="text-muted-foreground mb-4">
                Gerencie clientes em tratamento com Tirzepatida, registre aplicações e
                acompanhe o histórico.
              </p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                Cadastrar primeiro cliente TG
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {registros.map((registro) => (
              <Card key={registro.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="/tg-produto.webp"
                        alt="Produto TG"
                        className="w-12 h-12 rounded-lg object-cover ring-1 ring-border"
                      />
                      <div>
                        <p className="font-medium">
                          {registro.clientes?.nome || registro.nome}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Dosagem: {registro.dosagem}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(registro.proxima_aplicacao)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold flex items-center gap-1 justify-end">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {formatCurrency(registro.valor_pago)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Próxima aplicação</p>
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

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
import { Plus, ShoppingCart, Trash2, User, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  vendasService,
  clientesService,
  produtosService,
  getUsuarioId,
} from '@/lib/services'

interface VendaListItem {
  id: string
  cliente_id: string
  valor_total: number
  forma_pagamento: 'pix' | 'dinheiro' | 'cartao' | 'transferencia'
  status: 'concluida' | 'pendente' | 'cancelada'
  observacoes?: string
  created_at: string
  clientes?: { nome: string } | null
}

interface ClienteOption {
  id: string
  nome: string
}

interface ProdutoOption {
  id: string
  nome: string
  codigo?: string
  valor_venda: number
}

interface ItemForm {
  produto_id: string
  codigo_peca: string
  quantidade: number
  valor_unitario: number
}

const FORMAS_PAGAMENTO: Array<{ value: VendaListItem['forma_pagamento']; label: string }> = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
]

const FORMA_LABEL: Record<VendaListItem['forma_pagamento'], string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  transferencia: 'Transferência',
}

const STATUS_VARIANT: Record<
  VendaListItem['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  concluida: 'default',
  pendente: 'secondary',
  cancelada: 'destructive',
}

const emptyItem = (): ItemForm => ({ produto_id: '', codigo_peca: '', quantidade: 1, valor_unitario: 0 })

const printNonFiscalCoupon = (params: {
  clienteNome: string
  formaPagamento: VendaListItem['forma_pagamento']
  itens: ItemForm[]
  produtos: ProdutoOption[]
  total: number
  observacoes?: string
  vendaId?: string
}) => {
  const now = new Date()
  const data = now.toLocaleDateString('pt-BR')
  const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const numeroCupom = `CUPOM-${now.getTime().toString(36).toUpperCase()}`
  
  const linhas = params.itens
    .map((item) => {
      const produto = params.produtos.find((p) => p.id === item.produto_id)
      const subtotal = item.quantidade * item.valor_unitario
      return `
        <tr>
          <td>${produto?.nome || 'Produto'}</td>
          <td class="center">${item.quantidade}</td>
          <td class="right">${formatCurrency(item.valor_unitario)}</td>
          <td class="right">${formatCurrency(subtotal)}</td>
        </tr>`
    })
    .join('')

  const formaPagamentoLabel: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    transferencia: 'Transferência',
  }

  // Calcular troco se for dinheiro
  const troco = params.formaPagamento === 'dinheiro' ? params.total : 0

  const printWindow = window.open('', '_blank', 'width=380,height=700')

  if (!printWindow) {
    toast.error('Não foi possível abrir a impressão.')
    return
  }

  printWindow.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <title>Cupom - Brunely Kids</title>
        <style>
          @page { size: 80mm 297mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            color: #000;
            background: #fff;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4mm; margin-bottom: 4mm; }
          .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
          .header .slogan { font-size: 10px; margin-top: 2px; }
          .info { margin-bottom: 4mm; font-size: 11px; }
          .info p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
          th { border-bottom: 1px solid #000; border-top: 1px solid #000; padding: 3px 0; font-size: 10px; text-align: left; }
          th.right { text-align: right; }
          th.center { text-align: center; }
          td { padding: 3px 0; font-size: 11px; }
          td.right { text-align: right; }
          td.center { text-align: center; }
          .total { border-top: 1px dashed #000; padding-top: 4mm; margin-top: 4mm; text-align: center; }
          .total .label { font-size: 10px; }
          .total .value { font-size: 22px; font-weight: bold; margin-top: 2px; }
          .payment-info { text-align: center; margin: 4mm 0; padding: 3mm; border: 1px dashed #000; }
          .payment-info p { font-size: 11px; margin: 2px 0; }
          .divider { border-bottom: 1px dashed #000; margin: 4mm 0; }
          .footer { text-align: center; font-size: 10px; }
          .footer p { margin: 2px 0; }
          .codigo { text-align: center; font-size: 9px; margin: 3mm 0; letter-spacing: 1px; }
          @media print {
            body { margin: 0; padding: 2mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BRUNELY KIDS</h1>
          <p class="slogan">Roupas Infantis com Amor e Estilo</p>
          <p style="font-size:10px;margin-top:2px;">CNPJ: 00.000.000/0001-00</p>
        </div>

        <div class="info">
          <p><strong>CUPOM NÃO FISCAL</strong></p>
          <p>Data: ${data} ${hora}</p>
          <p>Nº: ${numeroCupom}</p>
          <p>Cliente: ${params.clienteNome}</p>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th class="center">QTD</th>
              <th class="right">VALOR</th>
              <th class="right">TOTAL</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>

        <div class="total">
          <p class="label">TOTAL A PAGAR</p>
          <p class="value">${formatCurrency(params.total)}</p>
        </div>

        <div class="payment-info">
          <p><strong>FORMA DE PAGAMENTO</strong></p>
          <p>${formaPagamentoLabel[params.formaPagamento] || params.formaPagamento}</p>
          ${params.formaPagamento === 'dinheiro' ? `
            <p style="margin-top:3mm;">Valor Recebido: ${formatCurrency(troco)}</p>
            <p>Troco: ${formatCurrency(0)}</p>
          ` : ''}
        </div>

        ${params.observacoes ? `
          <div class="divider"></div>
          <div class="info">
            <p><strong>Observações:</strong></p>
            <p>${params.observacoes}</p>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="footer">
          <p>📍 Rua Exemplo, 123 - Centro</p>
          <p>📱 (83) 9XXXX-XXXX</p>
          <p>📧 contato@brunelykids.com.br</p>
          <p style="margin-top:3mm;">🔹 Garantia da peça: 30 dias 🔹</p>
          <p>Conserve este cupom</p>
          <p style="margin-top:2mm;">💖 Obrigado pela preferência!</p>
        </div>

        <div class="codigo">
          <p>${numeroCupom}</p>
          <p>${data} ${hora}</p>
        </div>

        <div class="no-print" style="text-align:center;margin-top:5mm;">
          <button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;background:#e84393;color:#fff;border:none;border-radius:8px;">
            🖨️ IMPRIMIR CUPOM
          </button>
          <br>
          <button onclick="window.close()" style="margin-top:5px;padding:8px 20px;font-size:12px;cursor:pointer;background:#f1f3f5;color:#333;border:1px solid #ccc;border-radius:8px;">
            Fechar
          </button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>`)
  printWindow.document.close()
  printWindow.focus()
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<VendaListItem[]>([])
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [produtos, setProdutos] = useState<ProdutoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')

  const [formData, setFormData] = useState<{
    cliente_id: string
    forma_pagamento: VendaListItem['forma_pagamento']
    observacoes: string
    itens: ItemForm[]
  }>({
    cliente_id: '',
    forma_pagamento: 'pix',
    observacoes: '',
    itens: [emptyItem()],
  })

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

      const [vendasRes, clientesRes, produtosRes] = await Promise.all([
        vendasService.getAll(usuarioId),
        clientesService.getAll(usuarioId),
        produtosService.getAll(usuarioId),
      ])

      if (vendasRes.error) throw vendasRes.error
      if (clientesRes.error) throw clientesRes.error
      if (produtosRes.error) throw produtosRes.error

      setVendas((vendasRes.data as VendaListItem[]) || [])
      setClientes((clientesRes.data as ClienteOption[]) || [])
      setProdutos((produtosRes.data as ProdutoOption[]) || [])
    } catch {
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      forma_pagamento: 'pix',
      observacoes: '',
      itens: [emptyItem()],
    })
    setNovoClienteNome('')
    setNovoClienteTelefone('')
  }

  const addItem = () => {
    setFormData((prev) => ({ ...prev, itens: [...prev.itens, emptyItem()] }))
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index: number, patch: Partial<ItemForm>) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  const normalizeCode = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

  const handleProdutoChange = (index: number, produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId)
    updateItem(index, {
      produto_id: produtoId,
      codigo_peca: produto?.codigo || '',
      valor_unitario: produto ? Number(produto.valor_venda) : 0,
    })
  }

  const handleCodigoPecaChange = (index: number, codigo: string) => {
    const normalizedCodigo = normalizeCode(codigo)
    const produto = produtos.find((p) => normalizeCode(p.codigo || '') === normalizedCodigo)

    updateItem(index, {
      codigo_peca: normalizedCodigo,
      produto_id: produto?.id || '',
      valor_unitario: produto ? Number(produto.valor_venda) : 0,
    })

    if (produto) {
      toast.success(`Peça localizada: ${produto.nome}`)
    }
  }

  const total = formData.itens.reduce(
    (sum, item) => sum + item.quantidade * item.valor_unitario,
    0
  )

  const handleSave = async () => {
    const itensValidos = formData.itens.filter(
      (item) => item.produto_id && item.quantidade > 0
    )

    if (itensValidos.length === 0) {
      toast.error('Adicione pelo menos um item válido')
      return
    }

    setSaving(true)
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        setSaving(false)
        return
      }

      let clienteId = formData.cliente_id
      const nomeClienteNovo = novoClienteNome.trim()

      if (!clienteId && nomeClienteNovo) {
        const clienteJaExiste = clientes.find(
          (cliente) => cliente.nome.toLowerCase() === nomeClienteNovo.toLowerCase()
        )

        if (clienteJaExiste) {
          clienteId = clienteJaExiste.id
        } else {
          const clientePayload = {
            nome: nomeClienteNovo,
            telefone: novoClienteTelefone.trim() || 'Não informado',
            whatsapp: novoClienteTelefone.trim() || 'Não informado',
            cpf: undefined,
            endereco: undefined,
            data_nascimento: undefined,
            observacoes: undefined,
          }

          const { data: clienteCriado, error: clienteError } = await clientesService.create(
            clientePayload,
            usuarioId
          )

          if (clienteError) throw clienteError
          clienteId = clienteCriado?.id
        }
      }

      if (!clienteId) {
        toast.error('Selecione um cliente existente ou cadastre um novo cliente')
        return
      }

      const vendaData = {
        cliente_id: clienteId,
        forma_pagamento: formData.forma_pagamento,
        observacoes: formData.observacoes || undefined,
        itens: itensValidos.map((item) => ({
          produto_id: item.produto_id,
          quantidade: Number(item.quantidade),
          valor_unitario: Number(item.valor_unitario),
        })),
      }

      await vendasService.create(vendaData, usuarioId)
      const clienteNome = clientes.find((cliente) => cliente.id === clienteId)?.nome || novoClienteNome.trim() || 'Cliente'

      toast.success('Venda registrada com sucesso!')

        printNonFiscalCoupon({
          clienteNome,
          formaPagamento: formData.forma_pagamento,
          itens: formData.itens,
          produtos,
          total,
          observacoes: formData.observacoes || undefined,
        })

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch {
      toast.error('Erro ao registrar venda')
    } finally {
      setSaving(false)
    }
  }

  const totalFaturado = vendas.reduce((sum, v) => sum + Number(v.valor_total), 0)

  return (
    <PageLayout title="Vendas" showSearch={false}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Registro de vendas</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={<Button />}
              onClick={() => {
                resetForm()
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Venda</DialogTitle>
                <DialogDescription>
                  Selecione o cliente, os produtos e a forma de pagamento.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente existente</Label>
                  <select
                    id="cliente"
                    value={formData.cliente_id}
                    onChange={(e) =>
                      setFormData({ ...formData, cliente_id: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um cliente cadastrado</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novoClienteNome">Cadastrar cliente agora</Label>
                  <Input
                    id="novoClienteNome"
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                    placeholder="Digite o nome do cliente para salvar automaticamente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novoClienteTelefone">Telefone do cliente</Label>
                  <Input
                    id="novoClienteTelefone"
                    value={novoClienteTelefone}
                    onChange={(e) => setNovoClienteTelefone(e.target.value)}
                    placeholder="Opicional - se não preencher, será salvo como 'Não informado'"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <select
                    id="forma_pagamento"
                    value={formData.forma_pagamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        forma_pagamento: e.target
                          .value as VendaListItem['forma_pagamento'],
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <option key={fp.value} value={fp.value}>
                        {fp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Itens *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.itens.map((item, index) => {
                      const subtotal = item.quantidade * item.valor_unitario
                      return (
                        <div
                          key={index}
                          className="rounded-md border border-input p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <select
                              value={item.produto_id}
                              onChange={(e) =>
                                handleProdutoChange(index, e.target.value)
                              }
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecione um produto</option>
                              {produtos.map((produto) => (
                                <option key={produto.id} value={produto.id}>
                                  {produto.nome}
                                </option>
                              ))}
                            </select>
                            {formData.itens.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="text-destructive shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Código da peça</Label>
                            <Input
                              value={item.codigo_peca}
                              onChange={(e) => handleCodigoPecaChange(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                }
                              }}
                              placeholder="Escaneie com leitor de código de barras"
                              autoComplete="off"
                              inputMode="text"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Quantidade</Label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantidade}
                                onChange={(e) =>
                                  updateItem(index, {
                                    quantidade: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Valor unitário</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.valor_unitario}
                                onChange={(e) =>
                                  updateItem(index, {
                                    valor_unitario: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground text-right">
                            Subtotal: {formatCurrency(subtotal)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    placeholder="Informações adicionais..."
                    className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Registrar Venda'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold">{vendas.length}</p>
              <p className="text-xs text-muted-foreground">Total de Vendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold">{formatCurrency(totalFaturado)}</p>
              <p className="text-xs text-muted-foreground">Faturamento</p>
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
        ) : vendas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma venda registrada</p>
              <Button
                variant="link"
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
                className="mt-2"
              >
                Registrar primeira venda
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {vendas.map((venda) => (
              <Card key={venda.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {venda.clientes?.nome || 'Cliente removido'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {FORMA_LABEL[venda.forma_pagamento]}
                          </span>
                          <span>{formatDate(venda.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold">{formatCurrency(venda.valor_total)}</p>
                      <Badge variant={STATUS_VARIANT[venda.status]}>
                        {venda.status}
                      </Badge>
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Plus, Trash2, ShoppingCart, CreditCard, DollarSign, QrCode, Barcode, X, Check, Printer, Package, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { produtosService, clientesService, getUsuarioId } from '@/lib/services'
import type { Produto, Cliente } from '@/types'

interface ItemCarrinho {
  produto: Produto
  quantidade: number
  valor_unitario: number
  desconto: number
}

const BEEP_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"

export default function PDVPage() {
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'dinheiro' | 'cartao' | 'transferencia'>('pix')
  const [desconto, setDesconto] = useState(0)
  const [finalizando, setFinalizando] = useState(false)
  const [ultimaVendaId, setUltimaVendaId] = useState<string | null>(null)
  const buscaRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    carregarDados()
    
    // Log para debug
    console.log('PDV iniciado')
  }, [])

  useEffect(() => {
    // Beep sound
    audioRef.current = new Audio(BEEP_SOUND)
    audioRef.current.volume = 0.3

    // Atalho de teclado para busca (F2)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        buscaRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const carregarDados = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        toast.error('Usuário não autenticado')
        return
      }

      const [produtosRes, clientesRes] = await Promise.all([
        produtosService.getAll(usuarioId),
        clientesService.getAll(usuarioId),
      ])

      if (produtosRes.error) {
        console.error('Erro ao carregar produtos:', produtosRes.error)
        toast.error('Erro ao carregar produtos')
      } else if (produtosRes.data) {
        setProdutos(produtosRes.data)
        console.log('Produtos carregados:', produtosRes.data.length)
      }

      if (clientesRes.error) {
        console.error('Erro ao carregar clientes:', clientesRes.error)
      } else if (clientesRes.data) {
        setClientes(clientesRes.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  const tocarBeep = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  const adicionarProduto = (produto: Produto) => {
    try {
      tocarBeep()
      
      // Validações
      if (!produto || !produto.id) {
        toast.error('Produto inválido')
        return
      }

      if (produto.quantidade <= 0) {
        toast.error('Produto sem estoque disponível')
        return
      }

      const valorVenda = Number(produto.valor_venda)
      if (isNaN(valorVenda) || valorVenda <= 0) {
        toast.error('Produto sem preço de venda cadastrado')
        return
      }

      const existente = carrinho.find(item => item.produto.id === produto.id)

      if (existente) {
        if (existente.quantidade >= produto.quantidade) {
          toast.error('Estoque máximo atingido')
          return
        }
        setCarrinho(carrinho.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        ))
      } else {
        setCarrinho([...carrinho, {
          produto,
          quantidade: 1,
          valor_unitario: valorVenda,
          desconto: 0,
        }])
      }
      
      setBusca('')
      buscaRef.current?.focus()
      
      // Feedback visual
      toast.success(`${produto.nome} adicionado ao carrinho`)
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      toast.error('Erro ao adicionar produto')
    }
  }

  const removerProduto = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId))
  }

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(carrinho.map(item => {
      if (item.produto.id === produtoId) {
        const novaQtd = item.quantidade + delta
        return novaQtd > 0 ? { ...item, quantidade: novaQtd } : item
      }
      return item
    }))
  }

  const subtotal = carrinho.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0)
  const total = subtotal - desconto

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast.error('Adicione produtos ao carrinho')
      return
    }

    setFinalizando(true)
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) return

      // Aqui você salvaria a venda no Supabase
      // Por enquanto, apenas simula
      const vendaId = `venda-${Date.now()}`
      setUltimaVendaId(vendaId)

      toast.success('Venda finalizada com sucesso!')

      // Limpar carrinho
      setCarrinho([])
      setClienteSelecionado(null)
      setDesconto(0)
      setFormaPagamento('pix')

      // Imprimir cupom
      setTimeout(() => {
        imprimirCupom(vendaId)
      }, 500)
    } catch {
      toast.error('Erro ao finalizar venda')
    } finally {
      setFinalizando(false)
    }
  }

  const imprimirCupom = (vendaId: string) => {
    const now = new Date()
    const data = now.toLocaleDateString('pt-BR')
    const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const numeroCupom = `CUPOM-${now.getTime().toString(36).toUpperCase()}`

    const linhas = carrinho.map(item => `
      <tr>
        <td>${item.produto.nome}</td>
        <td class="center">${item.quantidade}</td>
        <td class="right">${formatCurrency(item.valor_unitario)}</td>
        <td class="right">${formatCurrency(item.quantidade * item.valor_unitario)}</td>
      </tr>
    `).join('')

    const formaPagamentoLabel: Record<string, string> = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      transferencia: 'Transferência',
    }

    const printWindow = window.open('', '_blank', 'width=380,height=700')
    if (!printWindow) {
      toast.error('Não foi possível abrir a impressão.')
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Cupom - ${numeroCupom}</title>
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
            .header h1 { font-size: 18px; font-weight: bold; }
            .info { margin-bottom: 4mm; font-size: 11px; }
            .info p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
            th { border-bottom: 1px solid #000; border-top: 1px solid #000; padding: 3px 0; font-size: 10px; text-align: left; }
            th.right, th.center { text-align: right; }
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
            @media print { body { margin: 0; padding: 2mm; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BRUNELY KIDS</h1>
            <p style="font-size:10px;">Roupas Infantis com Amor e Estilo</p>
            <p style="font-size:10px;">CNPJ: 00.000.000/0001-00</p>
          </div>

          <div class="info">
            <p><strong>CUPOM NÃO FISCAL</strong></p>
            <p>Data: ${data} ${hora}</p>
            <p>Nº: ${numeroCupom}</p>
            <p>Cliente: ${clienteSelecionado?.nome || 'Não informado'}</p>
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
            <p class="value">${formatCurrency(total)}</p>
          </div>

          <div class="payment-info">
            <p><strong>FORMA DE PAGAMENTO</strong></p>
            <p>${formaPagamentoLabel[formaPagamento] || formaPagamento}</p>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p>📍 Rua Exemplo, 123 - Centro</p>
            <p>📱 (83) 9XXXX-XXXX</p>
            <p>📧 contato@brunelykids.com.br</p>
            <p style="margin-top:3mm;">🔹 Garantia da peça: 30 dias 🔹</p>
            <p>💖 Obrigado pela preferência!</p>
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
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>`)
    printWindow.document.close()
    printWindow.focus()
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo_interno?.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo_barras?.includes(busca)
  )

  return (
    <PageLayout title="PDV - Caixa" showSearch={false}>
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        {/* Coluna Esquerda - Busca e Produtos */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Busca */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={buscaRef}
                  placeholder="Buscar produto ou código de barras... (F2)"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && produtosFiltrados.length > 0) {
                      adicionarProduto(produtosFiltrados[0])
                    }
                  }}
                  className="pl-10 h-12 text-lg"
                />
                {busca && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setBusca('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Lista de produtos */}
              {busca && (
                <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                  {produtosFiltrados.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    produtosFiltrados.map(produto => (
                      <button
                        key={produto.id}
                        onClick={() => adicionarProduto(produto)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {produto.categoria} • Estoque: {produto.quantidade}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-primary">
                          {formatCurrency(Number(produto.valor_venda))}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Cliente</p>
                  <p className="text-xs text-muted-foreground">
                    {clienteSelecionado?.nome || 'Não informado'}
                  </p>
                </div>
                {clienteSelecionado && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setClienteSelecionado(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Carrinho e Finalização */}
        <div className="flex flex-col gap-4">
          {/* Carrinho */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="w-5 h-5" />
                Carrinho ({carrinho.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {carrinho.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Carrinho vazio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrinho.map(item => (
                    <div key={item.produto.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.valor_unitario)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => alterarQuantidade(item.produto.id, -1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantidade}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => alterarQuantidade(item.produto.id, 1)}
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removerProduto(item.produto.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo e Pagamento */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <Input
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    className="w-24 h-8 text-right"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={formaPagamento === 'pix' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('pix')}
                  className="w-full"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  PIX
                </Button>
                <Button
                  variant={formaPagamento === 'dinheiro' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('dinheiro')}
                  className="w-full"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Dinheiro
                </Button>
                <Button
                  variant={formaPagamento === 'cartao' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('cartao')}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cartão
                </Button>
                <Button
                  variant={formaPagamento === 'transferencia' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('transferencia')}
                  className="w-full"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Transferência
                </Button>
              </div>

              <Button
                onClick={finalizarVenda}
                disabled={finalizando || carrinho.length === 0}
                className="w-full h-12 text-base font-semibold"
              >
                {finalizando ? (
                  <span className="animate-pulse">Finalizando...</span>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Finalizar Venda
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
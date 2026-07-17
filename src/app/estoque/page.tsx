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
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { produtosService, getUsuarioId } from '@/lib/services'
import type { Produto } from '@/types'

const normalizeCode = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

const generatePieceCode = (nome: string, categoria: string) => {
  const nomePart = normalizeCode(nome).slice(0, 3) || 'PEC'
  const categoriaPart = normalizeCode(categoria).slice(0, 3) || 'GEN'
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${nomePart}-${categoriaPart}-${suffix}`
}

const printEtiqueta = (produto: { nome: string; categoria: string; codigo?: string }) => {
  const printWindow = window.open('', '_blank', 'width=420,height=640')

  if (!printWindow) {
    toast.error('Não foi possível abrir a janela de impressão da etiqueta.')
    return
  }

  const codigo = produto.codigo || 'SEM-CODIGO'
  const tamanho = produto.categoria || 'Tamanho não informado'

  printWindow.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <title>Etiqueta - ${produto.nome}</title>
        <style>
          @page { size: 90mm 55mm; margin: 0; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
            color: #111;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .label {
            width: 88mm;
            height: 52mm;
            border: 2px solid #111;
            box-sizing: border-box;
            padding: 10px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
          }
          .brand { font-size: 16px; font-weight: 700; text-transform: uppercase; }
          .title { font-size: 17px; font-weight: 700; }
          .meta { font-size: 12px; }
          .code { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
          .footer { font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">Brunely Kids</div>
          <div class="title">${produto.nome}</div>
          <div class="meta">Tamanho / categoria: ${tamanho}</div>
          <div class="code">${codigo}</div>
          <div class="footer">Roupa infantil • código da peça</div>
        </div>
      </body>
    </html>`)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const emptyForm = {
    nome: '',
    categoria: '',
    codigo: '',
    quantidade: 0,
    quantidade_minima: 0,
    valor_compra: 0,
    valor_venda: 0,
    fornecedor: '',
  }

  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        setLoading(false)
        return
      }

      const { data, error } = await produtosService.getAll(usuarioId)

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = () => {
    if (!formData.nome || !formData.categoria) {
      toast.error('Preencha nome e tamanho/categoria antes de gerar o código.')
      return
    }

    const generatedCode = generatePieceCode(formData.nome, formData.categoria)
    setFormData((prev) => ({ ...prev, codigo: generatedCode }))
    toast.success('Código da peça gerado com sucesso!')
  }

  const handleSave = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        toast.error('Usuário não identificado')
        return
      }

      if (!formData.nome || !formData.categoria) {
        toast.error('Preencha nome e tamanho/categoria')
        return
      }

      const codigoFinal = formData.codigo?.trim()
        ? normalizeCode(formData.codigo)
        : generatePieceCode(formData.nome, formData.categoria)

      const payload = {
        nome: formData.nome,
        categoria: formData.categoria,
        codigo: codigoFinal,
        quantidade: Number(formData.quantidade),
        quantidade_minima: Number(formData.quantidade_minima),
        valor_custo: Number(formData.valor_compra),
        valor_venda: Number(formData.valor_venda),
        fornecedor: formData.fornecedor || undefined,
      }

      const { error } = await produtosService.create(payload, usuarioId)
      if (error) {
        console.error('Erro ao salvar produto:', error)
        throw error
      }

      toast.success('Produto cadastrado com sucesso!')
      setIsDialogOpen(false)
      setFormData(emptyForm)
      fetchProdutos()
    } catch (error: any) {
      console.error('Erro completo:', error)
      const mensagem = error?.message || 'Erro ao salvar produto'
      toast.error(mensagem)
    }
  }

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockCount = produtos.filter(
    p => Number(p.quantidade) <= Number(p.quantidade_minima)
  ).length

  return (
    <PageLayout title="Estoque" showSearch={false}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={<Button />}
              onClick={() => {
                setFormData(emptyForm)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha as informações do produto.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Tamanho / categoria *</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: P, M, G, 4 anos, 6 anos"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="codigo">Código da peça</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateCode}>
                      Gerar código
                    </Button>
                  </div>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Código / SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      const codigoEtiqueta = formData.codigo?.trim() || generatePieceCode(formData.nome || 'PEC', formData.categoria || 'GEN')
                      printEtiqueta({
                        nome: formData.nome || 'Produto sem nome',
                        categoria: formData.categoria || 'Tamanho não informado',
                        codigo: codigoEtiqueta,
                      })
                    }}
                  >
                    Gerar etiqueta (padrão infantil)
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min={0}
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade_minima">Estoque mínimo</Label>
                    <Input
                      id="quantidade_minima"
                      type="number"
                      min={0}
                      value={formData.quantidade_minima}
                      onChange={(e) => setFormData({ ...formData, quantidade_minima: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="valor_compra">Valor de compra</Label>
                    <Input
                      id="valor_compra"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.valor_compra}
                      onChange={(e) => setFormData({ ...formData, valor_compra: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_venda">Valor de venda</Label>
                    <Input
                      id="valor_venda"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.valor_venda}
                      onChange={(e) => setFormData({ ...formData, valor_venda: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Nome do fornecedor"
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
              <p className="text-2xl font-bold">{produtos.length}</p>
              <p className="text-xs text-muted-foreground">Total de Produtos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-destructive' : ''}`}>
                {lowStockCount}
              </p>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="h-16 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProdutos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
              <Button
                variant="link"
                onClick={() => {
                  setFormData(emptyForm)
                  setIsDialogOpen(true)
                }}
                className="mt-2"
              >
                Cadastrar primeiro produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProdutos.map(produto => {
              const isLowStock = Number(produto.quantidade) <= Number(produto.quantidade_minima)
              return (
                <Card key={produto.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLowStock ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                          {isLowStock ? (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          ) : (
                            <Package className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{produto.nome}</p>
                            <Badge variant="secondary">{produto.categoria}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                              Estoque: {produto.quantidade} / mín. {produto.quantidade_minima}
                            </span>
                            {produto.codigo_interno && <span>Cód.: {produto.codigo_interno}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(produto.valor_venda)}</p>
                        {isLowStock && (
                          <Badge variant="destructive" className="mt-1">Estoque baixo</Badge>
                        )}
                      </div>
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

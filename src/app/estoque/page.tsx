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

  const handleSave = async () => {
    try {
      const usuarioId = await getUsuarioId()
      if (!usuarioId) {
        toast.error('Usuário não identificado')
        return
      }

      if (!formData.nome || !formData.categoria) {
        toast.error('Preencha nome e categoria')
        return
      }

      // Campos opcionais vazios viram undefined (não '').
      const payload = {
        nome: formData.nome,
        categoria: formData.categoria,
        codigo: formData.codigo || undefined,
        quantidade: Number(formData.quantidade),
        quantidade_minima: Number(formData.quantidade_minima),
        valor_compra: Number(formData.valor_compra),
        valor_venda: Number(formData.valor_venda),
        fornecedor: formData.fornecedor || undefined,
      }

      const { error } = await produtosService.create(payload, usuarioId)
      if (error) throw error

      toast.success('Produto cadastrado com sucesso!')
      setIsDialogOpen(false)
      setFormData(emptyForm)
      fetchProdutos()
    } catch (error) {
      toast.error('Erro ao salvar produto')
    }
  }

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Bebidas, Limpeza..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Código / SKU"
                  />
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
                            {produto.codigo && <span>Cód.: {produto.codigo}</span>}
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

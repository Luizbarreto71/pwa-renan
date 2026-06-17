'use client'

import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Bell, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NotifPrefs {
  estoque: boolean
  parcelas: boolean
}

export default function ConfigPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [prefs, setPrefs] = useState<NotifPrefs>({ estoque: true, parcelas: true })

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email ?? '')
          const { data: profile } = await supabase
            .from('usuarios')
            .select('nome, email')
            .eq('user_id', user.id)
            .maybeSingle()
          if (profile) {
            setNome(profile.nome ?? '')
            setEmail(profile.email ?? user.email ?? '')
          }
        }
        const saved = localStorage.getItem('notif-prefs')
        if (saved) setPrefs(JSON.parse(saved))
      } catch {
        // mantém valores padrão
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('usuarios')
        .update({ nome, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      if (error) throw error
      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar o perfil')
    } finally {
      setSaving(false)
    }
  }

  const togglePref = (key: keyof NotifPrefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('notif-prefs', JSON.stringify(next))
      return next
    })
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      router.push('/auth')
    }
  }

  return (
    <PageLayout title="Configurações" showSearch={false}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil
            </CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado por aqui.
              </p>
            </div>
            <Button onClick={handleSaveProfile} disabled={loading || saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure alertas e notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Estoque baixo</p>
                <p className="text-xs text-muted-foreground">
                  Receber alerta quando produto estiver com estoque mínimo
                </p>
              </div>
              <Button
                variant={prefs.estoque ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePref('estoque')}
              >
                {prefs.estoque ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Vencimento de parcelas</p>
                <p className="text-xs text-muted-foreground">
                  Receber alerta de parcelas vencendo
                </p>
              </div>
              <Button
                variant={prefs.parcelas ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePref('parcelas')}
              >
                {prefs.parcelas ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="w-5 h-5" />
              Sessão
            </CardTitle>
            <CardDescription>
              Encerre sua sessão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              Sair do sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, LogOut, RefreshCw } from 'lucide-react'

export default function AguardandoAprovacaoPage() {
  const [email, setEmail] = useState<string>('')
  const [checking, setChecking] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      setEmail(data.user.email ?? '')
    }
    load()
  }, [supabase, router])

  // Reverifica se o admin já aprovou; o proxy redireciona ao dashboard
  // assim que `aprovado` virar true.
  const verificar = async () => {
    setChecking(true)
    try {
      router.refresh()
      router.replace('/dashboard')
    } finally {
      setChecking(false)
    }
  }

  const sair = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-500/5" />

      <Card className="w-full max-w-md relative z-10 animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Aguardando aprovação</CardTitle>
          <CardDescription>
            Sua conta foi criada e está pendente de aprovação do administrador.
            Você receberá acesso assim que ela for liberada.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {email && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Conta</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            type="button"
            className="w-full gradient-primary"
            onClick={verificar}
            disabled={checking}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Já fui aprovado
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={sair}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

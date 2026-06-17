'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { ArrowLeft, LayoutDashboard, Users, BarChart3, ShieldCheck } from 'lucide-react'

const adminNav = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard, exact: true },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users, exact: false },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, exact: false },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Inicializa tema (mesma lógica do PageLayout).
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Guarda de acesso (defesa em profundidade, além do proxy).
    const check = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle()
      if (perfil?.role === 'admin') {
        setStatus('ok')
      } else {
        setStatus('denied')
        router.replace('/dashboard')
      }
    }
    check()
  }, [supabase, router])

  if (status !== 'ok') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-spin" />
          <p className="text-muted-foreground text-sm">
            {status === 'denied' ? 'Acesso restrito ao administrador...' : 'Carregando...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border safe-area-top">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Painel Admin</h1>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao app
            </Link>
          </div>
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {adminNav.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">{children}</main>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  )
}

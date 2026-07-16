'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { UserProfile } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pdv', label: 'PDV Caixa' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/estoque', label: 'Estoque' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/financeiro', label: 'Financeiro' },
  { href: '/relatorios', label: 'Relatórios' },
  { href: '/config', label: 'Configurações' },
]

interface HeaderProps {
  title?: string
  showSearch?: boolean
  notifications?: number
}

export function Header({ title, showSearch = true, notifications = 0 }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()
      setUser(profile)
    }
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
    localStorage.setItem('theme', !isDark ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BK'
  }

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden -ml-2" />}
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b gradient-brand-subtle">
                <SheetTitle>
                  <span className="text-lg font-bold gradient-brand bg-clip-text text-transparent">
                    Brunely Kids
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">BK</span>
            </div>
            <span className="font-semibold text-base hidden sm:block">
              Brunely Kids
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Global Search Desktop */}
          {showSearch && (
            <form onSubmit={handleGlobalSearch} className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos, clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 lg:w-72 pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 text-sm"
              />
            </form>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="relative" />
              }
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {notifications > 99 ? '99+' : notifications}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                {notifications > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {notifications} novas
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {notifications === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition">
                      <p className="text-sm font-medium">Estoque baixo</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vestido Alice - Tamanho 2 está com estoque mínimo
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Há 2 horas</p>
                    </div>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="relative rounded-full" />
              }
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar_url} alt={user?.nome} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user?.nome ? getInitials(user.nome) : 'BK'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.avatar_url} alt={user?.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.nome ? getInitials(user.nome) : 'BK'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.nome || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'Administrador' :
                       user?.role === 'gerente' ? 'Gerente' :
                       user?.role === 'caixa' ? 'Caixa' : 'Estoquista'}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/config')}>
                <User className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <ShieldCheck className="w-4 h-4" />
                  Painel Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleGlobalSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 h-10 bg-muted/50 border-none text-sm"
            />
          </form>
        </div>
      )}
    </header>
  )
}
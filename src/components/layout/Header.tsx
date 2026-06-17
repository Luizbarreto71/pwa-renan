'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, Menu, Sun, Moon, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface HeaderProps {
  title?: string
  showSearch?: boolean
  notifications?: number
}

export function Header({ title, showSearch = true, notifications = 0 }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check theme
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)

    // Get user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('usuarios')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
        setUser(profile)
      }
    }
    getUser()
  }, [supabase])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
    localStorage.setItem('theme', !isDark ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="-ml-2" />}>
            <Menu className="w-5 h-5" />
            <span className="sr-only">Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left">
                <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                  PWA Gestão
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="p-4 space-y-1">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/tg', label: 'TG' },
                { href: '/estoque', label: 'Estoque' },
                { href: '/clientes', label: 'Clientes' },
                { href: '/vendas', label: 'Vendas' },
                { href: '/emprestimos', label: 'Empréstimos' },
                { href: '/financeiro', label: 'Financeiro' },
                { href: '/relatorios', label: 'Relatórios' },
                { href: '/config', label: 'Configurações' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Title */}
        <div className="flex-1 md:flex-none">
          <h1 className={cn(
            "text-lg font-semibold hidden md:block",
            title && "text-base"
          )}>
            {title || 'PWA Gestão'}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search - Desktop */}
          {showSearch && (
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-64 pl-9 h-9 bg-muted/50"
              />
            </div>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {notifications > 99 ? '99+' : notifications}
                </Badge>
              )}
              <span className="sr-only">Notificações</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {notifications === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  <DropdownMenuItem className="p-3">
                    <div>
                      <p className="font-medium text-sm">Estoque baixo</p>
                      <p className="text-xs text-muted-foreground">
                        Produto X está com estoque mínimo
                      </p>
                    </div>
                  </DropdownMenuItem>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative overflow-hidden"
                  aria-label="Menu do usuário"
                />
              }
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.nome}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{user?.nome || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email || 'email@exemplo.com'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/config" />}>
                <User className="w-4 h-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full pl-9 h-9 bg-muted/50"
            />
          </div>
        </div>
      )}
    </header>
  )
}
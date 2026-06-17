'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Header } from './Header'
import { BottomNav, DesktopNav } from './BottomNav'
import { Toaster } from '@/components/ui/sonner'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  showSearch?: boolean
  notifications?: number
}

export function PageLayout({
  children,
  title,
  showSearch = true,
  notifications = 0,
}: PageLayoutProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNav />

      {/* Header */}
      <Header
        title={title}
        showSearch={showSearch}
        notifications={notifications}
      />

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />

      {/* Toaster for notifications */}
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
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tg/:path*',
    '/estoque/:path*',
    '/clientes/:path*',
    '/vendas/:path*',
    '/emprestimos/:path*',
    '/financeiro/:path*',
    '/relatorios/:path*',
    '/config/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/auth',
  ],
}

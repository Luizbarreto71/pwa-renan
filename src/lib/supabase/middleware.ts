import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/tg',
    '/estoque',
    '/clientes',
    '/vendas',
    '/emprestimos',
    '/cartoes',
    '/financeiro',
    '/relatorios',
    '/config',
    '/admin',
  ]

  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  // O painel admin exige role 'admin'.
  const isAdminPath = pathname.startsWith('/admin')

  // Página onde aguardam os usuários ainda não aprovados.
  const isPendingPath = pathname.startsWith('/auth/aguardando')

  // Páginas de auth de onde um usuário logado deve ser tirado (mandado ao
  // dashboard). Exceto a rota de callback e a de redefinir senha, que precisam
  // rodar mesmo com sessão (a recuperação de senha autentica via link do email),
  // e exceto a tela de aguardando aprovação (que é para usuários logados).
  const isAuthPath =
    pathname.startsWith('/auth') &&
    !pathname.startsWith('/auth/callback') &&
    !pathname.startsWith('/auth/redefinir-senha') &&
    !isPendingPath

  if (!user && isProtectedPath) {
    // No user session, redirect to auth
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Carrega o perfil para decidir aprovação e permissão de admin.
  // (Consulta leve por índice em user_id; checagem otimista no proxy.)
  let perfil: { role: string; aprovado: boolean; ativo: boolean | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('usuarios')
      .select('role, aprovado, ativo')
      .eq('user_id', user.id)
      .maybeSingle()
    perfil = data
  }

  const isAdmin = perfil?.role === 'admin'
  // Admin nunca precisa de aprovação. Demais usuários precisam estar
  // aprovados e ativos.
  const liberado = isAdmin || (!!perfil?.aprovado && perfil?.ativo !== false)

  if (user && !liberado) {
    // Usuário logado porém não aprovado: só pode ficar na tela de aguardando.
    if (!isPendingPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/aguardando'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Usuário já liberado não deve permanecer na tela de aguardando.
  if (user && liberado && isPendingPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Apenas admins acessam o painel admin.
  if (user && isAdminPath && !isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    // User is already authenticated, redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new Response object with NextResponse.next() make sure to:
  // 1. Pass the request headers to the new Response object.
  // 2. Set the 'Set-Cookie' header from the supabaseResponse on the new Response object.
  return supabaseResponse
}
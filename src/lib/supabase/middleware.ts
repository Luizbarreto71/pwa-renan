import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/config'

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabaseEnv()

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // Páginas de auth de onde um usuário logado deve ser tirado (mandado ao
  // dashboard). Exceto a rota de callback e a de redefinir senha, que precisam
  // rodar mesmo com sessão (a recuperação de senha autentica via link do email).
  const isAuthPath =
    pathname.startsWith('/auth') &&
    !pathname.startsWith('/auth/callback') &&
    !pathname.startsWith('/auth/redefinir-senha')

  const hasSessionCookie = request.cookies.getAll().some(({ name }) =>
    name.startsWith('sb-') || name.startsWith('supabase')
  )

  let user: { id: string } | null = null

  if (!isConfigured) {
    console.warn('[auth] Supabase não configurado. Fluxo público será mantido.')
    return supabaseResponse
  }

  if (hasSessionCookie) {
    const supabase = createServerClient(url, anonKey, {
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
    })

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    } catch (error) {
      console.warn('[auth] Supabase indisponível; permitindo fluxo público sem sessão.', error)
    }
  }

  if (!user && isProtectedPath) {
    // No user session, redirect to auth
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Carrega o perfil para decidir permissão de admin e o status de ativação.
  // (Consulta leve por índice em user_id; checagem otimista no proxy.)
  let perfil: { role: string; ativo: boolean | null } | null = null
  if (user) {
    try {
      const { data } = await createServerClient(url, anonKey, {
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
      })
        .from('usuarios')
        .select('role, ativo')
        .eq('user_id', user.id)
        .maybeSingle()
      perfil = data
    } catch (error) {
      console.warn('[auth] Falha ao consultar perfil do usuário.', error)
    }
  }

  const isAdmin = perfil?.role === 'admin'
  const liberado = isAdmin || perfil?.ativo !== false

  if (user && !liberado) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
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
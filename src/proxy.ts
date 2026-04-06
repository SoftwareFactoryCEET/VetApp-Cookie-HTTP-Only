import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/* ============================================================
   PROXY (reemplaza middleware en Next.js 16)
   Protege rutas a nivel servidor antes de renderizar.
   - /pacientes y /admin requieren sesión activa.
   - /admin requiere rol 'admin' en el JWT.
   ============================================================ */

export function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  // Cliente Supabase SSR para leer la sesión desde las cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Verificar sesión (no usar getSession — usa getUser para seguridad)
  return supabase.auth.getUser().then(({ data: { user } }) => {
    const pathname = req.nextUrl.pathname

    /* ---------- Rutas protegidas que requieren login ---------- */
    const rutasProtegidas = ['/pacientes', '/admin']
    const esProtegida = rutasProtegidas.some(r => pathname.startsWith(r))

    if (esProtegida && !user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    /* ---------- /admin solo para administradores ---------- */
    if (pathname.startsWith('/admin')) {
      const rolUsuario = user?.app_metadata?.user_role
      if (rolUsuario !== 'admin') {
        return NextResponse.redirect(new URL('/pacientes', req.url))
      }
    }

    /* ---------- Redirigir a /pacientes si ya está autenticado ---------- */
    if ((pathname === '/login' || pathname === '/registro') && user) {
      return NextResponse.redirect(new URL('/pacientes', req.url))
    }

    return res
  })
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}

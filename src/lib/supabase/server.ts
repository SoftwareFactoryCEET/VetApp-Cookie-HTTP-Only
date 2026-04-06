import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Crea un cliente Supabase para Server Components y Route Handlers.
 * Lee y escribe cookies HTTP-only para mantener la sesión en SSR.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // El proxy.ts se encarga del refresh de cookies en Server Components
          }
        },
      },
    }
  )
}

import { createClient } from '@/lib/supabase/clients'
import { UserSessionSchema } from '@/types/domain/profile.schema'
import type { IAuthRepository } from '../IAuthRepository'
import type { UserSession } from '@/types/domain/profile.schema'

/* ============================================================
   IMPLEMENTACIÓN: Supabase Auth Repository
   El user_role se lee decodificando el JWT access_token,
   donde el Custom Access Token Hook lo inyecta como claim
   de primer nivel (NO está en app_metadata).
   ============================================================ */

/** Decodifica el payload del JWT sin verificar la firma (solo lectura de claims) */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

/** Construye una UserSession a partir del user y el access_token */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSession(user: any, accessToken?: string): UserSession | null {
  if (!user) return null
  try {
    const claims = accessToken ? decodeJwt(accessToken) : {}
    return UserSessionSchema.parse({
      id:        user.id,
      email:     user.email,
      // El Custom Access Token Hook inyecta user_role en los claims del JWT
      user_role: claims.user_role ?? user.app_metadata?.user_role ?? 'owner',
    })
  } catch {
    return null
  }
}

export class SupabaseAuthRepository implements IAuthRepository {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth
      .signInWithPassword({ email, password })
    if (error) return { session: null, error: error.message }
    return {
      session: parseSession(data.user, data.session?.access_token),
      error: null,
    }
  }

  async signUp(email: string, password: string, fullName?: string) {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? '' } },
    })
    return { error: error?.message ?? null }
  }

  async signOut() {
    await this.supabase.auth.signOut()
  }

  async getCurrentSession(): Promise<UserSession | null> {
    // getSession() devuelve el access_token con los custom claims del JWT
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session) return null
    return parseSession(session.user, session.access_token)
  }

  onAuthStateChange(cb: (session: UserSession | null) => void) {
    const { data: { subscription } } = this.supabase.auth
      .onAuthStateChange((_, session) => {
        cb(session ? parseSession(session.user, session.access_token) : null)
      })
    return () => subscription.unsubscribe()
  }
}

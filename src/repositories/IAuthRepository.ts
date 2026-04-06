import type { UserSession } from '@/types/domain/profile.schema'

/**
 * Contrato de autenticación.
 * Cualquier implementación (Supabase, Firebase, REST) debe cumplir esta interfaz,
 * lo que permite hacer swap sin tocar servicios ni componentes.
 */
export interface IAuthRepository {
  signIn(email: string, password: string): Promise<{ session: UserSession | null; error: string | null }>
  signUp(email: string, password: string, fullName?: string): Promise<{ error: string | null }>
  signOut(): Promise<void>
  getCurrentSession(): Promise<UserSession | null>
  onAuthStateChange(cb: (session: UserSession | null) => void): () => void
}

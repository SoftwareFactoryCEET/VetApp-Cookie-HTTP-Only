import { SupabaseAuthRepository } from '@/repositories/supabase/AuthRepository'
import type { IAuthRepository } from '@/repositories/IAuthRepository'

/* ============================================================
   SERVICIO: Autenticación
   Punto de swap: cambia la implementación aquí sin tocar
   hooks ni componentes (Supabase → Firebase → REST, etc.)
   ============================================================ */

const repo: IAuthRepository = new SupabaseAuthRepository()

export const authService = {
  signIn:            repo.signIn.bind(repo),
  signUp:            repo.signUp.bind(repo),
  signOut:           repo.signOut.bind(repo),
  getCurrentSession: repo.getCurrentSession.bind(repo),
  onAuthStateChange: repo.onAuthStateChange.bind(repo),
}

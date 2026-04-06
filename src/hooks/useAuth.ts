'use client'
import { useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/authService'
import type { UserSession, AppRole } from '@/types/domain/profile.schema'

/* ============================================================
   HOOK: useAuth — el corazón del frontend
   Expone la sesión actual, helpers de rol y métodos de auth.
   Se suscribe a cambios de sesión en tiempo real (onAuthStateChange).
   ============================================================ */

export function useAuth() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    // Carga inicial de la sesión
    authService.getCurrentSession().then(s => {
      setSession(s)
      setLoading(false)
    })

    // Suscripción a cambios (login / logout / token refresh)
    const unsubscribe = authService.onAuthStateChange(s => {
      setSession(s)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const { session, error } = await authService.signIn(email, password)
    if (error) setError(error)
    if (session) setSession(session)
    return { error }
  }, [])

  const signUp = useCallback(async (
    email: string, password: string, fullName?: string
  ) => {
    setError(null)
    const { error } = await authService.signUp(email, password, fullName)
    if (error) setError(error)
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  /**
   * Verifica si el usuario tiene alguno de los roles indicados.
   * @example hasRole('admin', 'vet') // true si el usuario es admin o vet
   */
  const hasRole = useCallback((...roles: AppRole[]) => {
    if (!session) return false
    return roles.includes(session.user_role)
  }, [session])

  return {
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin:         session?.user_role === 'admin',
    isVet:           session?.user_role === 'vet',
    isOwner:         session?.user_role === 'owner',
    isAuthenticated: !!session,
  }
}

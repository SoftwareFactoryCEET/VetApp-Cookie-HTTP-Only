'use client'
import { useAuth } from '@/hooks/useAuth'
import type { AppRole } from '@/types/domain/profile.schema'

/* ============================================================
   COMPONENTE: RoleGuard
   Renderiza children solo si el usuario tiene el rol requerido.
   Úsalo para proteger secciones de la UI sin duplicar lógica.
   ============================================================ */

type Props = {
  /** Rol o lista de roles que pueden ver el contenido */
  roles:     AppRole | AppRole[]
  children:  React.ReactNode
  /** Contenido alternativo si no tiene el rol (por defecto: nada) */
  fallback?: React.ReactNode
}

export default function RoleGuard({ roles, children, fallback = null }: Props) {
  const { hasRole, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm" aria-live="polite">
        <span className="animate-spin inline-block">⟳</span>
        Verificando permisos...
      </div>
    )
  }

  if (!isAuthenticated) return <>{fallback}</>

  const roleList = Array.isArray(roles) ? roles : [roles]
  if (!hasRole(...roleList)) return <>{fallback}</>

  return <>{children}</>
}

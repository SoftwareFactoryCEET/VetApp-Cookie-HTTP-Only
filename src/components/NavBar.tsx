'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

/* ============================================================
   COMPONENTE: NavBar
   Barra de navegación principal. Muestra u oculta enlaces
   según el rol del usuario autenticado.
   ============================================================ */

export default function NavBar() {
  const { session, isAdmin, isVet, signOut } = useAuth()

  return (
    <nav
      className="bg-green-700 text-white px-8 py-3 flex justify-between items-center shadow-md"
      aria-label="Navegación principal"
    >
      {/* Logo y enlaces de navegación */}
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🐾 VetApp
        </Link>

        {session && (
          <Link href="/pacientes" className="text-sm hover:underline">
            Pacientes
          </Link>
        )}

        {(isAdmin || isVet) && (
          <Link href="/pacientes/nuevo" className="text-sm hover:underline">
            + Nuevo
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-yellow-300 hover:text-yellow-100 font-medium"
          >
            Panel Admin
          </Link>
        )}
      </div>

      {/* Información de sesión y botón de salida */}
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <span className="text-xs bg-green-800 px-3 py-1 rounded-full">
              {session.email}
              <span className="ml-1 font-bold uppercase text-yellow-300">
                [{session.user_role}]
              </span>
            </span>
            <button
              onClick={signOut}
              className="text-sm text-red-300 hover:text-red-100 transition-colors min-h-[44px] px-2"
              aria-label="Cerrar sesión"
            >
              Salir
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm hover:underline"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  )
}

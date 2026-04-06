'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePacientes } from '@/hooks/usePacientes'
import RoleGuard from '@/components/RoleGuard'
import Link from 'next/link'

/* ============================================================
   PÁGINA: /pacientes (protegida — requiere login)
   Lista los pacientes que el RLS de Supabase permite ver
   según el rol del usuario autenticado.
   ============================================================ */

/** Etiqueta de especie con color */
function EspeciaBadge({ especie }: { especie: string }) {
  const colores: Record<string, string> = {
    perro:  'bg-yellow-100 text-yellow-800',
    gato:   'bg-purple-100 text-purple-800',
    ave:    'bg-sky-100 text-sky-800',
    conejo: 'bg-pink-100 text-pink-800',
  }
  const color = colores[especie.toLowerCase()] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {especie}
    </span>
  )
}

export default function PacientesPage() {
  const { session, isAdmin, isVet, isAuthenticated, loading } = useAuth()
  const { pacientes, cargando, error, eliminar } = usePacientes()
  const router = useRouter()

  /* ---------- Redirigir al login si no hay sesión ---------- */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [loading, isAuthenticated, router])

  if (!loading && !isAuthenticated) return null

  /* ---------- Estado de carga ---------- */
  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]" aria-live="polite">
        <span className="text-gray-500">Cargando pacientes...</span>
      </div>
    )
  }

  /* ---------- Error de carga ---------- */
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar pacientes: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pacientes.length} registro{pacientes.length !== 1 ? 's' : ''} visibles para tu rol
            <span className="ml-1 font-semibold text-green-700">[{session?.user_role}]</span>
          </p>
        </div>

        {/* Solo admin y vet pueden crear pacientes */}
        <RoleGuard roles={['admin', 'vet']}>
          <Link
            href="/pacientes/nuevo"
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors min-h-[44px] flex items-center"
          >
            + Nuevo paciente
          </Link>
        </RoleGuard>
      </div>

      {/* Lista vacía */}
      {pacientes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🐾</div>
          <p className="text-lg">No hay pacientes registrados aún.</p>
        </div>
      )}

      {/* Tabla de pacientes */}
      {pacientes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Especie</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Raza</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Edad</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Estado</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pacientes.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-6 py-4">
                    <EspeciaBadge especie={p.especie} />
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.raza ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.edad_meses < 12
                      ? `${p.edad_meses} mes${p.edad_meses !== 1 ? 'es' : ''}`
                      : `${Math.floor(p.edad_meses / 12)} año${Math.floor(p.edad_meses / 12) !== 1 ? 's' : ''}`
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Botón eliminar solo para admin — condicional directo, sin RoleGuard dentro de <tr> */}
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${p.nombre}?`)) eliminar(p.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-xs font-medium min-h-[44px] px-2"
                        aria-label={`Eliminar paciente ${p.nombre}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePacientes } from '@/hooks/usePacientes'
import RoleGuard from '@/components/RoleGuard'

/* ============================================================
   PÁGINA: /admin (solo administradores)
   Panel de control con estadísticas y gestión global.
   El proxy redirige a /pacientes si el rol no es 'admin'.
   ============================================================ */

export default function AdminPage() {
  const { session, isAuthenticated, loading } = useAuth()
  const { pacientes, cargando } = usePacientes()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [loading, isAuthenticated, router])

  /* Estadísticas calculadas del lado cliente */
  const totalActivos   = pacientes.filter(p => p.activo).length
  const totalInactivos = pacientes.length - totalActivos
  const porEspecie     = pacientes.reduce<Record<string, number>>((acc, p) => {
    acc[p.especie] = (acc[p.especie] ?? 0) + 1
    return acc
  }, {})

  return (
    <RoleGuard
      roles="admin"
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-gray-500">Acceso denegado. Solo administradores.</p>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sesión activa: <strong>{session?.email}</strong>
            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              ADMIN
            </span>
          </p>
        </div>

        {cargando ? (
          <p className="text-gray-500" aria-live="polite">Cargando estadísticas...</p>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                titulo="Total pacientes"
                valor={pacientes.length}
                color="bg-blue-50 border-blue-200 text-blue-800"
              />
              <StatCard
                titulo="Activos"
                valor={totalActivos}
                color="bg-green-50 border-green-200 text-green-800"
              />
              <StatCard
                titulo="Inactivos"
                valor={totalInactivos}
                color="bg-gray-50 border-gray-200 text-gray-700"
              />
              <StatCard
                titulo="Especies distintas"
                valor={Object.keys(porEspecie).length}
                color="bg-purple-50 border-purple-200 text-purple-800"
              />
            </div>

            {/* Distribución por especie */}
            {Object.keys(porEspecie).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">
                  Distribución por especie
                </h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(porEspecie).map(([especie, cantidad]) => (
                    <div
                      key={especie}
                      className="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-2"
                    >
                      <span className="text-sm font-medium text-gray-700 capitalize">{especie}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-bold">
                        {cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota sobre gestión de roles */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <strong>Gestión de roles:</strong> Para cambiar el rol de un usuario, ejecuta en el
              SQL Editor de Supabase:
              <code className="block mt-2 bg-yellow-100 rounded p-2 font-mono text-xs">
                UPDATE public.profiles SET role = &apos;vet&apos; WHERE id = &apos;uuid-del-usuario&apos;;
              </code>
              El cambio aplica en el próximo login (el JWT se renueva con el nuevo rol).
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  )
}

/* ---------- Componente auxiliar ---------- */

function StatCard({
  titulo, valor, color,
}: {
  titulo: string
  valor: number
  color: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs mt-0.5 opacity-80">{titulo}</p>
    </div>
  )
}

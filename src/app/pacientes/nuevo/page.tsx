'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePacientes } from '@/hooks/usePacientes'
import RoleGuard from '@/components/RoleGuard'

/* ============================================================
   PÁGINA: /pacientes/nuevo (solo admin y vet)
   Formulario para registrar un nuevo paciente.
   El proxy bloquea el acceso si no hay sesión activa.
   ============================================================ */

export default function NuevoPacientePage() {
  const { session } = useAuth()
  const { crear } = usePacientes()
  const router = useRouter()

  const [nombre,     setNombre]     = useState('')
  const [especie,    setEspecie]    = useState('')
  const [raza,       setRaza]       = useState('')
  const [edadMeses,  setEdadMeses]  = useState(0)
  const [error,      setError]      = useState<string | null>(null)
  const [enviando,   setEnviando]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setError(null)
    setEnviando(true)

    try {
      await crear({
        nombre,
        especie,
        raza:       raza || null,
        edad_meses: edadMeses,
        owner_id:   session.id,
        vet_id:     session.user_role === 'vet' ? session.id : null,
        activo:     true,
      })
      router.push('/pacientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el paciente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <RoleGuard
      roles={['admin', 'vet']}
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-gray-500">No tienes permisos para acceder a esta página.</p>
        </div>
      }
    >
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo paciente</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del paciente *
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Firulais"
            />
          </div>

          {/* Especie */}
          <div>
            <label htmlFor="especie" className="block text-sm font-medium text-gray-700 mb-1">
              Especie *
            </label>
            <select
              id="especie"
              value={especie}
              onChange={e => setEspecie(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="">Seleccionar especie</option>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="ave">Ave</option>
              <option value="conejo">Conejo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Raza */}
          <div>
            <label htmlFor="raza" className="block text-sm font-medium text-gray-700 mb-1">
              Raza (opcional)
            </label>
            <input
              id="raza"
              type="text"
              value={raza}
              onChange={e => setRaza(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Labrador"
            />
          </div>

          {/* Edad en meses */}
          <div>
            <label htmlFor="edad" className="block text-sm font-medium text-gray-700 mb-1">
              Edad (en meses) *
            </label>
            <input
              id="edad"
              type="number"
              min={0}
              value={edadMeses}
              onChange={e => setEdadMeses(parseInt(e.target.value) || 0)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
              {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/pacientes')}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {enviando ? 'Guardando...' : 'Guardar paciente'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  )
}

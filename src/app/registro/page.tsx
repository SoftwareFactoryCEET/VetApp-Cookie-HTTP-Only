'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

/* ============================================================
   PÁGINA: Registro
   Crea una cuenta nueva. El trigger de Supabase asigna
   automáticamente el rol 'owner' al nuevo usuario.
   ============================================================ */

export default function RegistroPage() {
  const { signUp } = useAuth()
  const router = useRouter()

  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [exito,    setExito]    = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    const { error } = await signUp(email, password, nombre)

    if (error) {
      setError(error)
      setEnviando(false)
    } else {
      setExito(true)
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  if (exito) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] px-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">¡Cuenta creada!</h2>
          <p className="text-sm text-gray-600">
            Revisa tu correo para confirmar la cuenta. Redirigiendo al login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">
          Crear cuenta
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Campo: nombre completo */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              autoComplete="name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Ana García"
            />
          </div>

          {/* Campo: correo electrónico */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="tu@email.com"
            />
          </div>

          {/* Campo: contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
              {error}
            </p>
          )}

          {/* Nota sobre el rol asignado */}
          <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            Las cuentas nuevas reciben el rol <strong>Propietario</strong> por defecto.
            Un administrador puede cambiar el rol desde el panel de administración.
          </p>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={enviando}
            className="bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-green-700 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

/* ============================================================
   PÁGINA: Login
   Formulario de inicio de sesión. Redirige a /pacientes
   al autenticarse correctamente.
   ============================================================ */

export default function LoginPage() {
  const { signIn, loading } = useAuth()
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
      setEnviando(false)
    } else {
      router.push('/pacientes')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]" aria-live="polite">
        <span className="text-gray-500">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="••••••••"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
              {error}
            </p>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={enviando}
            className="bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-green-700 font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

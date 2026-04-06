import Link from 'next/link'

/* ============================================================
   PÁGINA: Home (pública)
   Presentación de VetApp con acceso a login y registro.
   ============================================================ */

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold text-green-800 mb-4">
        🐾 VetApp
      </h1>
      <p className="text-lg text-gray-600 mb-2 max-w-md">
        Sistema de gestión veterinaria de la clínica <strong>PatasYColas</strong>
      </p>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">
        Control de acceso basado en roles: Administrador, Veterinario y Propietario.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition-colors min-h-[44px] flex items-center"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="border border-green-700 text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors min-h-[44px] flex items-center"
        >
          Registrarse
        </Link>
      </div>

      {/* Leyenda de roles */}
      <div className="mt-12 grid grid-cols-3 gap-6 text-sm max-w-lg">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl mb-1">🔴</div>
          <div className="font-bold text-red-700">Admin</div>
          <div className="text-gray-500 text-xs">Gestión total</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl mb-1">🔵</div>
          <div className="font-bold text-blue-700">Veterinario</div>
          <div className="text-gray-500 text-xs">Sus pacientes</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl mb-1">🟢</div>
          <div className="font-bold text-green-700">Propietario</div>
          <div className="text-gray-500 text-xs">Sus mascotas</div>
        </div>
      </div>
    </div>
  )
}

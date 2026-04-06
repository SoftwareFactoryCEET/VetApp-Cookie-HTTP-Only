'use client'
import { useState, useEffect, useCallback } from 'react'
import { pacienteService } from '@/services/pacienteService'
import { useAuth } from '@/hooks/useAuth'
import type { Paciente, CreatePaciente } from '@/types/domain/paciente.schema'

/* ============================================================
   HOOK: usePacientes
   Gestiona el estado de la lista de pacientes y expone
   las operaciones CRUD. El RLS filtra automáticamente
   los datos según el rol del usuario autenticado.
   Limpia los datos cuando el usuario cierra sesión.
   ============================================================ */

export function usePacientes() {
  const { isAuthenticated } = useAuth()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await pacienteService.listar()
      setPacientes(datos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      // Limpiar datos al cerrar sesión — no mostrar información de otros usuarios
      setPacientes([])
      setCargando(false)
      return
    }
    cargar()
  }, [isAuthenticated, cargar])

  const crear = useCallback(async (data: CreatePaciente) => {
    const nuevo = await pacienteService.crear(data)
    setPacientes(prev => [nuevo, ...prev])
    return nuevo
  }, [])

  const editar = useCallback(async (id: string, data: Partial<CreatePaciente>) => {
    const actualizado = await pacienteService.editar(id, data)
    setPacientes(prev => prev.map(p => p.id === id ? actualizado : p))
    return actualizado
  }, [])

  const eliminar = useCallback(async (id: string) => {
    await pacienteService.eliminar(id)
    setPacientes(prev => prev.filter(p => p.id !== id))
  }, [])

  return { pacientes, cargando, error, recargar: cargar, crear, editar, eliminar }
}

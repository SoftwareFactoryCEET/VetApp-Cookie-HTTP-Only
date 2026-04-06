import { createClient } from '@/lib/supabase/clients'
import { PacienteSchema, CreatePacienteSchema } from '@/types/domain/paciente.schema'
import type { IPacienteRepository } from '../IPacienteRepository'
import type { Paciente, CreatePaciente } from '@/types/domain/paciente.schema'

/* ============================================================
   IMPLEMENTACIÓN: Supabase Paciente Repository
   El RLS de PostgreSQL filtra automáticamente los resultados
   según el claim user_role del JWT del usuario autenticado.
   No es necesario añadir filtros manuales por rol aquí.
   ============================================================ */

export class SupabasePacienteRepository implements IPacienteRepository {
  private supabase = createClient()

  /**
   * Obtiene todos los pacientes accesibles por el usuario actual.
   * El RLS devuelve: admin → todos, vet → sus asignados, owner → sus mascotas.
   */
  async getAll(): Promise<Paciente[]> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return PacienteSchema.array().parse(data)
  }

  async getById(id: string): Promise<Paciente | null> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return PacienteSchema.parse(data)
  }

  async create(input: CreatePaciente): Promise<Paciente> {
    const validated = CreatePacienteSchema.parse(input)
    const { data, error } = await this.supabase
      .from('pacientes')
      .insert(validated)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return PacienteSchema.parse(data)
  }

  async update(id: string, input: Partial<CreatePaciente>): Promise<Paciente> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .update(input)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return PacienteSchema.parse(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('pacientes')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  }
}

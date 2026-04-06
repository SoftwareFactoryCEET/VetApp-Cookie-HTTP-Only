import type { Paciente, CreatePaciente } from '@/types/domain/paciente.schema'

/**
 * Contrato CRUD de pacientes.
 * El RLS de Supabase filtra automáticamente los datos según el rol del JWT,
 * por lo que getAll() devuelve distinto resultado para admin, vet y owner.
 */
export interface IPacienteRepository {
  getAll():                                           Promise<Paciente[]>
  getById(id: string):                                Promise<Paciente | null>
  create(data: CreatePaciente):                       Promise<Paciente>
  update(id: string, data: Partial<CreatePaciente>):  Promise<Paciente>
  delete(id: string):                                 Promise<void>
}

import { SupabasePacienteRepository } from '@/repositories/supabase/PacienteRepository'
import type { IPacienteRepository } from '@/repositories/IPacienteRepository'
import type { CreatePaciente } from '@/types/domain/paciente.schema'

/* ============================================================
   SERVICIO: Pacientes
   Orquesta las operaciones CRUD delegando al repositorio.
   El RLS de Supabase garantiza que cada rol solo acceda
   a los datos que le corresponden.
   ============================================================ */

const repo: IPacienteRepository = new SupabasePacienteRepository()

export const pacienteService = {
  listar:   ()                                           => repo.getAll(),
  obtener:  (id: string)                                 => repo.getById(id),
  crear:    (data: CreatePaciente)                       => repo.create(data),
  editar:   (id: string, data: Partial<CreatePaciente>)  => repo.update(id, data),
  eliminar: (id: string)                                 => repo.delete(id),
}

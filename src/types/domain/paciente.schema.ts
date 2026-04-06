import { z } from 'zod'

/* ============================================================
   DOMINIO: Paciente veterinario
   Define los tipos para la entidad principal del negocio.
   El RLS en Supabase filtra los registros según el rol del JWT.
   ============================================================ */

/** Paciente completo tal como viene de la base de datos */
export const PacienteSchema = z.object({
  id:         z.string().uuid(),
  nombre:     z.string().min(1).max(100),
  especie:    z.string().min(1),
  raza:       z.string().nullable().optional(),
  edad_meses: z.number().int().min(0),
  owner_id:   z.string().uuid(),
  vet_id:     z.string().uuid().nullable().optional(),
  activo:     z.boolean().default(true),
  created_at: z.string().datetime({ offset: true }).optional(),
})

/** Datos requeridos para crear un nuevo paciente */
export const CreatePacienteSchema = PacienteSchema.omit({ id: true, created_at: true })

export type Paciente       = z.infer<typeof PacienteSchema>
export type CreatePaciente = z.infer<typeof CreatePacienteSchema>

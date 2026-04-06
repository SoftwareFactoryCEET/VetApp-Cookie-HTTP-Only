import { z } from 'zod'

/* ============================================================
   DOMINIO: Roles y perfil de usuario
   Define los tipos para el control de acceso basado en roles
   (RBAC) y la sesión autenticada del usuario.
   ============================================================ */

/** Roles disponibles en VetApp */
export const AppRoleSchema = z.enum(['owner', 'vet', 'admin'])
export type AppRole = z.infer<typeof AppRoleSchema>

/** Perfil extendido del usuario (tabla public.profiles) */
export const ProfileSchema = z.object({
  id:         z.string().uuid(),
  role:       AppRoleSchema,
  full_name:  z.string().nullable().optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
})
export type Profile = z.infer<typeof ProfileSchema>

/**
 * Sesión del usuario autenticado.
 * El campo user_role se lee directamente del JWT (custom claim).
 */
export const UserSessionSchema = z.object({
  id:        z.string().uuid(),
  email:     z.string().email(),
  user_role: AppRoleSchema.default('owner'),
})
export type UserSession = z.infer<typeof UserSessionSchema>

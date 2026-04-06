# Guía de Actividad Práctica
## Autenticación y Autorización Basada en Roles
### JWT + Supabase + Next.js + Tailwind CSS
*Patrón Repositorio | RBAC | Row Level Security | TypeScript*

---

> **SENA — Centro de Electricidad, Electrónica y Telecomunicaciones (CEET)**  
> Análisis y Desarrollo de Software (ADSO) / Teleinformática y Desarrollo de Software  
> Regional Distrito Capital | Campus Fontibón, Bogotá D.C.

| Programa | Duración | Modalidad | Centro |
|---|---|---|---|
| ADSO / Teleinformática | 8 Horas | Presencial / Virtual | CEET · Regional D.C. |

---

## Tabla de Contenido

1. [Información General de la Actividad](#1-información-general-de-la-actividad)
2. [Caso de Estudio: VetApp](#2-caso-de-estudio-vetapp--sistema-de-gestión-veterinaria)
3. [Arquitectura de la Solución](#3-arquitectura-de-la-solución)
4. [PARTE 1 – Configuración de Supabase (Backend)](#parte-1--configuración-de-supabase-backend)
   - [Paso 1: Crear el proyecto en Supabase](#-paso-1--crear-el-proyecto-en-supabase)
   - [Paso 2: Crear tabla profiles y trigger](#-paso-2--crear-tablas-profiles-y-pacientes)
   - [Paso 3: Custom Access Token Hook](#-paso-3--custom-access-token-hook--inyectar-user_role-en-el-jwt)
   - [Paso 4: Activar RLS y políticas de seguridad](#-paso-4--activar-rls-y-crear-políticas-de-seguridad)
5. [PARTE 2 – Configurar el proyecto Next.js](#parte-2--configurar-el-proyecto-nextjs)
   - [Paso 5: Inicializar el proyecto](#-paso-5--inicializar-el-proyecto-nextjs-con-typescript-y-tailwind)
   - [Paso 6: Instalar dependencias](#-paso-6--instalar-dependencias)
   - [Paso 7: Variables de entorno](#-paso-7--configurar-variables-de-entorno)
6. [PARTE 3 – Implementación del Patrón Repositorio + Auth](#parte-3--implementación-del-patrón-repositorio--auth)
   - [Paso 8: Tipos y esquemas Zod](#-paso-8--tipos-y-esquemas-zod-dominio)
   - [Paso 9: Clientes Supabase SSR](#-paso-9--clientes-supabase-ssr)
   - [Paso 10: Interfaces y Repositorios](#-paso-10--interfaces-y-repositorios)
   - [Paso 11: Servicios](#-paso-11--servicios-punto-de-swap-entre-implementaciones)
   - [Paso 12: Hook useAuth](#-paso-12--hook-useauth--el-corazón-del-frontend)
   - [Paso 13: Componentes de UI y guards](#-paso-13--componentes-de-ui-y-guards-de-roles)
   - [Paso 14: Middleware de rutas](#-paso-14--middleware-de-protección-de-rutas)
   - [Paso 15: Páginas y layout](#-paso-15--páginas-y-layout)
7. [PARTE 4 – Pruebas del flujo completo](#parte-4--pruebas-del-flujo-completo)
8. [Diagrama del flujo completo](#8-diagrama-del-flujo-completo-de-autenticación)
9. [Rúbrica de Evaluación](#9-rúbrica-de-evaluación)

---

## 1. Información General de la Actividad

| Campo | Detalle |
|---|---|
| **Título** | Implementación de Autenticación y Autorización basada en Roles con JWT y Supabase |
| **Programa de formación** | Análisis y Desarrollo de Software (ADSO) / Teleinformática y Desarrollo de Software |
| **Competencia técnica** | Construir soluciones de software con mecanismos de seguridad de autenticación y autorización |
| **Resultado de aprendizaje** | Implementa control de acceso basado en roles (RBAC) usando JWT, Supabase Auth y Next.js |
| **Duración estimada** | 8 horas (4h teoría/configuración + 4h práctica de código) |
| **Modalidad** | Individual o en parejas (máximo 2 personas) |
| **Herramientas requeridas** | Node.js 18+, VSCode, cuenta Supabase (gratis), cuenta GitHub, navegador moderno |
| **Prerrequisitos** | Conocimiento básico de React, TypeScript, bases de datos relacionales y HTTP/REST |

### Objetivos de aprendizaje

- Comprender la anatomía y funcionamiento de un JWT (JSON Web Token).
- Configurar Supabase Auth con roles personalizados mediante custom claims.
- Implementar Row Level Security (RLS) en PostgreSQL para proteger datos.
- Aplicar el patrón Repositorio para desacoplar la lógica de autenticación.
- Construir una interfaz Next.js con renderizado condicional según el rol del usuario.
- Proteger rutas con middleware de Next.js leyendo el JWT desde cookies.

> **Concepto clave: JWT (JSON Web Token)**  
> Un JWT es un token firmado criptográficamente que contiene información (claims) sobre el usuario.  
> **Estructura:** `Header.Payload.Signature` (tres partes separadas por puntos)  
> - **Header:** indica el algoritmo de firma (ej: HS256).  
> - **Payload:** contiene claims: `sub` (user ID), `email`, `exp` (expiración), y claims personalizados.  
> - **Signature:** garantiza que nadie puede alterar el token. Si lo modifican, la firma falla.  
> Supabase genera JWTs automáticamente en cada login y los gestiona en cookies HTTP-only.

---

## 2. Caso de Estudio: VetApp – Sistema de Gestión Veterinaria

> **Contexto del proyecto**  
> La clínica veterinaria *PatasYColas* necesita un sistema web para gestionar sus pacientes (animales).  
> El sistema tiene tres tipos de usuarios con diferentes niveles de acceso:
> - 🔴 **Administrador (`admin`):** Ve todos los pacientes, puede crear, editar y eliminar cualquier registro.
> - 🔵 **Veterinario (`vet`):** Ve solo los pacientes asignados a él, puede crear y editar los suyos.
> - 🟢 **Propietario (`owner`):** Solo ve sus propias mascotas registradas, no puede editar nada.
>
> La seguridad es crítica: un propietario **NUNCA** debe ver las mascotas de otro propietario.

### Modelo de datos

El sistema maneja dos tablas principales en Supabase, además de `auth.users`:

| Tabla | Columnas principales | Descripción |
|---|---|---|
| `auth.users` | `id`, `email`, `app_metadata` | Gestionada por Supabase Auth. El JWT se genera de aquí. |
| `public.profiles` | `id`, `role`, `full_name`, `updated_at` | Extiende `auth.users`. Guarda el rol: `admin`, `vet` u `owner`. |
| `public.pacientes` | `id`, `nombre`, `especie`, `owner_id`, `vet_id`, `activo` | Pacientes de la clínica. El RLS restringe quién puede ver cada registro. |

---

## 3. Arquitectura de la Solución

El proyecto sigue el **Patrón Repositorio** que separa claramente las capas:

```
vetapp/
src/
├── lib/
│   └── supabase/
│       ├── clients.ts          ← Clientes browser/server (SSR)
│       └── server.ts
├── types/
│   └── domain/
│       ├── profile.schema.ts   ← Tipos + validación Zod (rol, usuario)
│       └── paciente.schema.ts  ← Tipos + validación Zod (paciente)
├── repositories/
│   ├── IAuthRepository.ts      ← Contrato de autenticación
│   ├── IProfileRepository.ts   ← Contrato de perfiles
│   ├── IPacienteRepository.ts  ← Contrato de pacientes
│   └── supabase/
│       ├── AuthRepository.ts   ← Implementación Supabase Auth
│       ├── ProfileRepository.ts
│       └── PacienteRepository.ts
├── services/
│   ├── authService.ts          ← Orquestador de auth (punto de swap)
│   ├── profileService.ts
│   └── pacienteService.ts
├── hooks/
│   ├── useAuth.ts              ← Hook global (user, role, isAdmin...)
│   └── usePacientes.ts
├── components/
│   ├── RoleGuard.tsx           ← Renderizado condicional por rol
│   └── NavBar.tsx
├── app/
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── pacientes/page.tsx
│   └── admin/page.tsx
└── middleware.ts               ← Protección de rutas a nivel servidor
```

> **Flujo completo de una petición autenticada:**
> 1. El usuario hace login → Supabase genera un JWT firmado.
> 2. El Custom Hook inyecta `user_role` en el payload del JWT.
> 3. El JWT se almacena en cookies HTTP-only (gestionado por `@supabase/ssr`).
> 4. En cada petición, el middleware de Next.js valida la sesión y el rol.
> 5. El frontend lee el rol desde el JWT (sin query extra a la DB).
> 6. Supabase evalúa el RLS en cada query SQL según `auth.jwt()->>'user_role'`.
> 7. Solo llegan al cliente los datos que le corresponden según su rol.

---

## PARTE 1 – Configuración de Supabase (Backend)

---

### 🟩 Paso 1 — Crear el proyecto en Supabase

1. Ve a <https://supabase.com> y crea una cuenta gratuita.
2. Haz clic en **New Project**.
3. Configura tu proyecto con estos datos:

| Campo | Valor |
|---|---|
| Name | `vetapp` |
| Database Password | *(genera una contraseña segura y guárdala)* |
| Region | `South America (Sao Paulo) – sa-east-1` |
| Pricing Plan | Free |

4. Espera a que el proyecto se aprovisione (~2 minutos).
5. Ve a **Project Settings > API** y copia:
   - `Project URL` → será tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 🟩 Paso 2 — Crear tablas: `profiles` y `pacientes`

Ve a **SQL Editor** en el panel de Supabase y ejecuta el siguiente script completo:

```sql
-- ======================================================
-- PASO 2: TABLAS, ENUM Y TRIGGER
-- ======================================================

-- 1. Crear tipo enum para los roles
CREATE TYPE public.app_role AS ENUM ('owner', 'vet', 'admin');

-- 2. Tabla profiles (extiende auth.users con el rol)
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role        public.app_role DEFAULT 'owner' NOT NULL,
  full_name   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Tabla pacientes (entidad principal del negocio)
CREATE TABLE public.pacientes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT NOT NULL,
  especie     TEXT NOT NULL,
  raza        TEXT,
  edad_meses  INT NOT NULL DEFAULT 0,
  owner_id    UUID REFERENCES auth.users NOT NULL,
  vet_id      UUID REFERENCES auth.users,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Trigger: crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

> **Importante: `SECURITY DEFINER`**  
> La función `handle_new_user()` usa `SECURITY DEFINER` para ejecutarse con los permisos del propietario de la función (superusuario), no del usuario que dispara el trigger. Esto es necesario porque el RLS bloquearía el `INSERT` en `profiles` si se ejecutara con los permisos del usuario anónimo recién creado.

---

### 🟩 Paso 3 — Custom Access Token Hook – inyectar `user_role` en el JWT

Este es el paso más importante. Vamos a hacer que el **rol viaje dentro del JWT** para no necesitar queries adicionales en cada petición.

Ejecuta esto en el **SQL Editor**:

```sql
-- ======================================================
-- PASO 3: CUSTOM ACCESS TOKEN HOOK
-- ======================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims        JSONB;
  user_role     public.app_role;
BEGIN
  -- Obtener los claims originales del evento
  claims := event->'claims';

  -- Buscar el rol del usuario en la tabla profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::UUID;

  -- Insertar el claim personalizado user_role en el JWT
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"owner"'::JSONB);
  END IF;

  -- Devolver el evento con los claims actualizados
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Permisos para que Supabase Auth pueda ejecutar el hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;
```

**Activa el hook en el Dashboard:**

1. Ve a **Authentication > Hooks** en el panel de Supabase.
2. En **Custom Access Token**, selecciona la función `custom_access_token_hook`.
3. Guarda los cambios.

Resultado: después de activar el hook, cada JWT tendrá este payload:

```json
{
  "sub": "a1b2c3d4-...",
  "email": "admin@vetapp.com",
  "user_role": "admin",
  "iat": 1748000000,
  "exp": 1748003600,
  "aud": "authenticated"
}
```

---

### 🟩 Paso 4 — Activar RLS y crear políticas de seguridad

Las políticas de **Row Level Security** son la defensa real de tu aplicación. Incluso si el frontend falla, Supabase bloquea los datos no autorizados directamente en la base de datos.

```sql
-- ======================================================
-- PASO 4: ROW LEVEL SECURITY (RLS) + POLÍTICAS
-- ======================================================

-- Activar RLS en ambas tablas
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- === POLÍTICAS para profiles ===

CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins ven todos los perfiles"
  ON public.profiles FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "Usuarios actualizan su perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins actualizan cualquier perfil"
  ON public.profiles FOR UPDATE
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- === POLÍTICAS para pacientes ===

-- Admin ve TODOS los pacientes
CREATE POLICY "Admins ven todos los pacientes"
  ON public.pacientes FOR SELECT
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- Vet ve sus pacientes asignados
CREATE POLICY "Vets ven sus pacientes"
  ON public.pacientes FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') = 'vet'
    AND vet_id = auth.uid()
  );

-- Owner ve solo sus mascotas
CREATE POLICY "Owners ven sus mascotas"
  ON public.pacientes FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') = 'owner'
    AND owner_id = auth.uid()
  );

-- Solo admin puede insertar/editar/eliminar cualquier paciente
CREATE POLICY "Admin gestiona todos los pacientes"
  ON public.pacientes FOR ALL
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- Vet puede insertar pacientes (asignándose como vet)
CREATE POLICY "Vet inserta pacientes"
  ON public.pacientes FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'vet'
    AND vet_id = auth.uid()
  );
```

Para asignar el rol `admin` al primer usuario:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');

-- Verificar el cambio
SELECT id, role FROM public.profiles;
```

> **Nota sobre cambio de rol y JWT**  
> Cuando cambias el rol en `profiles`, el JWT actual sigue con el rol anterior hasta que expire (~1 hora) o el usuario cierre sesión. En desarrollo: pide al usuario que haga logout/login.

---

## PARTE 2 – Configurar el proyecto Next.js

---

### 🟩 Paso 5 — Inicializar el proyecto Next.js con TypeScript y Tailwind

```bash
npx create-next-app@latest vetapp \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd vetapp
```

---

### 🟩 Paso 6 — Instalar dependencias

```bash
# Supabase SSR (necesario para App Router de Next.js)
npm install @supabase/supabase-js @supabase/ssr

# Zod para validación de tipos en tiempo de ejecución
npm install zod

# (Opcional) Iconos
npm install lucide-react
```

> **¿Por qué `@supabase/ssr`?**  
> Diseñado para SSR con Next.js App Router. Gestiona cookies automáticamente en cliente y servidor y soporta auto-refresh del JWT. El paquete `@supabase/auth-helpers-nextjs` está deprecado.

---

### 🟩 Paso 7 — Configurar variables de entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Verifica que `.gitignore` incluya `.env.local` y `.env*.local`.

---

## PARTE 3 – Implementación del Patrón Repositorio + Auth

---

### 🟩 Paso 8 — Tipos y esquemas Zod (Dominio)

**`src/types/domain/profile.schema.ts`**

```typescript
import { z } from 'zod'

export const AppRoleSchema = z.enum(['owner', 'vet', 'admin'])
export type AppRole = z.infer<typeof AppRoleSchema>

export const ProfileSchema = z.object({
  id:         z.string().uuid(),
  role:       AppRoleSchema,
  full_name:  z.string().nullable().optional(),
  updated_at: z.string().datetime().optional(),
})
export type Profile = z.infer<typeof ProfileSchema>

export const UserSessionSchema = z.object({
  id:        z.string().uuid(),
  email:     z.string().email(),
  user_role: AppRoleSchema.default('owner'),
})
export type UserSession = z.infer<typeof UserSessionSchema>
```

**`src/types/domain/paciente.schema.ts`**

```typescript
import { z } from 'zod'

export const PacienteSchema = z.object({
  id:         z.string().uuid(),
  nombre:     z.string().min(1).max(100),
  especie:    z.string().min(1),
  raza:       z.string().nullable().optional(),
  edad_meses: z.number().int().nonneg(),
  owner_id:   z.string().uuid(),
  vet_id:     z.string().uuid().nullable().optional(),
  activo:     z.boolean().default(true),
  created_at: z.string().datetime().optional(),
})

export const CreatePacienteSchema = PacienteSchema.omit({ id: true, created_at: true })

export type Paciente       = z.infer<typeof PacienteSchema>
export type CreatePaciente = z.infer<typeof CreatePacienteSchema>
```

---

### 🟩 Paso 9 — Clientes Supabase SSR

**`src/lib/supabase/clients.ts`**

```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* El middleware se encarga del refresh */ }
        }
      }
    }
  )
}
```

---

### 🟩 Paso 10 — Interfaces y Repositorios

**`src/repositories/IAuthRepository.ts`**

```typescript
import type { UserSession } from '@/types/domain/profile.schema'

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<{ session: UserSession | null; error: string | null }>
  signUp(email: string, password: string, fullName?: string): Promise<{ error: string | null }>
  signOut(): Promise<void>
  getCurrentSession(): Promise<UserSession | null>
  onAuthStateChange(cb: (session: UserSession | null) => void): () => void
}
```

**`src/repositories/supabase/AuthRepository.ts`**

```typescript
import { createClient } from '@/lib/supabase/clients'
import { UserSessionSchema } from '@/types/domain/profile.schema'
import type { IAuthRepository } from '../IAuthRepository'
import type { UserSession } from '@/types/domain/profile.schema'

function parseSession(user: any): UserSession | null {
  if (!user) return null
  try {
    return UserSessionSchema.parse({
      id:        user.id,
      email:     user.email,
      user_role: user.app_metadata?.user_role ?? 'owner',
    })
  } catch { return null }
}

export class SupabaseAuthRepository implements IAuthRepository {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth
      .signInWithPassword({ email, password })
    if (error) return { session: null, error: error.message }
    return { session: parseSession(data.user), error: null }
  }

  async signUp(email: string, password: string, fullName?: string) {
    const { error } = await this.supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName ?? '' } }
    })
    return { error: error?.message ?? null }
  }

  async signOut() {
    await this.supabase.auth.signOut()
  }

  async getCurrentSession(): Promise<UserSession | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return parseSession(user)
  }

  onAuthStateChange(cb: (session: UserSession | null) => void) {
    const { data: { subscription } } = this.supabase.auth
      .onAuthStateChange((_, session) => cb(parseSession(session?.user)))
    return () => subscription.unsubscribe()
  }
}
```

**`src/repositories/IPacienteRepository.ts`**

```typescript
import type { Paciente, CreatePaciente } from '@/types/domain/paciente.schema'

export interface IPacienteRepository {
  getAll():                                          Promise<Paciente[]>
  getById(id: string):                               Promise<Paciente | null>
  create(data: CreatePaciente):                      Promise<Paciente>
  update(id: string, data: Partial<CreatePaciente>): Promise<Paciente>
  delete(id: string):                                Promise<void>
}
```

**`src/repositories/supabase/PacienteRepository.ts`**

```typescript
import { createClient } from '@/lib/supabase/clients'
import { PacienteSchema, CreatePacienteSchema } from '@/types/domain/paciente.schema'
import type { IPacienteRepository } from '../IPacienteRepository'
import type { Paciente, CreatePaciente } from '@/types/domain/paciente.schema'

export class SupabasePacienteRepository implements IPacienteRepository {
  private supabase = createClient()

  async getAll(): Promise<Paciente[]> {
    // El RLS filtra automáticamente según el rol del usuario logueado
    const { data, error } = await this.supabase
      .from('pacientes').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return PacienteSchema.array().parse(data)
  }

  async getById(id: string): Promise<Paciente | null> {
    const { data, error } = await this.supabase
      .from('pacientes').select('*').eq('id', id).single()
    if (error) return null
    return PacienteSchema.parse(data)
  }

  async create(input: CreatePaciente): Promise<Paciente> {
    const validated = CreatePacienteSchema.parse(input)
    const { data, error } = await this.supabase
      .from('pacientes').insert(validated).select().single()
    if (error) throw new Error(error.message)
    return PacienteSchema.parse(data)
  }

  async update(id: string, input: Partial<CreatePaciente>): Promise<Paciente> {
    const { data, error } = await this.supabase
      .from('pacientes').update(input).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return PacienteSchema.parse(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('pacientes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
```

---

### 🟩 Paso 11 — Servicios (punto de swap entre implementaciones)

**`src/services/authService.ts`**

```typescript
import { SupabaseAuthRepository } from '@/repositories/supabase/AuthRepository'
import type { IAuthRepository } from '@/repositories/IAuthRepository'

// Aquí swappeas la implementación (Supabase → REST → Firebase, etc.)
const repo: IAuthRepository = new SupabaseAuthRepository()

export const authService = {
  signIn:            repo.signIn.bind(repo),
  signUp:            repo.signUp.bind(repo),
  signOut:           repo.signOut.bind(repo),
  getCurrentSession: repo.getCurrentSession.bind(repo),
  onAuthStateChange: repo.onAuthStateChange.bind(repo),
}
```

**`src/services/pacienteService.ts`**

```typescript
import { SupabasePacienteRepository } from '@/repositories/supabase/PacienteRepository'
import type { IPacienteRepository } from '@/repositories/IPacienteRepository'
import type { CreatePaciente } from '@/types/domain/paciente.schema'

const repo: IPacienteRepository = new SupabasePacienteRepository()

export const pacienteService = {
  listar:   ()                                          => repo.getAll(),
  obtener:  (id: string)                                => repo.getById(id),
  crear:    (data: CreatePaciente)                      => repo.create(data),
  editar:   (id: string, data: Partial<CreatePaciente>) => repo.update(id, data),
  eliminar: (id: string)                                => repo.delete(id),
}
```

---

### 🟩 Paso 12 — Hook `useAuth` – el corazón del frontend

**`src/hooks/useAuth.ts`**

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/authService'
import type { UserSession, AppRole } from '@/types/domain/profile.schema'

export function useAuth() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    authService.getCurrentSession().then(s => {
      setSession(s)
      setLoading(false)
    })

    const unsubscribe = authService.onAuthStateChange(s => {
      setSession(s)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const { error } = await authService.signIn(email, password)
    if (error) setError(error)
  }, [])

  const signUp = useCallback(async (
    email: string, password: string, fullName?: string
  ) => {
    setError(null)
    const { error } = await authService.signUp(email, password, fullName)
    if (error) setError(error)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  const hasRole = useCallback((...roles: AppRole[]) => {
    if (!session) return false
    return roles.includes(session.user_role)
  }, [session])

  return {
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin:         session?.user_role === 'admin',
    isVet:           session?.user_role === 'vet',
    isOwner:         session?.user_role === 'owner',
    isAuthenticated: !!session,
  }
}
```

---

### 🟩 Paso 13 — Componentes de UI y guards de roles

**`src/components/RoleGuard.tsx`**

```tsx
'use client'
import { useAuth } from '@/hooks/useAuth'
import type { AppRole } from '@/types/domain/profile.schema'

type Props = {
  roles:     AppRole | AppRole[]
  children:  React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({ roles, children, fallback = null }: Props) {
  const { hasRole, loading, isAuthenticated } = useAuth()

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <span className="animate-spin">⟳</span> Verificando permisos...
    </div>
  )

  if (!isAuthenticated) return <>{fallback}</>

  const roleList = Array.isArray(roles) ? roles : [roles]
  if (!hasRole(...roleList)) return <>{fallback}</>

  return <>{children}</>
}
```

**`src/components/NavBar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function NavBar() {
  const { session, isAdmin, isVet, signOut } = useAuth()

  return (
    <nav className="bg-green-700 text-white px-8 py-3 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">VetApp</span>
        {session && <Link href="/pacientes" className="text-sm hover:underline">Pacientes</Link>}
        {(isAdmin || isVet) && (
          <Link href="/pacientes/nuevo" className="text-sm hover:underline">+ Nuevo</Link>
        )}
        {isAdmin && (
          <Link href="/admin" className="text-sm text-yellow-300 hover:underline">Admin Panel</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <span className="text-xs bg-green-800 px-2 py-1 rounded">
              {session.email} | {session.user_role}
            </span>
            <button onClick={signOut} className="text-sm text-red-300 hover:text-red-100">
              Salir
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm hover:underline">Iniciar sesión</Link>
        )}
      </div>
    </nav>
  )
}
```

---

### 🟩 Paso 14 — Middleware de protección de rutas

**`src/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = req.nextUrl.pathname

  const protectedRoutes = ['/pacientes', '/admin']
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

  if (isProtected && !user)
    return NextResponse.redirect(new URL('/login', req.url))

  if (pathname.startsWith('/admin')) {
    const userRole = user?.app_metadata?.user_role
    if (userRole !== 'admin')
      return NextResponse.redirect(new URL('/pacientes', req.url))
  }

  if ((pathname === '/login' || pathname === '/register') && user)
    return NextResponse.redirect(new URL('/pacientes', req.url))

  return res
}

export const config = {
  matcher: ['/pacientes/:path*', '/admin/:path*', '/login', '/register'],
}
```

---

### 🟩 Paso 15 — Páginas y Layout

**`src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'VetApp | Sistema Veterinario',
  description: 'Sistema de gestión de pacientes veterinarios con RBAC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
```

**`src/app/login/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const { signIn, error, loading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
    if (!error) router.push('/pacientes')
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-green-800 mb-6">Iniciar Sesión – VetApp</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-green-700 hover:underline">Regístrate</a>
        </p>
      </div>
    </div>
  )
}
```

**`src/app/pacientes/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import RoleGuard from '@/components/RoleGuard'
import { pacienteService } from '@/services/pacienteService'
import type { Paciente } from '@/types/domain/paciente.schema'

export default function PacientesPage() {
  const { isAdmin } = useAuth()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    pacienteService.listar().then(setPacientes).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Cargando pacientes...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">
          Pacientes
          {isAdmin && <span className="ml-2 text-sm text-yellow-600">(Vista Admin)</span>}
        </h1>
        <RoleGuard roles={['admin', 'vet']}>
          <a href="/pacientes/nuevo"
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800">
            + Nuevo paciente
          </a>
        </RoleGuard>
      </div>

      <RoleGuard roles="admin">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
          <strong>Admin:</strong> Ves todos los pacientes. El RLS devuelve todos los registros para tu rol.
        </div>
      </RoleGuard>

      <div className="grid gap-4">
        {pacientes.length === 0 ? (
          <p className="text-gray-500">No hay pacientes registrados.</p>
        ) : (
          pacientes.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow p-4 flex justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">{p.nombre}</h2>
                <p className="text-sm text-gray-500">{p.especie} | {p.edad_meses} meses</p>
              </div>
              <RoleGuard roles={['admin', 'vet']}>
                <button onClick={() => pacienteService.eliminar(p.id)}
                  className="text-red-500 text-sm hover:underline">
                  Eliminar
                </button>
              </RoleGuard>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

**`src/app/admin/page.tsx`**

```tsx
'use client'
import RoleGuard from '@/components/RoleGuard'

export default function AdminPage() {
  return (
    <RoleGuard
      roles="admin"
      fallback={
        <div className="text-center mt-20">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-500 mt-2">Solo los administradores pueden acceder aquí.</p>
        </div>
      }
    >
      <div>
        <h1 className="text-2xl font-bold text-green-800 mb-6">Panel de Administración</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-700">Gestión de Roles</h2>
            <p className="text-sm text-gray-500 mt-1">Cambia el rol de los usuarios.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-700">Estadísticas</h2>
            <p className="text-sm text-gray-500 mt-1">Métricas de la clínica.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-700">Todos los Pacientes</h2>
            <p className="text-sm text-gray-500 mt-1">Vista completa sin filtro.</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
```

---

## PARTE 4 – Pruebas del flujo completo

---

### 🅰 Iniciar el servidor de desarrollo

```bash
npm run dev
# La app estará disponible en http://localhost:3000
```

---

### 🅱 Registrar tres usuarios de prueba

| Email | Rol a asignar | Qué debería ver |
|---|---|---|
| `admin@vetapp.com` | `admin` | Todos los pacientes + Panel Admin |
| `vet@vetapp.com` | `vet` | Solo sus pacientes asignados |
| `owner@vetapp.com` | `owner` (default) | Solo sus mascotas propias |

```sql
-- Asignar roles manualmente para la prueba
UPDATE public.profiles SET role = 'admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@vetapp.com');

UPDATE public.profiles SET role = 'vet'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'vet@vetapp.com');

-- owner@vetapp.com ya tiene role = 'owner' por defecto

-- Insertar datos de prueba
INSERT INTO public.pacientes (nombre, especie, raza, edad_meses, owner_id)
VALUES
  ('Toby',  'Perro', 'Labrador', 24, (SELECT id FROM auth.users WHERE email = 'owner@vetapp.com')),
  ('Michi', 'Gato',  'Siamés',   12, (SELECT id FROM auth.users WHERE email = 'owner@vetapp.com')),
  ('Rocky', 'Perro', 'Bulldog',  36, (SELECT id FROM auth.users WHERE email = 'admin@vetapp.com'));
```

---

### 🅲 Verificar el comportamiento por rol

| Acción a probar | Resultado esperado | Resultado obtenido | OK? |
|---|---|---|---|
| Login con `owner@vetapp.com` | Redirige a `/pacientes`. Ve solo sus mascotas. | | |
| `owner` visita `/admin` directamente | Redirige a `/pacientes` (middleware bloquea). | | |
| Login con `vet@vetapp.com` | Ve botón "+ Nuevo". No ve panel Admin. | | |
| Login con `admin@vetapp.com` | Ve TODOS los pacientes + enlace "Admin Panel". | | |
| `owner` intenta ver paciente de otro owner (API) | Supabase devuelve 0 resultados (RLS). | | |
| Cerrar sesión y visitar `/pacientes` | Redirige a `/login` (middleware). | | |

---

## 8. Diagrama del flujo completo de autenticación

```
┌─────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Usuario ingresa email + password en /login           │
│         │                                                │
│         ▼                                                │
│  2. authService.signIn() → supabase.auth.signInWith...   │
│         │                                                │
│         ▼                                                │
│  3. Supabase Auth valida credenciales                    │
│         │                                                │
│         ▼                                                │
│  4. Custom Hook inyecta { user_role } en el JWT          │
│         │                                                │
│         ▼                                                │
│  5. JWT firmado → cookies HTTP-only (@supabase/ssr)      │
│         │                                                │
│         ▼                                                │
│  6. onAuthStateChange() actualiza useAuth                │
│     → session.user_role = 'admin' → isAdmin = true       │
│         │                                                │
│         ▼                                                │
│  7. middleware lee JWT → permite /admin si rol correcto   │
│         │                                                │
│         ▼                                                │
│  8. pacienteService.listar() → RLS evalúa user_role      │
│     → admin: TODOS | owner: SOLO LOS SUYOS               │
│         │                                                │
│         ▼                                                │
│  9. RoleGuard oculta/muestra botones según rol           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Rúbrica de Evaluación

La actividad se evaluará sobre **100 puntos**:

| # | Criterio | Excelente (10) | Aceptable (7) | En proceso (4) | Pts |
|---|---|---|---|---|---|
| 1 | Tablas, trigger y enum en Supabase | Completas con todas las restricciones | Omisiones menores | Incompletas o con errores | /10 |
| 2 | Custom Access Token Hook funcional | JWT incluye `user_role` al hacer login | Hook existe pero con errores menores | No funciona o no implementado | /10 |
| 3 | RLS: políticas para los tres roles | Todas implementadas y verificadas | Algunas correctas, otras faltantes | Sin políticas o incorrectas | /10 |
| 4 | Patrón Repositorio: interfaz, impl. y servicio | Las tres capas correctas y funcionales | Dos capas correctas | Una capa o mezcladas | /10 |
| 5 | Hook `useAuth` con `isAdmin`, `isVet`, `isOwner` | Completo con todos los flags | Funcional sin todos los flags | Básico sin flags | /10 |
| 6 | Middleware de protección de rutas | Protege `/pacientes` y `/admin` con rol | Protege rutas sin validar rol | Sin middleware | /10 |
| 7 | `RoleGuard`: renderizado condicional | Usado en NavBar, botones y páginas | En la mayoría de lugares | Ausente o no funciona | /10 |
| 8 | Tabla de pruebas completa | Todos los casos con evidencia | Mayoría de casos probados | Pocos casos sin documentación | /10 |
| 9 | Código limpio y TypeScript correcto | Sin `any`, tipos correctos, organizado | Algunos tipos faltantes | Uso excesivo de `any` | /10 |
| 10 | Sustentación: explica JWT + RLS | Explica el ciclo completo con claridad | Explica parcialmente | No puede explicar el flujo | /10 |
| | **TOTAL** | | | | **/100** |

### Entregables requeridos

1. Repositorio en GitHub con el código completo (rama `main`).
2. URL del proyecto en Supabase (solo lectura).
3. Capturas de pantalla con el comportamiento de cada rol.
4. Tabla de pruebas (Paso C) completada con los resultados obtenidos.
5. Explicación escrita (mín. 200 palabras) del flujo JWT + RLS en tu propio lenguaje.

---

> 🎓 **¡Éxito en tu implementación!**  
> *Recuerda: la seguridad real está en el RLS de Supabase, no en el frontend.*

---

*SENA — Centro de Electricidad, Electrónica y Telecomunicaciones · Regional Distrito Capital*

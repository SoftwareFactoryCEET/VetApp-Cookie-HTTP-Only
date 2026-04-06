# VetApp — Cookie HTTP-Only

Sistema de gestión para clínicas veterinarias construido con **Next.js 16**, **Supabase** y autenticación segura mediante **cookies HTTP-only**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Backend/DB | Supabase (PostgreSQL + Auth) |
| SSR seguro | @supabase/ssr 0.10 |
| Validación | Zod 4 |
| Iconos | lucide-react |
| Lenguaje | TypeScript 5 |

---

## Arquitectura

El proyecto sigue una **arquitectura por capas** con el patrón Repository:

```
Páginas git / Componentes
        ↓
   Hooks (estado)
        ↓
  Servicios (lógica)
        ↓
 Repositorios (datos)
        ↓
 Clientes Supabase
```

Cada capa se comunica únicamente con la inmediatamente inferior, lo que permite intercambiar la implementación de Supabase por cualquier otro backend sin tocar la UI.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # Layout raíz con NavBar
│   ├── page.tsx                # Página pública de inicio
│   ├── login/page.tsx          # Formulario de inicio de sesión
│   ├── registro/page.tsx       # Formulario de registro
│   ├── pacientes/
│   │   ├── page.tsx            # Lista de pacientes (protegida, filtrada por rol)
│   │   └── nuevo/page.tsx      # Crear paciente (admin/vet)
│   └── admin/page.tsx          # Dashboard de administración (solo admin)
├── components/
│   ├── NavBar.tsx              # Navegación con menú por rol
│   └── RoleGuard.tsx           # Renderizado condicional por rol
├── hooks/
│   ├── useAuth.ts              # Estado de sesión y métodos de auth
│   └── usePacientes.ts         # CRUD de pacientes con loading/error
├── lib/
│   └── supabase/
│       ├── clients.ts          # Cliente browser (cookies)
│       └── server.ts           # Cliente SSR (Server Components)
├── repositories/
│   ├── IAuthRepository.ts
│   ├── IPacienteRepository.ts
│   └── supabase/
│       ├── AuthRepository.ts   # Implementación auth + decodificación JWT
│       └── PacienteRepository.ts # CRUD + validación Zod
├── services/
│   ├── authService.ts
│   └── pacienteService.ts
├── types/
│   └── domain/
│       ├── profile.schema.ts   # Roles y tipos de sesión
│       └── paciente.schema.ts  # Entidad paciente
└── proxy.ts                    # Protección de rutas (reemplaza middleware en Next.js 16)
```

---

## Control de acceso (RBAC)

Hay tres roles definidos:

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `owner` | Propietario de mascota | Sus propios pacientes |
| `vet` | Veterinario | Sus pacientes asignados |
| `admin` | Administrador | Todos los pacientes + dashboard |

El acceso se aplica en **tres niveles**:

1. **UI** — `RoleGuard` oculta elementos según el rol activo.
2. **Servidor** — `proxy.ts` bloquea rutas antes de renderizar.
3. **Base de datos** — Row Level Security (RLS) en Supabase filtra los datos directamente.

---

## Autenticación con cookies HTTP-only

El JWT de sesión se almacena en una cookie HTTP-only gestionada por `@supabase/ssr`, lo que impide el acceso desde JavaScript del cliente (protección contra XSS).

**Flujo:**

1. El usuario se registra → Supabase crea el usuario → un trigger de PostgreSQL asigna el rol `owner` y crea el perfil.
2. En el login → Supabase valida credenciales → devuelve JWT con el claim `user_role` (inyectado por un Custom Access Token Hook).
3. `AuthRepository` decodifica el JWT para leer el rol sin consultas adicionales a la base de datos.
4. `proxy.ts` verifica la sesión en el servidor antes de cada ruta protegida.
5. Al cerrar sesión → se limpia el estado y la cookie; `usePacientes` borra los datos en memoria.

---

## Base de datos (Supabase)

**Tablas principales:**

- `public.profiles` — id, role (`owner|vet|admin`), full_name, updated_at
- `public.pacientes` — id, nombre, especie, raza, edad_meses, owner_id, vet_id, activo, created_at

**Configuración requerida en Supabase:**
- Trigger en `auth.users` para crear el perfil con rol `owner`.
- Custom Access Token Hook que inyecta `user_role` en el JWT.
- Políticas RLS por rol en la tabla `pacientes`.

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

```bash
# Compilar para producción
npm run build

# Iniciar en modo producción
npm start

# Ejecutar linter
npm run lint
```

---

## Patrones y convenciones notables

- **Interfaces de repositorio** (`IAuthRepository`, `IPacienteRepository`) desacoplan la lógica de negocio de Supabase — se puede cambiar por otro proveedor sin modificar servicios ni componentes.
- **Zod en repositorios** — toda respuesta de Supabase se parsea con `.parse()` antes de exponerse, garantizando tipado en runtime.
- **Limpieza post-logout** — `usePacientes` vacía la lista al detectar cierre de sesión para evitar filtración de datos entre usuarios del mismo navegador.
- **Accesibilidad** — atributos ARIA (`aria-live`, `role="alert"`), targets táctiles de 44 px y HTML semántico en todos los formularios.
- **Idioma** — interfaz, comentarios y nombres de variables completamente en español.

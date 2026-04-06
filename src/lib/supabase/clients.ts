'use client'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Crea un cliente Supabase para componentes del lado del cliente.
 * Gestiona automáticamente las cookies del JWT en el navegador.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

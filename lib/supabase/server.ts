import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server-side Supabase client.
 * Use this in Server Components, API route handlers, and middleware.
 * Manages JWT session via HTTP-only cookies.
 */
export async function createClient() {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error(
            `Missing Supabase environment variables: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''
            }. Please check your .env.local file and restart your development server.`
        )
    }

    return createServerClient<Database>(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // setAll called from a Server Component — safe to ignore.
                    // The middleware handles session refresh.
                }
            },
        },
    }
    )
}

/**
 * Service-role Supabase client.
 * Bypasses RLS — use ONLY in trusted server-side API routes.
 * Never expose the service role key to the browser.
 */
export async function createServiceClient() {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
            `Missing Supabase environment variables: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'SUPABASE_SERVICE_ROLE_KEY' : ''
            }. Please check your .env.local file and restart your development server.`
        )
    }

    return createServerClient<Database>(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch { }
            },
        },
    }
    )
}

/**
 * Pure Admin Supabase client.
 * Completely bypasses RLS and ignores the user's session.
 * Use for background worker tasks or system-level DB writes.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
            `Missing Supabase environment variables: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'SUPABASE_SERVICE_ROLE_KEY' : ''
            }. Please check your .env.local file and restart your development server.`
        )
    }

    return createSupabaseClient<Database>(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
    )
}

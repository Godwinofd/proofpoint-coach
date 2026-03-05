import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/lessons/today
 *
 * Cache-first lesson fetcher.
 *
 * Cache logic:
 *   1. Query the `lessons` table for a row where:
 *        user_id = current user
 *        scheduled_date = today (UTC)
 *   2a. If a row exists → return it immediately (cache HIT, no OpenAI call)
 *   2b. If no row exists → call POST /api/lessons/generate to generate one
 *
 * Why DB-backed cache (not in-memory)?
 *   Vercel serverless functions are stateless — each invocation may run on a
 *   different container. An in-memory Map would reset on every cold start.
 *   Supabase as the cache store is free, persistent, and already RLS-protected.
 *
 * Cache TTL:
 *   Natural TTL = 1 day. Each day's lesson has `scheduled_date = today`.
 *   The next day, the query returns no row → new generation triggered.
 *   No manual invalidation is needed for the daily lesson.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // ── 1. Authenticate ──────────────────────────────────────────────────────
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const today = new Date().toISOString().split('T')[0]

        const { data: cached } = await adminClient
            .from('lessons')
            .select('*')
            .eq('user_id', user.id)
            .eq('scheduled_date', today)
            .order('generation', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (cached) {
            // Cache HIT — return existing lesson, no OpenAI call
            return NextResponse.json({ lesson: cached, cached: true }, { status: 200 })
        }

        console.log('[/api/lessons/today] Cache MISS')

        // ── 3. Cache MISS — generate a new lesson ────────────────────────────────
        const baseUrl = request.nextUrl.origin
        const generateResponse = await fetch(`${baseUrl}/api/lessons/generate`, {
            method: 'POST',
            headers: {
                // Forward the Cookie header so the generate route can authenticate via
                // the same Supabase session
                cookie: request.headers.get('cookie') ?? '',
                'content-type': 'application/json',
            },
            body: JSON.stringify({ date: today }),
        })

        if (!generateResponse.ok) {
            const errorBody = await generateResponse.json().catch(() => ({}))
            return NextResponse.json(
                { error: 'Failed to generate lesson', details: errorBody },
                { status: generateResponse.status }
            )
        }

        const { lesson } = await generateResponse.json()
        return NextResponse.json({ lesson, cached: false }, { status: 200 })
    } catch (err) {
        console.error('[/api/lessons/today]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

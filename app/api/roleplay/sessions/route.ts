import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type SessionInsert = Database['public']['Tables']['roleplay_sessions']['Insert']

/**
 * POST /api/roleplay/sessions
 *
 * Creates a new roleplay session for the authenticated user.
 *
 * Body:
 * {
 *   scenario: 'discovery_call' | 'objection_handling' | 'demo_follow_up' | 'needs_analysis' | 'closing'
 *   persona?: string   — defaults to Klaus Bauer
 *   language_mode?: 'german' | 'english' | 'mixed'   — defaults to 'german'
 *   lesson_id?: string — optionally link to today's lesson
 * }
 *
 * Returns: { session }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            scenario,
            persona = 'Klaus Bauer, IT Security Manager, Mittelstand Manufacturing, 900 Mitarbeiter. Verantwortlich für E-Mail-Sicherheit, Identity Protection und DSGVO-Compliance.',
            language_mode = 'german',
            lesson_id,
        } = body

        if (!scenario) {
            return NextResponse.json({ error: 'scenario is required' }, { status: 400 })
        }

        const validScenarios = [
            'discovery_call',
            'objection_handling',
            'demo_follow_up',
            'needs_analysis',
            'closing',
        ]
        if (!validScenarios.includes(scenario)) {
            return NextResponse.json(
                { error: `scenario must be one of: ${validScenarios.join(', ')}` },
                { status: 400 }
            )
        }

        const sessionInsert: SessionInsert = {
            user_id: user.id,
            scenario,
            persona,
            language_mode,
            status: 'active',
            ...(lesson_id ? { lesson_id } : {}),
        }

        const { data: session, error } = await supabase
            .from('roleplay_sessions')
            .insert(sessionInsert as never)
            .select()
            .single()

        if (error || !session) {
            return NextResponse.json(
                { error: 'Failed to create session', details: error?.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ session }, { status: 201 })
    } catch (err) {
        console.error('[/api/roleplay/sessions POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/roleplay/sessions
 *
 * Lists roleplay sessions for the authenticated user.
 * Query params:
 *   status: 'active' | 'completed' | 'abandoned'  (optional filter)
 *   limit:  number (default 20)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServiceClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

        let query = supabase
            .from('roleplay_sessions')
            .select('id, scenario, persona, language_mode, status, evaluation, completed_at, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (status) {
            query = query.eq('status', status)
        }

        const { data: sessions, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ sessions: sessions ?? [] }, { status: 200 })
    } catch (err) {
        console.error('[/api/roleplay/sessions GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

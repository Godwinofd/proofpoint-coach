import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type SubmissionInsert = Database['public']['Tables']['writing_submissions']['Insert']

/**
 * POST /api/writing
 *
 * Creates a new writing submission for the authenticated user.
 * Stores the prompt and submission_text in Supabase.
 * AI feedback is NOT generated here — call /api/writing/[id]/feedback for that.
 *
 * Body:
 * {
 *   prompt: string           — the writing task prompt shown to the user
 *   submission_text: string  — the user's German writing
 *   lesson_id?: string       — optionally link to a lesson
 * }
 *
 * Returns: { submission }
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
        const { prompt, submission_text, lesson_id } = body

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
        }
        if (
            !submission_text ||
            typeof submission_text !== 'string' ||
            submission_text.trim().length === 0
        ) {
            return NextResponse.json({ error: 'submission_text is required' }, { status: 400 })
        }

        const insert: SubmissionInsert = {
            user_id: user.id,
            prompt: prompt.trim(),
            submission_text: submission_text.trim(),
            ...(lesson_id ? { lesson_id } : {}),
        }

        const { data: submission, error } = await supabase
            .from('writing_submissions')
            .insert(insert as never)
            .select()
            .single()

        if (error || !submission) {
            return NextResponse.json(
                { error: 'Failed to save submission', details: error?.message },
                { status: 500 }
            )
        }

        // Increment writing_submissions_count in progress table
        await supabase.rpc('increment_writing_count' as never, {
            p_user_id: user.id,
        } as never)

        return NextResponse.json({ submission }, { status: 201 })
    } catch (err) {
        console.error('[/api/writing POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/writing
 *
 * Lists writing submissions for the authenticated user (most recent first).
 *
 * Query params:
 *   limit: number (default 20, max 50)
 *   has_feedback: 'true' | 'false'  — filter by whether AI feedback exists
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
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
        const hasFeedback = searchParams.get('has_feedback')

        let query = supabase
            .from('writing_submissions')
            .select(
                'id, prompt, submission_text, word_count, ai_feedback, feedback_generated_at, submitted_at, lesson_id'
            )
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false })
            .limit(limit)

        if (hasFeedback === 'true') {
            query = query.not('feedback_generated_at', 'is', null)
        } else if (hasFeedback === 'false') {
            query = query.is('feedback_generated_at', null)
        }

        const { data: submissions, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ submissions: submissions ?? [] }, { status: 200 })
    } catch (err) {
        console.error('[/api/writing GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

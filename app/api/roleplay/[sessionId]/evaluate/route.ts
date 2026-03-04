import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { openai, DEFAULT_MODEL } from '@/lib/ai/client'
import {
    buildEvaluationSystemPrompt,
    buildEvaluationUserPrompt,
} from '@/lib/ai/prompts/roleplayPrompt'
import type { Database } from '@/types/database'

type SessionRow = Database['public']['Tables']['roleplay_sessions']['Row']

/**
 * POST /api/roleplay/[sessionId]/evaluate
 *
 * Evaluates a completed roleplay session.
 *
 * Steps:
 *   1. Authenticate user
 *   2. Load session (must belong to user)
 *   3. Load full message transcript
 *   4. Send transcript to OpenAI with evaluation prompt
 *   5. Parse structured JSON evaluation
 *   6. Store evaluation in roleplay_sessions.evaluation (jsonb)
 *   7. Mark session as 'completed'
 *   8. Increment progress.roleplay_sessions_completed
 *   9. Return evaluation JSON
 *
 * Notes:
 *   - Can be called even if session status is still 'active' — calling evaluate
 *     implicitly closes the session.
 *   - If evaluate has already been called (evaluation is non-null), the stored
 *     result is returned immediately without a new OpenAI call (idempotent).
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const { sessionId } = await params

    try {
        const supabase = await createServiceClient()

        // ── 1. Authenticate ──────────────────────────────────────────────────────
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── 2. Load session ───────────────────────────────────────────────────────
        const { data: session, error: sessionError } = await supabase
            .from('roleplay_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const typedSession = session as SessionRow

        // ── 3. Idempotency — return cached evaluation if already done ─────────────
        if (typedSession.evaluation) {
            return NextResponse.json(
                { evaluation: typedSession.evaluation, cached: true },
                { status: 200 }
            )
        }

        // ── 4. Load message transcript ────────────────────────────────────────────
        const { data: messages, error: messagesError } = await supabase
            .from('roleplay_messages')
            .select('role, content, turn_index')
            .eq('session_id', sessionId)
            .order('turn_index', { ascending: true })

        if (messagesError) {
            return NextResponse.json({ error: messagesError.message }, { status: 500 })
        }

        const transcript = (messages ?? []) as Array<{ role: string; content: string }>

        if (transcript.length < 2) {
            return NextResponse.json(
                { error: 'Session must have at least one exchange before evaluation' },
                { status: 400 }
            )
        }

        // Filter to only BDR (user) turns for evaluation — we need at least 1
        const userTurns = transcript.filter((m) => m.role === 'user')
        if (userTurns.length === 0) {
            return NextResponse.json(
                { error: 'No user messages found to evaluate' },
                { status: 400 }
            )
        }

        // ── 5. Call OpenAI for evaluation ─────────────────────────────────────────
        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: buildEvaluationSystemPrompt() },
                { role: 'user', content: buildEvaluationUserPrompt(transcript) },
            ],
            temperature: 0.3, // Lower temp for consistent, reliable scoring
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        })

        const rawContent = completion.choices[0]?.message?.content
        if (!rawContent) {
            return NextResponse.json(
                { error: 'OpenAI returned empty evaluation' },
                { status: 502 }
            )
        }

        // ── 6. Parse evaluation JSON ───────────────────────────────────────────────
        let evaluation: Record<string, unknown>
        try {
            evaluation = JSON.parse(rawContent) as Record<string, unknown>
        } catch {
            return NextResponse.json(
                { error: 'Evaluation response was not valid JSON', raw: rawContent },
                { status: 502 }
            )
        }

        // ── 7. Build a plain-text summary for the sessions table ─────────────────
        const overallScore = (evaluation.overall_score as { score?: number })?.score ?? 0
        const summary = (evaluation.overall_summary as string) ?? ''

        // ── 8. Persist evaluation + mark session completed ────────────────────────
        const { error: updateError } = await supabase
            .from('roleplay_sessions')
            .update({
                evaluation: evaluation as never,
                ai_feedback_summary: summary,
                status: 'completed',
                completed_at: new Date().toISOString(),
            } as never)
            .eq('id', sessionId)

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to save evaluation', details: updateError.message },
                { status: 500 }
            )
        }

        // ── 9. Increment progress counter ─────────────────────────────────────────
        await supabase.rpc('increment_roleplay_completed' as never, {
            p_user_id: user.id,
        } as never)

        return NextResponse.json(
            {
                evaluation,
                overall_score: overallScore,
                cached: false,
            },
            { status: 200 }
        )
    } catch (err) {
        console.error('[/api/roleplay/[sessionId]/evaluate POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

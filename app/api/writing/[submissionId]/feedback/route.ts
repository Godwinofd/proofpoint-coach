import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { openai, DEFAULT_MODEL } from '@/lib/ai/client'
import { buildWritingPrompts } from '@/lib/ai/prompts/writingPrompt'
import type { Database } from '@/types/database'

type SubmissionRow = Database['public']['Tables']['writing_submissions']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

/**
 * POST /api/writing/[submissionId]/feedback
 *
 * Generates AI feedback for a writing submission.
 *
 * Steps:
 *   1. Authenticate user
 *   2. Load the submission (verify ownership)
 *   3. Check idempotency — return cached feedback if already generated
 *   4. Fetch user CEFR level (to calibrate AI expectations)
 *   5. Build prompts and call OpenAI with json_object format
 *   6. Parse and validate JSON response
 *   7. Persist feedback to writing_submissions (corrected_text, ai_feedback, feedback_generated_at)
 *   8. Return full feedback JSON
 *
 * Returns: { feedback, submission_id, cached: boolean }
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    const { submissionId } = await params

    try {
        const supabase = await createServiceClient()

        // ── 1. Authenticate ──────────────────────────────────────────────────────
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── 2. Load submission ────────────────────────────────────────────────────
        const { data: submission, error: submissionError } = await supabase
            .from('writing_submissions')
            .select('*')
            .eq('id', submissionId)
            .eq('user_id', user.id)
            .single()

        if (submissionError || !submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        const typedSubmission = submission as SubmissionRow

        // ── 3. Idempotency — return cached feedback if already generated ───────────
        if (typedSubmission.ai_feedback && typedSubmission.feedback_generated_at) {
            return NextResponse.json(
                {
                    feedback: typedSubmission.ai_feedback,
                    corrected_text: typedSubmission.corrected_text,
                    submission_id: submissionId,
                    cached: true,
                },
                { status: 200 }
            )
        }

        // ── 4. Fetch user CEFR level ──────────────────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('cefr_level')
            .eq('id', user.id)
            .single()

        const level =
            (profile as Pick<ProfileRow, 'cefr_level'> | null)?.cefr_level ?? 'B1'

        // ── 5. Build prompts and call OpenAI ─────────────────────────────────────
        const { systemPrompt, userPrompt } = buildWritingPrompts({
            writingPrompt: typedSubmission.prompt,
            submissionText: typedSubmission.submission_text,
            level,
        })

        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3, // Lower temp for consistent, reliable evaluation
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        })

        const rawContent = completion.choices[0]?.message?.content
        if (!rawContent) {
            return NextResponse.json(
                { error: 'OpenAI returned empty feedback' },
                { status: 502 }
            )
        }

        // ── 6. Parse and validate the JSON response ───────────────────────────────
        let feedback: Record<string, unknown>
        try {
            feedback = JSON.parse(rawContent) as Record<string, unknown>
        } catch {
            return NextResponse.json(
                { error: 'Feedback response was not valid JSON', raw: rawContent },
                { status: 502 }
            )
        }

        // Validate required keys
        const requiredKeys = [
            'grammar_score',
            'vocabulary_score',
            'tone_score',
            'clarity_score',
            'corrected_version',
            'corrections',
            'overall_feedback',
        ]
        const missingKeys = requiredKeys.filter((k) => !(k in feedback))
        if (missingKeys.length > 0) {
            return NextResponse.json(
                { error: `Feedback missing required keys: ${missingKeys.join(', ')}` },
                { status: 502 }
            )
        }

        const correctedText = (feedback.corrected_version as string) ?? null

        // ── 7. Persist feedback to Supabase ───────────────────────────────────────
        const { error: updateError } = await supabase
            .from('writing_submissions')
            .update({
                corrected_text: correctedText,
                ai_feedback: feedback as never,
                feedback_generated_at: new Date().toISOString(),
            } as never)
            .eq('id', submissionId)

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to save feedback', details: updateError.message },
                { status: 500 }
            )
        }

        // ── 8. Return ─────────────────────────────────────────────────────────────
        return NextResponse.json(
            {
                feedback,
                corrected_text: correctedText,
                submission_id: submissionId,
                cached: false,
            },
            { status: 200 }
        )
    } catch (err) {
        console.error('[/api/writing/[submissionId]/feedback POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/writing/[submissionId]/feedback
 *
 * Returns existing feedback for a submission (if already generated).
 * Returns 404 if feedback has not been generated yet.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    const { submissionId } = await params

    try {
        const supabase = await createServiceClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: submission, error } = await supabase
            .from('writing_submissions')
            .select('id, ai_feedback, corrected_text, feedback_generated_at')
            .eq('id', submissionId)
            .eq('user_id', user.id)
            .single()

        if (error || !submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        const typed = submission as Pick<
            SubmissionRow,
            'id' | 'ai_feedback' | 'corrected_text' | 'feedback_generated_at'
        >

        if (!typed.ai_feedback) {
            return NextResponse.json({ error: 'Feedback not yet generated' }, { status: 404 })
        }

        return NextResponse.json(
            {
                feedback: typed.ai_feedback,
                corrected_text: typed.corrected_text,
                submission_id: submissionId,
            },
            { status: 200 }
        )
    } catch (err) {
        console.error('[/api/writing/[submissionId]/feedback GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

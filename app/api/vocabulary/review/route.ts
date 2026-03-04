import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateNextReview } from '@/lib/srs/algorithm'
import type { Database } from '@/types/database'

type VocabRow = Database['public']['Tables']['vocabulary']['Row']
type VocabReviewInsert = Database['public']['Tables']['vocabulary_reviews']['Insert']

/**
 * GET /api/vocabulary/review
 *
 * Returns all vocabulary words due for review today (next_review_date <= today).
 * Ordered by next_review_date ASC, then mastery_level ASC (lowest mastery first).
 *
 * Query params:
 *   limit: number (default 20, max 50) — limits session length
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

        const today = new Date().toISOString().split('T')[0]

        const { data: words, error } = await supabase
            .from('vocabulary')
            .select('*')
            .eq('user_id', user.id)
            .lte('next_review_date', today)
            .order('next_review_date', { ascending: true })
            .order('mastery_level', { ascending: true })
            .limit(limit)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(
            {
                words: words ?? [],
                count: (words ?? []).length,
                due_date: today,
            },
            { status: 200 }
        )
    } catch (err) {
        console.error('[/api/vocabulary/review GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/vocabulary/review
 *
 * Submits a review result for a vocabulary word.
 *
 * Steps:
 *   1. Authenticate user
 *   2. Load the current SM-2 state of the word
 *   3. Calculate new SM-2 state via calculateNextReview()
 *   4. Update vocabulary row (interval_days, ease_factor, mastery_level, next_review_date)
 *   5. Create vocabulary_reviews audit row
 *   6. If newly mastered → call increment_vocabulary_mastered RPC
 *   7. Return updated word + SRS result
 *
 * Body: { word_id: string, rating: number (0–5) }
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
        const { word_id, rating } = body

        if (!word_id || rating === undefined) {
            return NextResponse.json(
                { error: 'word_id and rating are required' },
                { status: 400 }
            )
        }

        const parsedRating = parseInt(String(rating), 10)
        if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            return NextResponse.json(
                { error: 'rating must be an integer between 0 and 5' },
                { status: 400 }
            )
        }

        // ── Load current word state ───────────────────────────────────────────────
        const { data: word, error: wordError } = await supabase
            .from('vocabulary')
            .select('*')
            .eq('id', word_id)
            .eq('user_id', user.id)
            .single()

        if (wordError || !word) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 })
        }

        const typedWord = word as VocabRow

        // ── Run SM-2 algorithm ────────────────────────────────────────────────────
        const srsResult = calculateNextReview(
            {
                mastery_level: typedWord.mastery_level,
                interval_days: typedWord.interval_days,
                ease_factor: Number(typedWord.ease_factor),
            },
            parsedRating
        )

        // ── Update vocabulary row ─────────────────────────────────────────────────
        const { error: updateError } = await supabase
            .from('vocabulary')
            .update({
                mastery_level: srsResult.new_mastery_level,
                interval_days: srsResult.new_interval_days,
                ease_factor: srsResult.new_ease_factor,
                next_review_date: srsResult.next_review_date,
                last_reviewed_at: new Date().toISOString(),
            } as never)
            .eq('id', word_id)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // ── Create audit review row ───────────────────────────────────────────────
        const reviewInsert: VocabReviewInsert = {
            word_id,
            user_id: user.id,
            rating: parsedRating,
            previous_interval: typedWord.interval_days,
            new_interval: srsResult.new_interval_days,
            previous_ease: Number(typedWord.ease_factor),
            new_ease: srsResult.new_ease_factor,
        }

        await supabase
            .from('vocabulary_reviews')
            .insert(reviewInsert as never)

        // ── Increment mastered count if newly mastered ────────────────────────────
        if (srsResult.is_mastered && !srsResult.was_mastered) {
            await supabase.rpc('increment_vocabulary_mastered' as never, {
                p_user_id: user.id,
                p_count: 1,
            } as never)
        }

        return NextResponse.json(
            {
                srs_result: srsResult,
                word_id,
                rating: parsedRating,
            },
            { status: 200 }
        )
    } catch (err) {
        console.error('[/api/vocabulary/review POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

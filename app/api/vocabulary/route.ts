import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type VocabInsert = Database['public']['Tables']['vocabulary']['Insert']

/**
 * GET /api/vocabulary
 *
 * Returns all vocabulary words for the authenticated user.
 * Supports filtering by topic and mastery_level.
 *
 * Query params:
 *   topic:          string  — filter by cybersecurity topic
 *   mastery_level:  number  — filter by exact mastery level (0–5)
 *   limit:          number  — default 100, max 200
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
        const topic = searchParams.get('topic')
        const masteryLevel = searchParams.get('mastery_level')
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200)

        let query = supabase
            .from('vocabulary')
            .select('*')
            .eq('user_id', user.id)
            .order('next_review_date', { ascending: true })
            .limit(limit)

        if (topic) {
            query = query.eq('topic', topic)
        }

        if (masteryLevel !== null) {
            query = query.eq('mastery_level', parseInt(masteryLevel, 10))
        }

        const { data: words, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ words: words ?? [], count: (words ?? []).length }, { status: 200 })
    } catch (err) {
        console.error('[/api/vocabulary GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/vocabulary
 *
 * Adds one or more vocabulary words for the authenticated user.
 * Used by the lesson generation system to seed words, and can be
 * called manually to add custom words.
 *
 * Body (single word):
 * {
 *   word_de: string
 *   word_en: string
 *   example_sentence?: string
 *   topic?: string
 *   lesson_id?: string
 * }
 *
 * Body (batch):
 * {
 *   words: Array<{ word_de, word_en, example_sentence?, topic?, lesson_id? }>
 * }
 *
 * Returns: { words: VocabRow[] }
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
        const today = new Date().toISOString().split('T')[0]

        // Normalise into an array (support single word or batch)
        const rawWords: Array<{
            word_de: string
            word_en: string
            example_sentence?: string
            topic?: string
            lesson_id?: string
        }> = Array.isArray(body.words) ? body.words : [body]

        if (rawWords.length === 0) {
            return NextResponse.json({ error: 'No words provided' }, { status: 400 })
        }

        // Validate required fields
        for (const w of rawWords) {
            if (!w.word_de || !w.word_en) {
                return NextResponse.json(
                    { error: 'Each word must have word_de and word_en' },
                    { status: 400 }
                )
            }
        }

        const vocabRows: VocabInsert[] = rawWords.map((w) => ({
            user_id: user.id,
            word_de: w.word_de.trim(),
            word_en: w.word_en.trim(),
            example_sentence: w.example_sentence?.trim() ?? null,
            topic: w.topic?.trim() ?? null,
            lesson_id: w.lesson_id ?? null,
            // SM-2 initial state
            mastery_level: 0,
            interval_days: 1,
            ease_factor: 2.5,
            next_review_date: today,
        }))

        const { data: inserted, error } = await supabase
            .from('vocabulary')
            .upsert(vocabRows as never[], {
                ignoreDuplicates: false,
                onConflict: 'user_id,word_de', // avoid exact duplicates per user
            })
            .select()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update vocabulary_words_total in progress
        const insertedCount = (inserted ?? []).length
        if (insertedCount > 0) {
            await supabase.rpc('increment_vocabulary_total' as never, {
                p_user_id: user.id,
                p_count: insertedCount,
            } as never)
        }

        return NextResponse.json(
            { words: inserted ?? [], count: insertedCount },
            { status: 201 }
        )
    } catch (err) {
        console.error('[/api/vocabulary POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

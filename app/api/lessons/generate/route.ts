import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { openai, DEFAULT_MODEL } from '@/lib/ai/client'
import { buildLessonPrompts } from '@/lib/ai/prompts/lessonPrompt'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type LessonInsert = Database['public']['Tables']['lessons']['Insert']
type VocabInsert = Database['public']['Tables']['vocabulary']['Insert']

/**
 * POST /api/lessons/generate
 *
 * Generates a new AI lesson for the authenticated user.
 * Steps:
 *   1. Authenticate user via service client (service role bypasses RLS)
 *   2. Fetch user CEFR level + recent lesson topics (for deduplication)
 *   3. Build prompts and call OpenAI with json_object response format
 *   4. Parse and validate the JSON response shape
 *   5. Store the lesson in Supabase lessons table
 *   6. Seed vocabulary_words from the lesson vocabulary array
 *   7. Return the full lesson object
 *
 * Body (optional): { topic?: string, date?: string }
 *   - topic: force a specific cybersecurity focus topic
 *   - date:  override scheduled_date (defaults to today UTC)
 */
export async function POST(request: NextRequest) {
    try {
        // Use service client — we need to write to multiple tables in one request
        const supabase = await createServiceClient()

        // ── 1. Authenticate ──────────────────────────────────────────────────────
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── 2. Parse optional body params ────────────────────────────────────────
        let topic: string | undefined
        let scheduledDate: string = new Date().toISOString().split('T')[0]

        try {
            const body = await request.json()
            topic = body?.topic
            if (body?.date) scheduledDate = body.date
        } catch {
            // Body is optional — ignore parse errors
        }

        // ── 3. Fetch user profile (CEFR level) ───────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('cefr_level')
            .eq('id', user.id)
            .single()

        const level: ProfileRow['cefr_level'] =
            (profile as Pick<ProfileRow, 'cefr_level'> | null)?.cefr_level ?? 'B1'

        // ── 4. Fetch recent topics to avoid repetition ───────────────────────────
        const { data: recentLessons } = await supabase
            .from('lessons')
            .select('topic')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        const recentTopics: string[] = (recentLessons ?? []).map(
            (l: { topic: string }) => l.topic
        )

        // ── 5. Build prompts and call OpenAI ─────────────────────────────────────
        const { systemPrompt, userPrompt } = buildLessonPrompts({
            level,
            recentTopics,
            focusTopic: topic,
        })

        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
        })

        const rawContent = completion.choices[0]?.message?.content
        if (!rawContent) {
            return NextResponse.json(
                { error: 'OpenAI returned an empty response' },
                { status: 502 }
            )
        }

        // ── 6. Parse and validate the JSON ───────────────────────────────────────
        let generated: Record<string, unknown>
        try {
            generated = JSON.parse(rawContent) as Record<string, unknown>
        } catch {
            return NextResponse.json(
                { error: 'OpenAI response was not valid JSON', raw: rawContent },
                { status: 502 }
            )
        }

        const requiredKeys = [
            'title', 'topic', 'vocabulary', 'listening', 'speaking', 'reading', 'writing`,
        ]
        const missingKeys = requiredKeys.filter((k) => !(k in generated))
        if (missingKeys.length > 0) {
            return NextResponse.json(
                { error: `Generated lesson missing required keys: ${missingKeys.join(', ')}` },
                { status: 502 }
            )
        }

        // ── 7. Store the lesson in Supabase ──────────────────────────────────────
        const lessonInsert: LessonInsert = {
            user_id: user.id,
            title: generated.title as string,
            topic: generated.topic as string,
            level,
            status: `not_started',
            generated_content: generated as LessonInsert['generated_content'],
            scheduled_date: scheduledDate,
            generation: 1,
        }

        const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .insert(lessonInsert as never)
            .select()
            .single()

        if (lessonError || !lesson) {
            return NextResponse.json(
                { error: 'Failed to save lesson', details: lessonError?.message },
                { status: 500 }
            )
        }

        const savedLesson = lesson as Database['public']['Tables']['lessons']['Row']

        // ── 8. Seed vocabulary_words ─────────────────────────────────────────────
        const vocabItems = generated.vocabulary as Array<{
            word_de: string
            word_en: string
            example_sentence?: string
        }>

        if (Array.isArray(vocabItems) && vocabItems.length > 0) {
            const vocabRows: VocabInsert[] = vocabItems.map((v) => ({
                user_id: user.id,
                lesson_id: savedLesson.id,
                word_de: v.word_de,
                word_en: v.word_en,
                example_sentence: v.example_sentence ?? null,
                topic: generated.topic as string,
                mastery_level: 0,
                interval_days: 1,
                ease_factor: 2.5,
                next_review_date: scheduledDate,
            }))

            await supabase
                .from('vocabulary')
                .upsert(vocabRows as never[], { ignoreDuplicates: true })
        }

        return NextResponse.json({ lesson: savedLesson }, { status: 201 })
    } catch (err) {
        console.error('[/api/lessons/generate]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

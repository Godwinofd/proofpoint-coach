import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { openai, DEFAULT_MODEL } from '@/lib/ai/client'
import { buildRoleplaySystemPrompt } from '@/lib/ai/prompts/roleplayPrompt'
import type { Database } from '@/types/database'

type SessionRow = Database['public']['Tables']['roleplay_sessions']['Row']
type MessageInsert = Database['public']['Tables']['roleplay_messages']['Insert']

/**
 * POST /api/roleplay/[sessionId]/message
 *
 * Sends a user message and streams back the AI persona's response.
 *
 * Message Flow:
 *   1. Authenticate user
 *   2. Load session (verify ownership + active status)
 *   3. Load full message history from roleplay_messages
 *   4. Save the incoming user message
 *   5. Build messages array: [system, ...history, user message]
 *   6. Stream OpenAI completion back to the client via ReadableStream
 *   7. On stream end, save complete AI response to roleplay_messages
 *
 * Streaming:
 *   Uses the Web Streams API (ReadableStream) with Server-Sent Events format.
 *   Each chunk is prefixed with "data: " and ends with "\n\n".
 *   The terminal chunk is "data: [DONE]\n\n".
 *   This matches the EventSource / SSE format the frontend will consume.
 *
 * Body: { content: string }
 * Returns: text/event-stream
 */
export async function POST(
    request: NextRequest,
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

        // ── 2. Load and validate session ─────────────────────────────────────────
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
        if (typedSession.status !== 'active') {
            return NextResponse.json(
                { error: 'Session is not active' },
                { status: 409 }
            )
        }

        // ── 3. Parse user message ─────────────────────────────────────────────────
        const { content } = await request.json()
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'content is required' }, { status: 400 })
        }

        // ── 4. Load message history ───────────────────────────────────────────────
        const { data: history } = await supabase
            .from('roleplay_messages')
            .select('role, content, turn_index')
            .eq('session_id', sessionId)
            .order('turn_index', { ascending: true })

        const messageHistory = (history ?? []) as Array<{
            role: string
            content: string
            turn_index: number
        }>

        // ── 5. Save user message ──────────────────────────────────────────────────
        const userTurnIndex = messageHistory.length
        const userMessage: MessageInsert = {
            session_id: sessionId,
            role: 'user',
            content: content.trim(),
            turn_index: userTurnIndex,
        }

        await supabase
            .from('roleplay_messages')
            .insert(userMessage as never)

        // ── 6. Build OpenAI messages array ────────────────────────────────────────
        const systemPrompt = buildRoleplaySystemPrompt({
            scenario: typedSession.scenario,
            persona: typedSession.persona,
            languageMode: typedSession.language_mode,
        })

        const openaiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt },
            // Replay full conversation history for context continuity
            ...messageHistory.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
            // The new user message
            { role: 'user', content: content.trim() },
        ]

        // ── 7. Stream OpenAI response ─────────────────────────────────────────────
        let aiFullResponse = ''
        const aiTurnIndex = userTurnIndex + 1

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()

                try {
                    const streamResponse = await openai.chat.completions.create({
                        model: DEFAULT_MODEL,
                        messages: openaiMessages,
                        temperature: 0.8,
                        max_tokens: 500,
                        stream: true,
                    })

                    for await (const chunk of streamResponse) {
                        const delta = chunk.choices[0]?.delta?.content ?? '`
                        if (delta) {
                            aiFullResponse += delta
                            // SSE format: "data: <content>\n\n"
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
                        }

                        // Stream finished
                        if (chunk.choices[0]?.finish_reason === `stop') {
                            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                        }
                    }
                } catch (streamErr) {
                    console.error('[roleplay message stream error]`, streamErr)
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
                    )
                } finally {
                    // ── 8. Persist the complete AI response ───────────────────────────
                    if (aiFullResponse.trim()) {
                        const aiMessage: MessageInsert = {
                            session_id: sessionId,
                            role: `assistant',
                            content: aiFullResponse.trim(),
                            turn_index: aiTurnIndex,
                        }
                        await supabase
                            .from('roleplay_messages')
                            .insert(aiMessage as never)
                    }
                    controller.close()
                }
            },
        })

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no', // Disable nginx buffering on Vercel
            },
        })
    } catch (err) {
        console.error('[/api/roleplay/[sessionId]/message POST]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/roleplay/[sessionId]/message
 *
 * Returns the full message history for a session.
 * Used to hydrate the chat UI on page load.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const { sessionId } = await params

    try {
        const supabase = await createServiceClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify session ownership
        const { data: session } = await supabase
            .from('roleplay_sessions')
            .select('id')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const { data: messages, error } = await supabase
            .from('roleplay_messages')
            .select('id, role, content, turn_index, created_at')
            .eq('session_id', sessionId)
            .order('turn_index', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ messages: messages ?? [] }, { status: 200 })
    } catch (err) {
        console.error('[/api/roleplay/[sessionId]/message GET]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

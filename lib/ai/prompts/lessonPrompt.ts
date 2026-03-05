import { cybersecurityContext } from '@/lib/ai/context/cybersecurity'
import { proofpointContext } from '@/lib/ai/context/proofpoint'
import { competitorsContext } from '@/lib/ai/context/competitors'
import { germanSalesContext } from '@/lib/ai/context/german-sales'

export type LessonPromptParams = {
    /** CEFR level of the learner */
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    /** Topics already covered — avoid repeating them */
    recentTopics: string[]
    /** Specific cybersecurity focus topic (optional — AI will choose if not provided) */
    focusTopic?: string
}

/**
 * JSON schema the AI must strictly follow.
 * Defined separately so it can be referenced in the prompt and kept in sync.
 */
export const LESSON_JSON_SCHEMA = {
    title: 'string — German lesson title (max 60 chars)',
    topic: 'string — main cybersecurity topic covered (e.g. "Phishing", "Ransomware", "BEC")',
    vocabulary: [
        {
            word_de: 'string — German term',
            word_en: 'string — English translation',
            example_sentence: 'string — German sentence using the word in a professional cybersecurity or sales context',
        },
    ],
    listening: {
        dialogue:
            'string — a realistic German business dialogue (150–250 words) between an IT Security Manager and a colleague discussing a cybersecurity issue. Format as: "Person A: ... Person B: ..."',
        questions: [
            {
                question: 'string — comprehension question in German',
                answer: 'string — correct answer in German',
            },
        ],
    },
    speaking: {
        scenario:
            'string — roleplay context description in English. Sets the scene for the user (Proofpoint BDR) calling a German IT Security Manager.',
        goal: 'string — what the user should achieve in the roleplay (in English)',
        starter_de:
            'string — the opening line the AI (as IT Security Manager) will say to begin the roleplay, in German',
    },
    reading: {
        article:
            'string — a 200–300 word German article explaining a cybersecurity concept relevant to the topic. Written at the specified CEFR level. Professional business German.',
        questions: [
            {
                question: 'string — comprehension or vocabulary question in German',
                answer: 'string — correct answer in German',
            },
        ],
    },
    writing: {
        prompt:
            'string — writing task instruction in English. Ask the user to write a professional German email or LinkedIn message related to the lesson topic (Proofpoint BDR context).',
        example:
            'string — a model answer in German (3–5 sentences) demonstrating the expected quality and tone.',
    },
}

/**
 * System prompt — establishes the AI`s role and output constraints.
 */
export function buildSystemPrompt(): string {
    return `You are an expert German language teacher and cybersecurity sales trainer.

You create structured German language lessons for a Proofpoint Business Development Representative (BDR) who is learning:
1. German business language (target: professional B2B fluency)
2. Cybersecurity concepts and terminology
3. Enterprise sales conversations with German IT security leaders

CRITICAL OUTPUT RULE:
You MUST respond with valid JSON only. No markdown. No explanation outside the JSON. No code fences.
The JSON must exactly match the schema provided in the user prompt.

LESSON QUALITY STANDARDS:
- All German content must be natural, professional business German — not textbook German
- Vocabulary should be directly useful in a Proofpoint sales conversation
- The listening dialogue must sound like a real German workplace conversation
- The reading article must be at the specified CEFR level
- The speaking scenario must set up a realistic discovery call or objection handling situation
- The writing task must mirror real outreach a BDR would send

DOMAIN KNOWLEDGE:
${cybersecurityContext}

${proofpointContext}

${competitorsContext}

${germanSalesContext}`
}

/**
 * User prompt — instructs the AI to generate a specific lesson.
 * Injects CEFR level, recent topics to avoid, and the output schema.
 */
export function buildUserPrompt(params: LessonPromptParams): string {
    const { level, recentTopics, focusTopic } = params

    const topicInstruction = focusTopic
        ? `Focus topic: **${focusTopic}**`
        : `Choose a cybersecurity topic that has NOT been covered recently. Recent topics to avoid: ${recentTopics.length > 0 ? recentTopics.join(', ') : 'none yet'
        }`

    return `Generate a complete German cybersecurity sales training lesson.

LEARNER LEVEL: ${level} (CEFR)
${topicInstruction}

LESSON REQUIREMENTS:
- Vocabulary: exactly 8 terms relevant to the chosen cybersecurity topic and Proofpoint sales context
- Listening dialogue: 150–250 words, realistic IT security conversation between two German colleagues
- Listening questions: exactly 3 comprehension questions with answers
- Speaking scenario: a Proofpoint BDR discovery call with a German IT Security Manager (Klaus Bauer, skeptical, budget-conscious, currently using Microsoft Defender)
- Reading article: 200–300 words at ${level} CEFR level, professional German, explains the core cybersecurity concept
- Reading questions: exactly 3 questions (mix of comprehension and vocabulary)
- Writing task: ask the user to write a professional German outreach email or LinkedIn message (2–4 sentences) relevant to the lesson topic

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact schema:
${JSON.stringify(LESSON_JSON_SCHEMA, null, 2)}

No explanation. No markdown. No code fences. Only the JSON object.`
}

/**
 * Convenience builder — returns both prompts together.
 */
export function buildLessonPrompts(params: LessonPromptParams): {
    systemPrompt: string
    userPrompt: string
} {
    return {
        systemPrompt: buildSystemPrompt(),
        userPrompt: buildUserPrompt(params),
    }
}

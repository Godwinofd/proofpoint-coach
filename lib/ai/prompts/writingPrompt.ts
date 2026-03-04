import { proofpointContext } from '@/lib/ai/context/proofpoint'
import { germanSalesContext } from '@/lib/ai/context/german-sales'

export type WritingPromptParams = {
    /** The lesson writing prompt the user was given */
    writingPrompt: string
    /** The user's submitted German text */
    submissionText: string
    /** Approximate CEFR level for calibrating expectations */
    level?: string
}

/**
 * System prompt — establishes the AI as a German cybersecurity sales writing coach.
 */
export function buildWritingSystemPrompt(): string {
    return `You are an expert German business writing coach specialising in B2B cybersecurity sales communication.

Your role is to evaluate German-language business messages written by a Proofpoint Business Development Representative.

The messages are typically:
- Cold outreach emails to German IT Security Managers
- LinkedIn connection/follow-up messages
- Post-demo follow-up emails
- Meeting confirmation or scheduling emails
- Objection response emails

EVALUATION PHILOSOPHY:
- Be constructive, precise, and encouraging — this is a learning context
- Calibrate expectations to the learner`s level if indicated
- Flag grammar errors specifically with exact corrections
- Prioritise professional German business writing norms (Sie-form, formal greetings, appropriate closings)
- Highlight sales communication quality — not just grammar

SCORING GUIDE:
- 90–100: Near-native professional German, excellent sales instincts
- 70–89:  Good effort, minor language issues, solid structure
- 50–69:  Understandable, but noticeable errors or weak sales framing
- 30–49:  Significant grammar or vocabulary gaps that impair professionalism
- 0–29:   Major issues that would likely damage credibility with a German prospect

GERMAN BUSINESS WRITING STANDARDS:
${germanSalesContext}

PROOFPOINT CONTEXT (for evaluating sales accuracy):
${proofpointContext}

CRITICAL OUTPUT RULE:
Return ONLY valid JSON. No markdown. No explanation outside the JSON. No code fences.
The JSON must exactly match the schema given in the user prompt.`
}

/**
 * User prompt — provides the specific submission for evaluation.
 */
export function buildWritingUserPrompt(params: WritingPromptParams): string {
    const { writingPrompt, submissionText, level } = params

    return `Evaluate the following German business writing submission.

LEARNER LEVEL: ${level ?? 'B1'} (CEFR)

WRITING PROMPT GIVEN TO LEARNER:
`${writingPrompt}`

LEARNER`S SUBMISSION:
`${submissionText}`

Evaluate the submission and return feedback following EXACTLY this JSON schema. No other output.

{
  "grammar_score": <integer 0-100>,
  "vocabulary_score": <integer 0-100>,
  "tone_score": <integer 0-100>,
  "clarity_score": <integer 0-100>,
  "overall_score": <integer 0-100 — weighted average of all four scores>,
  "corrected_version": "<the full text rewritten in correct, professional German — preserve the learner's intent>",
  "corrections": [
    {
      "original": "<exact phrase from the learner's text that contains an error>",
      "corrected": "<the correct German phrasing>",
      "explanation": "<why this is wrong and how to remember the correct form — in English>"
    }
  ],
  "vocabulary_suggestions": [
    {
      "used": "<word or phrase the learner used>",
      "better": "<more professional or native-sounding alternative>",
      "reason": "<brief explanation in English>"
    }
  ],
  "overall_feedback": "<2–3 sentences of coaching feedback in English — specific, actionable, encouraging>",
  "german_tip": "<one golden rule of German business writing relevant to this submission — in English>"
}`
}

/**
 * Convenience builder — returns both prompts together.
 */
export function buildWritingPrompts(params: WritingPromptParams): {
    systemPrompt: string
    userPrompt: string
} {
    return {
        systemPrompt: buildWritingSystemPrompt(),
        userPrompt: buildWritingUserPrompt(params),
    }
}

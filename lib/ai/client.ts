import OpenAI from 'openai'

/**
 * Initialised OpenAI SDK client.
 * SERVER-SIDE ONLY — never import this in Client Components.
 * The OPENAI_API_KEY environment variable must be set.
 */
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Default model for all completions.
 * Override per-call if a cheaper model is appropriate.
 */
export const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o'

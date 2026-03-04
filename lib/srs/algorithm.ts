/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Original algorithm by Piotr Woźniak (1987), adapted for this platform.
 *
 * RATING SCALE:
 *   0 = Complete blackout — no recall at all
 *   1 = Incorrect, but remembered on seeing the answer
 *   2 = Incorrect, but the answer seemed easy to recall
 *   3 = Correct, but with significant difficulty
 *   4 = Correct with some hesitation
 *   5 = Perfect recall — immediate and confident
 *
 * ALGORITHM RULES:
 *   - Ratings ≥ 3 are considered "passing" — the interval increases
 *   - Ratings < 3 are "failing" — the word resets to interval = 1 (review tomorrow)
 *   - ease_factor floors at 1.3 (prevents intervals collapsing to zero)
 *   - mastery_level increments on pass (up to 5), decrements on fail (floor 0)
 *   - mastery_level 5 = "mastered" (counted toward vocabulary_mastered in progress)
 */

export type SRSState = {
    mastery_level: number   // 0–5 (int)
    interval_days: number   // current review interval in days
    ease_factor: number     // difficulty multiplier, min 1.3
}

export type SRSResult = {
    new_mastery_level: number
    new_interval_days: number
    new_ease_factor: number
    next_review_date: string   // ISO date string (YYYY-MM-DD)
    is_mastered: boolean       // true when mastery_level reaches 5
    was_mastered: boolean      // true if it WAS mastered before this review
}

const MIN_EASE_FACTOR = 1.3
const MAX_MASTERY = 5
const PASSING_THRESHOLD = 3

/**
 * Calculates the next SM-2 review state for a vocabulary word.
 *
 * @param state  – current SM-2 state of the word
 * @param rating – user's recall rating (0–5)
 * @returns new SM-2 state including next_review_date
 */
export function calculateNextReview(state: SRSState, rating: number): SRSResult {
    const clampedRating = Math.max(0, Math.min(5, Math.round(rating)))
    const passed = clampedRating >= PASSING_THRESHOLD
    const wasMastered = state.mastery_level === MAX_MASTERY

    let newInterval: number
    let newEase: number
    let newMastery: number

    if (!passed) {
        // Failed recall — reset to beginning, penalise ease_factor
        newInterval = 1
        // SM-2 ease penalty formula
        newEase = Math.max(
            MIN_EASE_FACTOR,
            state.ease_factor - 0.8 + 0.28 * clampedRating - 0.02 * clampedRating * clampedRating
        )
        newMastery = Math.max(0, state.mastery_level - 1)
    } else {
        // Passed recall — increase interval
        if (state.mastery_level === 0) {
            newInterval = 1  // First correct review: tomorrow
        } else if (state.mastery_level === 1) {
            newInterval = 6  // Second correct: 6 days
        } else {
            // Subsequent reviews: multiply by ease factor
            newInterval = Math.round(state.interval_days * state.ease_factor)
        }

        // SM-2 ease factor update formula
        newEase = Math.max(
            MIN_EASE_FACTOR,
            state.ease_factor + 0.1 - (5 - clampedRating) * (0.08 + (5 - clampedRating) * 0.02)
        )
        newMastery = Math.min(MAX_MASTERY, state.mastery_level + 1)
    }

    const nextDate = addDays(new Date(), newInterval)

    return {
        new_mastery_level: newMastery,
        new_interval_days: newInterval,
        new_ease_factor: parseFloat(newEase.toFixed(2)),
        next_review_date: toISODate(nextDate),
        is_mastered: newMastery === MAX_MASTERY,
        was_mastered: wasMastered,
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
}

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0]
}

/**
 * Returns a human-readable description of a rating, useful for the UI.
 */
export function ratingLabel(rating: number): string {
    const labels: Record<number, string> = {
        0: 'Keine Ahnung',      // No idea
        1: 'Falsch',            // Wrong
        2: 'Fast richtig',      // Almost right
        3: 'Schwierig',         // Hard
        4: 'Gut',               // Good
        5: 'Perfekt',           // Perfect
    }
    return labels[rating] ?? String(rating)
}

/**
 * Returns the colour class for a rating button (Tailwind).
 */
export function ratingColor(rating: number): string {
    if (rating <= 1) return 'bg-red-600 hover:bg-red-500'
    if (rating <= 2) return 'bg-orange-500 hover:bg-orange-400'
    if (rating === 3) return 'bg-yellow-500 hover:bg-yellow-400'
    if (rating === 4) return 'bg-green-600 hover:bg-green-500'
    return 'bg-emerald-500 hover:bg-emerald-400'
}

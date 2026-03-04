'use client'

import { useState, useCallback } from 'react'
import FlashCard, { type FlashCardWord } from './FlashCard'
import { ratingLabel, ratingColor } from '@/lib/srs/algorithm'
import {
    CheckCircle,
    BookOpen,
    Trophy,
    ChevronRight,
    X,
} from 'lucide-react'

type ReviewResult = {
    word_id: string
    rating: number
    next_review_date: string
    is_mastered: boolean
}

type SRSReviewSessionProps = {
    /** Words due for review, ordered by review date / mastery ascending */
    words: FlashCardWord[]
    /** Called when the session ends with an array of all review results */
    onComplete?: (results: ReviewResult[]) => void
    /** Called when the user wants to exit mid-session */
    onExit?: () => void
}

type SessionPhase = 'card' | 'rating' | 'complete'

/**
 * SRSReviewSession - the full spaced repetition review flow.
 *
 * Flow per card:
 *   1. Show flashcard (front) → user thinks
 *   2. User taps card → back reveals (translation + example)
 *   3. Six rating buttons appear (0–5)
 *   4. User rates → POST /api/vocabulary/review
 *   5. Advance to next card
 *   6. After last card → session summary screen
 */
export default function SRSReviewSession({
    words,
    onComplete,
    onExit,
}: SRSReviewSessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [phase, setPhase] = useState<SessionPhase>('card')
    const [results, setResults] = useState<ReviewResult[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [masteredThisSession, setMasteredThisSession] = useState(0)

    const currentWord = words[currentIndex]
    const totalWords = words.length
    const progress = Math.round((currentIndex / totalWords) * 100)

    const handleReveal = useCallback(() => {
        setPhase('rating')
    }, [])

    async function handleRate(rating: number) {
        if (submitting || !currentWord) return
        setSubmitting(true)

        try {
            const res = await fetch('/api/vocabulary/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word_id: currentWord.id, rating }),
            })

            const data = await res.json()
            const srsResult = data?.srs_result

            const result: ReviewResult = {
                word_id: currentWord.id,
                rating,
                next_review_date: srsResult?.next_review_date ?? '',
                is_mastered: srsResult?.is_mastered ?? false,
            }

            const updatedResults = [...results, result]
            setResults(updatedResults)

            if (result.is_mastered && !words[currentIndex].mastery_level) {
                setMasteredThisSession((n) => n + 1)
            }
            if (srsResult?.is_mastered && !srsResult?.was_mastered) {
                setMasteredThisSession((n) => n + 1)
            }

            // Advance
            if (currentIndex + 1 >= totalWords) {
                setPhase('complete')
                onComplete?.(updatedResults)
            } else {
                setCurrentIndex((i) => i + 1)
                setPhase('card')
            }
        } catch (err) {
            console.error('Review submission failed', err)
        } finally {
            setSubmitting(false)
        }
    }

    // ── Session complete screen ───────────────────────────────────────────────
    if (phase === 'complete' || currentIndex >= totalWords) {
        const avgRating =
            results.length > 0
                ? (results.reduce((sum, r) => sum + r.rating, 0) / results.length).toFixed(1)
                : '—'
        const passedCount = results.filter((r) => r.rating >= 3).length

        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-950">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Sitzung abgeschlossen!
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Sie haben alle {totalWords} Vokabeln für heute wiederholt.
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    {[
                        { label: 'Vokabeln', value: totalWords },
                        { label: 'Richtig (≥3)', value: passedCount },
                        { label: 'Ø Bewertung', value: avgRating },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-2xl font-bold text-white">{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {masteredThisSession > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm px-4 py-3 rounded-xl">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {masteredThisSession} Wort{masteredThisSession !== 1 ? 'er' : ''} gemeistert!
                    </div>
                )}

                <button
                    onClick={onExit}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
                >
                    Fertig
                </button>
            </div>
        )
    }

    // ── Active review card ────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Progress bar + counter */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white font-medium">
                            {currentIndex + 1} / {totalWords}
                        </span>
                    </div>
                    <button
                        onClick={onExit}
                        className="text-gray-500 hover:text-gray-300 transition"
                        title="Sitzung beenden"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Flash card */}
            <FlashCard word={currentWord} onReveal={handleReveal} />

            {/* Rating buttons — only shown after card is flipped */}
            {phase === 'rating' && (
                <div className="space-y-3">
                    <p className="text-center text-sm text-gray-400">
                        Wie gut haben Sie sich erinnert?
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => handleRate(rating)}
                                disabled={submitting}
                                className={`flex flex-col items-center justify-center py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-60 disabled:cursor-not-allowed ${ratingColor(rating)}`}
                            >
                                <span className="text-lg leading-none">{rating}</span>
                                <span className="text-[10px] mt-1 opacity-75 leading-tight text-center">
                                    {ratingLabel(rating)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Skip — advance without submitting a rating */}
                    <button
                        onClick={() => {
                            if (currentIndex + 1 >= totalWords) {
                                setPhase('complete')
                            } else {
                                setCurrentIndex((i) => i + 1)
                                setPhase('card')
                            }
                        }}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 mx-auto transition"
                    >
                        Überspringen
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    )
}

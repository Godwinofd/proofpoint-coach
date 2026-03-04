'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

export type FlashCardWord = {
    id: string
    word_de: string
    word_en: string
    example_sentence: string | null
    topic: string | null
    mastery_level: number
}

type FlashCardProps = {
    word: FlashCardWord
    /** Called by parent when the user is ready to rate (after reveal) */
    onReveal?: () => void
}

/**
 * FlashCard component.
 *
 * Front: German word + topic badge
 * Back:  English translation + example sentence
 *
 * Uses CSS 3D flip animation (transform-style: preserve-3d).
 * No Tailwind 3D utilities exist by default — uses inline styles for the
 * backface-visibility and rotateY transforms.
 */
export default function FlashCard({ word, onReveal }: FlashCardProps) {
    const [flipped, setFlipped] = useState(false)

    function handleFlip() {
        if (!flipped) {
            setFlipped(true)
            onReveal?.()
        }
    }

    const masteryColors = [
        'bg-gray-700 text-gray-300',     // 0 - unseen
        'bg-red-900 text-red-300',       // 1 - very weak
        'bg-orange-900 text-orange-300', // 2 - weak
        'bg-yellow-900 text-yellow-300', // 3 - building
        'bg-blue-900 text-blue-300',     // 4 - strong
        'bg-emerald-900 text-emerald-300', // 5 - mastered
    ]

    const masteryLabels = ['Neu', 'Schwach', 'Gering', 'Mittelmäßig', 'Stark', 'Gemeistert']

    return (
        <div className="relative w-full" style={{ perspective: '1200px' }}>
            {/* Flip container */}
            <div
                className="relative w-full transition-transform duration-500 cursor-pointer"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: '260px',
                }}
                onClick={handleFlip}
            >
                {/* ── FRONT ─────────────────────────────────────────────────────── */}
                <div
                    className="absolute inset-0 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 select-none"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Mastery badge */}
                    <div className="absolute top-4 right-4">
                        <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${masteryColors[word.mastery_level] ?? masteryColors[0]
                                }`}
                        >
                            {masteryLabels[word.mastery_level] ?? 'Unbekannt'}
                        </span>
                    </div>

                    {/* Topic */}
                    {word.topic && (
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-4">
                            {word.topic}
                        </p>
                    )}

                    {/* German word */}
                    <h2 className="text-4xl font-bold text-white text-center leading-tight mb-3">
                        {word.word_de}
                    </h2>

                    {/* Tap hint */}
                    <p className="text-sm text-gray-500 mt-6 animate-pulse">
                        Tippen um zu enthüllen
                    </p>
                </div>

                {/* ── BACK ──────────────────────────────────────────────────────── */}
                <div
                    className="absolute inset-0 bg-gray-900 border border-blue-800 rounded-2xl flex flex-col items-center justify-center p-8 select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    {/* English translation */}
                    <p className="text-sm text-blue-400 uppercase tracking-wider mb-2">
                        Übersetzung
                    </p>
                    <h2 className="text-3xl font-bold text-white text-center mb-6">
                        {word.word_en}
                    </h2>

                    {/* Example sentence */}
                    {word.example_sentence && (
                        <div className="w-full bg-gray-800 rounded-xl p-4 mt-2">
                            <p className="text-xs text-gray-500 mb-1.5">Beispielsatz:</p>
                            <p className="text-sm text-gray-300 leading-relaxed italic">
                                &ldquo;{word.example_sentence}&rdquo;
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reset button (only shown when flipped) */}
            {flipped && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setFlipped(false)
                    }}
                    className="absolute top-4 left-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition"
                >
                    <RotateCcw className="w-3 h-3" />
                    Zurück
                </button>
            )}
        </div>
    )
}

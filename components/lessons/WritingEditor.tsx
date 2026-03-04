'use client'

import { useState } from 'react'
import {
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Pen,
    Sparkles,
} from 'lucide-react'

type Correction = {
    original: string
    corrected: string
    explanation: string
}

type VocabSuggestion = {
    used: string
    better: string
    reason: string
}

type FeedbackPayload = {
    grammar_score: number
    vocabulary_score: number
    tone_score: number
    clarity_score: number
    overall_score?: number
    corrected_version: string
    corrections: Correction[]
    vocabulary_suggestions?: VocabSuggestion[]
    overall_feedback: string
    german_tip?: string
}

type WritingEditorProps = {
    /** The writing task shown to the user */
    writingPrompt: string
    /** Optional example answer to show as reference */
    exampleAnswer?: string
    /** Optional lesson ID to link the submission */
    lessonId?: string
    /** Called after submission is stored (before feedback is generated) */
    onSubmit?: (submissionId: string) => void
}

type EditorPhase = 'writing' | 'submitting' | 'fetching_feedback' | 'feedback'

function ScoreBadge({ score, label }: { score: number; label: string }) {
    const color =
        score >= 80
            ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
            : score >= 60
                ? 'text-blue-400 bg-blue-950 border-blue-800'
                : score >= 40
                    ? 'text-yellow-400 bg-yellow-950 border-yellow-800'
                    : 'text-red-400 bg-red-950 border-red-800'

    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${color}`}>
            <span className="text-2xl font-bold leading-none">{score}</span>
            <span className="text-[11px] mt-1 opacity-75">{label}</span>
        </div>
    )
}

export default function WritingEditor({
    writingPrompt,
    exampleAnswer,
    lessonId,
}: WritingEditorProps) {
    const [text, setText] = useState('')
    const [phase, setPhase] = useState<EditorPhase>('writing')
    const [submissionId, setSubmissionId] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<FeedbackPayload | null>(null)
    const [correctedText, setCorrectedText] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showExample, setShowExample] = useState(false)
    const [showCorrections, setShowCorrections] = useState(true)
    const [showCorrected, setShowCorrected] = useState(false)

    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    const minWords = 20

    // ── Step 1: submit the text ───────────────────────────────────────────────
    async function handleSubmit() {
        if (text.trim().length === 0 || wordCount < minWords) return
        setError(null)
        setPhase('submitting')

        try {
            const res = await fetch('/api/writing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: writingPrompt,
                    submission_text: text.trim(),
                    ...(lessonId ? { lesson_id: lessonId } : {}),
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Submission failed')

            const id = data.submission?.id
            setSubmissionId(id)

            // Immediately request feedback
            await fetchFeedback(id)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setPhase('writing')
        }
    }

    // ── Step 2: get AI feedback ───────────────────────────────────────────────
    async function fetchFeedback(id: string) {
        setPhase('fetching_feedback')

        try {
            const res = await fetch(`/api/writing/${id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Feedback generation failed')

            setFeedback(data.feedback as FeedbackPayload)
            setCorrectedText(data.corrected_text ?? null)
            setPhase('feedback')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Feedback failed')
            setPhase('writing')
        }
    }

    // ── Writing phase ─────────────────────────────────────────────────────────
    if (phase === 'writing' || phase === 'submitting') {
        return (
            <div className="space-y-5">
                {/* Prompt */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Pen className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Schreibaufgabe</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{writingPrompt}</p>
                </div>

                {/* Example toggle */}
                {exampleAnswer && (
                    <button
                        onClick={() => setShowExample((v) => !v)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Beispielantwort {showExample ? 'ausblenden' : 'anzeigen'}
                        {showExample ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                )}

                {showExample && exampleAnswer && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-2">Beispiel:</p>
                        <p className="text-sm text-gray-300 italic leading-relaxed">{exampleAnswer}</p>
                    </div>
                )}

                {/* Textarea */}
                <div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={phase === 'submitting'}
                        placeholder="Schreiben Sie Ihre Antwort auf Deutsch…"
                        rows={8}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition disabled:opacity-60"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span
                            className={`text-xs ${wordCount < minWords ? 'text-gray-600' : 'text-gray-500'
                                }`}
                        >
                            {wordCount} Wörter
                            {wordCount < minWords && ` (mind. ${minWords})`}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-2 bg-red-950 border border-red-900 text-red-300 text-sm px-4 py-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={phase === 'submitting' || wordCount < minWords}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
                >
                    {phase === 'submitting' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Wird eingereicht…
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Einreichen und KI-Feedback erhalten
                        </>
                    )}
                </button>
            </div>
        )
    }

    // ── Loading feedback ──────────────────────────────────────────────────────
    if (phase === 'fetching_feedback') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[280px] space-y-4 text-center">
                <div className="relative">
                    <Sparkles className="w-10 h-10 text-blue-400 animate-pulse" />
                </div>
                <div>
                    <p className="text-white font-semibold">KI analysiert Ihre Antwort…</p>
                    <p className="text-gray-500 text-sm mt-1">Das dauert 5–10 Sekunden.</p>
                </div>
            </div>
        )
    }

    // ── Feedback display ──────────────────────────────────────────────────────
    if (phase === 'feedback' && feedback) {
        const scores = [
            { key: 'grammar_score', label: 'Grammatik' },
            { key: 'vocabulary_score', label: 'Vokabular' },
            { key: 'tone_score', label: 'Ton' },
            { key: 'clarity_score', label: 'Klarheit' },
        ] as const

        const overall =
            feedback.overall_score ??
            Math.round(
                (feedback.grammar_score +
                    feedback.vocabulary_score +
                    feedback.tone_score +
                    feedback.clarity_score) /
                4
            )

        return (
            <div className="space-y-6">
                {/* Success banner */}
                <div className="flex items-center gap-2 bg-green-950 border border-green-800 text-green-300 text-sm px-4 py-3 rounded-xl">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    KI-Feedback erhalten
                </div>

                {/* Overall score */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">Gesamtbewertung</p>
                        <p className="text-4xl font-bold text-white mt-1">{overall}<span className="text-lg text-gray-500">/100</span></p>
                    </div>
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{
                            background: `conic-gradient(${overall >= 70 ? '#059669' : overall >= 50 ? '#2563eb' : '#dc2626'
                                } ${overall * 3.6}deg, #1f2937 0deg)`,
                        }}
                    >
                        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{overall}</span>
                        </div>
                    </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-4 gap-3">
                    {scores.map(({ key, label }) => (
                        <ScoreBadge key={key} score={feedback[key]} label={label} />
                    ))}
                </div>

                {/* Overall feedback */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Gesamtfeedback</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{feedback.overall_feedback}</p>
                    {feedback.german_tip && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                            <p className="text-xs text-yellow-400 font-medium mb-1">💡 Tipp:</p>
                            <p className="text-gray-400 text-xs leading-relaxed">{feedback.german_tip}</p>
                        </div>
                    )}
                </div>

                {/* Corrections */}
                {feedback.corrections.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowCorrections((v) => !v)}
                            className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-800 transition"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-semibold text-white">
                                    Korrekturen ({feedback.corrections.length})
                                </span>
                            </div>
                            {showCorrections ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                        </button>

                        {showCorrections && (
                            <div className="divide-y divide-gray-800">
                                {feedback.corrections.map((c, i) => (
                                    <div key={i} className="px-5 py-4 space-y-2">
                                        <div className="flex items-start gap-3 flex-wrap">
                                            <span className="text-sm text-red-400 line-through shrink-0">
                                                {c.original}
                                            </span>
                                            <span className="text-gray-600 text-sm">→</span>
                                            <span className="text-sm text-emerald-400 shrink-0">{c.corrected}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">{c.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Corrected version */}
                {correctedText && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowCorrected((v) => !v)}
                            className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-800 transition"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-semibold text-white">Korrigierte Version</span>
                            </div>
                            {showCorrected ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                        {showCorrected && (
                            <div className="px-5 pb-5">
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {correctedText}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Try again */}
                <button
                    onClick={() => {
                        setText('')
                        setPhase('writing')
                        setFeedback(null)
                        setCorrectedText(null)
                        setSubmissionId(null)
                        setError(null)
                    }}
                    className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium rounded-xl transition text-sm"
                >
                    Neu schreiben
                </button>
            </div>
        )
    }

    return null
}

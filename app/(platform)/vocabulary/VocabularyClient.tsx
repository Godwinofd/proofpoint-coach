'use client'

import { useState } from 'react'
import SRSReviewSession from '@/components/vocabulary/SRSReviewSession'
import { BookOpen, Calendar, CheckCircle, GraduationCap, Play } from 'lucide-react'
import type { Database } from '@/types/database'
import { FlashCardWord } from '@/components/vocabulary/FlashCard'

type VocabRow = Database['public']['Tables']['vocabulary']['Row']

export default function VocabularyClient({ initialWords }: { initialWords: VocabRow[] }) {
    const [words, setWords] = useState<VocabRow[]>(initialWords)
    const [isReviewing, setIsReviewing] = useState(false)

    // Calculate due words
    const today = new Date().toISOString().split('T')[0]
    const dueWords = words.filter(w => w.next_review_date && w.next_review_date <= today)
    const formatWordsForFlashcard = (rows: VocabRow[]): FlashCardWord[] => {
        return rows.map(r => ({
            id: r.id,
            word_de: r.word_de,
            word_en: r.word_en,
            example_sentence: r.example_sentence ?? null,
            topic: r.topic ?? null,
            mastery_level: r.mastery_level
        }))
    }

    const handleReviewComplete = () => {
        setIsReviewing(false)
        // Refresh page to get updated stats, or we could mutate state locally.
        window.location.reload()
    }

    if (isReviewing && dueWords.length > 0) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <SRSReviewSession
                    words={formatWordsForFlashcard(dueWords)}
                    onComplete={handleReviewComplete}
                    onExit={() => setIsReviewing(false)}
                />
            </div>
        )
    }

    const masteredCount = words.filter(w => w.mastery_level >= 4).length

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Vokabeln</h1>
                    </div>
                    <p className="text-gray-400 text-sm max-w-2xl">
                        Ihr Cybersecurity-Wortschatz. Wörter werden basierend auf der Spaced Repetition (SRS) Methode wiederholt.
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="bg-blue-900/30 p-3 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Gesamte Vokabeln</p>
                        <p className="text-2xl font-bold text-white">{words.length}</p>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="bg-emerald-900/30 p-3 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Gemeistert</p>
                        <p className="text-2xl font-bold text-white">{masteredCount}</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-800 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-900/50 p-3 rounded-lg">
                            <Calendar className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-indigo-200">Heute fällig</p>
                            <p className="text-2xl font-bold text-white">{dueWords.length}</p>
                        </div>
                    </div>
                    {dueWords.length > 0 && (
                        <button
                            onClick={() => setIsReviewing(true)}
                            className="w-10 h-10 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center transition shadow-lg shrink-0"
                        >
                            <Play className="w-5 h-5 text-white ml-1" />
                        </button>
                    )}
                </div>
            </div>

            {/* Vocabulary List */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                    <h2 className="text-lg font-bold text-white">Alle Vokabeln</h2>
                </div>

                {words.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Keine Vokabeln gefunden. Generieren Sie eine Lektion, um Vokabeln hinzuzufügen.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800/50">
                        {words.map(w => (
                            <div key={w.id} className="p-4 sm:px-6 hover:bg-gray-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-white">{w.word_de}</p>
                                        {w.mastery_level >= 4 && (
                                            <span title="Gemeistert"><CheckCircle className="w-4 h-4 text-emerald-400" /></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">{w.word_en}</p>
                                    {w.example_sentence && (
                                        <p className="text-xs text-gray-500 italic mt-1.5 ml-2 border-l-2 border-gray-700 pl-2">
                                            {w.example_sentence}
                                        </p>
                                    )}
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-xs shrink-0">
                                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                                        Niveau: {w.mastery_level}/5
                                    </span>
                                    <span className={`px-2 py-1 rounded ${w.next_review_date && w.next_review_date <= today
                                            ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800'
                                            : 'text-gray-500'
                                        }`}>
                                        Nächste: {w.next_review_date ? new Date(w.next_review_date).toLocaleDateString('de-DE') : 'Ausstehend'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Award, BookOpen, CheckCircle, Flame, MessageCircle, Target, TrendingUp, Trophy } from 'lucide-react'

export const metadata = {
    title: 'Fortschritt | Proofpoint Trainer',
}

export default async function ProgressPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch progress stats
    const { data: progress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch user profile for CEFR level
    const { data: profile } = await supabase
        .from('profiles')
        .select('cefr_level, full_name')
        .eq('id', user.id)
        .single()

    const stats = progress || {
        streak_days: 0,
        longest_streak: 0,
        lessons_completed: 0,
        vocabulary_words_mastered: 0,
        vocabulary_words_total: 0,
        roleplay_sessions_completed: 0,
        total_xp: 0
    }

    const cefrLevel = (profile as any)?.cefr_level || 'B1'
    const name = (profile as any)?.full_name?.split(' ')[0] || 'Dort`
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h1 className="text-2xl font-bold text-white">Mein Fortschritt</h1>
            </div>

            <p className="text-gray-400 text-sm max-w-2xl">
                Verfolgen Sie Ihre Lernfortschritte und Verkaufsfähigkeiten auf dem Weg zum {cefrLevel} Niveau.
            </p>

            {/* Profile & XP Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-indigo-950 flex items-center justify-center border-4 border-indigo-500/30">
                        <Trophy className="w-10 h-10 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Level {Math.floor(stats.total_xp / 1000) + 1}</h2>
                        <p className="text-indigo-200">
                            {stats.total_xp} / {(Math.floor(stats.total_xp / 1000) + 1) * 1000} XP bis zum nächsten Level
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-64 bg-indigo-950/50 rounded-full h-3 overflow-hidden border border-indigo-800">
                    <div
                        className="bg-gradient-to-r from-blue-400 to-indigo-400 h-full rounded-full`
                        style={{ width: `${(stats.total_xp % 1000) / 10}%` }}
                    />
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className=`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Streak */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="bg-orange-950/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.streak_days} <span className="text-lg text-gray-500 font-normal">Tage</span></p>
                    <p className="text-sm text-gray-400">Aktueller Streak</p>
                    <p className="text-xs text-orange-500/70 mt-2 font-medium">Rekord: {stats.longest_streak} Tage</p>
                </div>

                {/* Lessons */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="bg-blue-950/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.lessons_completed}</p>
                    <p className="text-sm text-gray-400">Absolvierte Lektionen</p>
                </div>

                {/* Vocabulary */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="bg-emerald-950/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                        <Target className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">
                        {stats.vocabulary_words_mastered} <span className="text-lg text-gray-500 font-normal">/ {stats.vocabulary_words_total || 0}</span>
                    </p>
                    <p className="text-sm text-gray-400">Gemeisterte Vokabeln</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
                        <div
                            className="bg-emerald-500 h-1.5 rounded-full`
                            style={{ width: `${stats.vocabulary_words_total ? (stats.vocabulary_words_mastered / stats.vocabulary_words_total) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                {/* Roleplay */}
                <div className=`bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="bg-green-950/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                        <MessageCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.roleplay_sessions_completed}</p>
                    <p className="text-sm text-gray-400">Meisterhafte Pitches</p>
                </div>
            </div>

            {/* CEFR Level Goal */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Sprachniveau Ziel: {cefrLevel}
                </h3>

                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -translate-y-1/2 rounded-full z-0" />

                    <div className="relative z-10 flex justify-between">
                        {[`A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl, i) => {
                            // Find the index of the user's level. Assuming A1=0, C2=5.
                            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2`]
                            const targetIdx = levels.indexOf(cefrLevel)

                            const isPast = i < targetIdx
                            const isCurrent = i === targetIdx
                            const isFuture = i > targetIdx

                            return (
                                <div key={lvl} className="flex flex-col items-center gap-2`>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                        isPast ? 'bg-indigo-600 text-white' :
                                        isCurrent ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30' :
                                        'bg-gray-800 text-gray-500 border-2 border-gray-700'
                                    }`}>
                                        {isPast ? <CheckCircle className=`w-4 h-4` /> : lvl}
                                    </div>
                                    <span className={`text-xs font-medium ${isCurrent ? `text-indigo-400' : 'text-gray-500'}`}>
                                        {lvl}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <p className=`text-sm text-gray-400 text-center mt-8 max-w-lg mx-auto leading-relaxed">
                    Ihr Ziel ist das C1/C2 Niveau für verhandlungssicheres Geschäftsdeutsch im DACH-Raum.
                    Absolvieren Sie mehr Rollenspiele und vertiefen Sie Ihren Proofpoint-Wortschatz, um aufzusteigen.
                </p>
            </div >
        </div >
    )
}

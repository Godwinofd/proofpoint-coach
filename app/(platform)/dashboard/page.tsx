import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
    Flame,
    BookOpen,
    Library,
    MessageSquare,
    ArrowRight,
    Trophy,
} from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Progress = Database['public']['Tables']['progress']['Row']
type Analytics = Database['public']['Tables']['analytics']['Row']
type Lesson = Pick<Database['public']['Tables']['lessons']['Row'], 'id' | 'title' | 'topic' | 'status' | 'scheduled_date'>
type RoleplaySession = Pick<Database['public']['Tables']['roleplay_sessions']['Row'], 'id' | 'scenario' | 'status' | 'created_at'>

export const metadata = {
    title: 'Dashboard | Proofpoint Trainer',
}

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch progress and analytics in parallel
    const [progressResult, analyticsResult, lessonsResult, roleplayResult] =
        await Promise.all([
            supabase.from('progress').select('*').eq('user_id', user.id).single(),
            supabase.from('analytics').select('*').eq('user_id', user.id).single(),
            supabase
                .from('lessons')
                .select('id, title, topic, status, scheduled_date')
                .eq('user_id', user.id)
                .order('scheduled_date', { ascending: false })
                .limit(3),
            supabase
                .from('roleplay_sessions')
                .select('id, scenario, status, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3),
        ])

    const progress = progressResult.data as Progress | null
    const analytics = analyticsResult.data as Analytics | null
    const recentLessons = (lessonsResult.data ?? []) as Lesson[]
    const recentRoleplay = (roleplayResult.data ?? []) as RoleplaySession[]

    const displayName = user.user_metadata?.full_name?.split(' ')[0] ?? 'Trainer'

    const statCards = [
        {
            label: 'Lern-Streak',
            value: progress?.current_streak ?? 0,
            unit: 'Tage',
            icon: Flame,
            color: 'text-orange-400',
            bg: 'bg-orange-950',
        },
        {
            label: 'Lektionen',
            value: progress?.lessons_completed ?? 0,
            unit: 'abgeschlossen',
            icon: BookOpen,
            color: 'text-blue-400',
            bg: 'bg-blue-950',
        },
        {
            label: 'Vokabeln',
            value: progress?.vocabulary_mastered ?? 0,
            unit: 'gemeistert',
            icon: Library,
            color: 'text-purple-400',
            bg: 'bg-purple-950',
        },
        {
            label: 'Rollenspiele',
            value: progress?.roleplay_sessions_completed ?? 0,
            unit: 'Sitzungen',
            icon: MessageSquare,
            color: 'text-green-400',
            bg: 'bg-green-950',
        },
    ]

    const scenarioLabels: Record<string, string> = {
        discovery_call: 'Discovery Call',
        objection_handling: 'Einwandbehandlung',
        demo_follow_up: 'Demo Follow-up',
        needs_analysis: 'Bedarfsanalyse',
        closing: 'Abschluss',
    }

    const statusLabels: Record<string, string> = {
        not_started: 'Nicht begonnen',
        in_progress: 'In Bearbeitung',
        completed: 'Abgeschlossen',
    }

    const statusColors: Record<string, string> = {
        not_started: 'text-gray-400 bg-gray-800',
        in_progress: 'text-yellow-400 bg-yellow-950',
        completed: 'text-green-400 bg-green-950',
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Guten Tag, {displayName} 👋
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Ihr tägliches Cybersecurity-Verkaufstraining wartet auf Sie.
                    </p>
                </div>
                <Link
                    href="/lessons"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition"
                >
                    Heutige Lektion
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, unit, icon: Icon, color, bg }) => (
                    <div
                        key={label}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                    >
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} mb-4`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <p className="text-3xl font-bold text-white">{value}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{unit}</p>
                    </div>
                ))}
            </div>

            {/* Mastery score */}
            {progress?.vocabulary_mastery_score != null && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <h2 className="text-sm font-semibold text-white">Vokabel-Beherrschung</h2>
                        </div>
                        <span className="text-sm font-bold text-yellow-400">
                            {Number(progress.vocabulary_mastery_score).toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
                            style={{ width: `${progress.vocabulary_mastery_score}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {progress.vocabulary_mastered} von {progress.vocabulary_words_total} Wörtern gemeistert
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent lessons */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            Letzte Lektionen
                        </h2>
                        <Link href="/lessons" className="text-xs text-blue-400 hover:text-blue-300 transition">
                            Alle anzeigen →
                        </Link>
                    </div>

                    {recentLessons.length > 0 ? (
                        <div className="space-y-3">
                            {recentLessons.map((lesson) => (
                                <Link
                                    key={lesson.id}
                                    href={`/lessons/${lesson.id}`}
                                    className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 rounded-lg transition group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition">
                                            {lesson.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{lesson.topic}</p>
                                    </div>
                                    <span
                                        className={`ml-3 flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${statusColors[lesson.status] ?? 'text-gray-400 bg-gray-800'
                                            }`}
                                    >
                                        {statusLabels[lesson.status] ?? lesson.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">Noch keine Lektionen.</p>
                            <Link
                                href="/lessons"
                                className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300 transition"
                            >
                                Erste Lektion starten →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent roleplay sessions */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-400" />
                            Letzte Rollenspiele
                        </h2>
                        <Link href="/roleplay" className="text-xs text-blue-400 hover:text-blue-300 transition">
                            Alle anzeigen →
                        </Link>
                    </div>

                    {recentRoleplay.length > 0 ? (
                        <div className="space-y-3">
                            {recentRoleplay.map((session) => (
                                <Link
                                    key={session.id}
                                    href={`/roleplay/${session.id}`}
                                    className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 rounded-lg transition group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate group-hover:text-green-300 transition">
                                            {scenarioLabels[session.scenario] ?? session.scenario}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(session.created_at).toLocaleDateString('de-DE', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <span
                                        className={`ml-3 flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${session.status === 'completed'
                                            ? 'text-green-400 bg-green-950'
                                            : session.status === 'active'
                                                ? 'text-yellow-400 bg-yellow-950'
                                                : 'text-gray-400 bg-gray-800'
                                            }`}
                                    >
                                        {session.status === 'completed'
                                            ? 'Fertig'
                                            : session.status === 'active'
                                                ? 'Aktiv'
                                                : 'Abgebrochen'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">Noch keine Rollenspiele.</p>
                            <Link
                                href="/roleplay"
                                className="mt-3 inline-block text-sm text-green-400 hover:text-green-300 transition"
                            >
                                Erste Sitzung starten →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Vocabulary review nudge */}
            {(analytics?.vocabulary_total ?? 0) > 0 && (
                <div className="bg-gradient-to-r from-purple-950 to-blue-950 border border-purple-800 rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Vokabel-Wiederholung fällig</h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Wiederholen Sie Ihre Vokabeln mit dem Lernkartensystem.
                        </p>
                    </div>
                    <Link
                        href="/vocabulary/review"
                        className="flex-shrink-0 ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition"
                    >
                        Jetzt üben
                    </Link>
                </div>
            )}
        </div>
    )
}

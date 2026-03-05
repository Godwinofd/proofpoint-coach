import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Activity, BarChart, FileText, PieChart, Star, TrendingUp } from 'lucide-react'
import type { Database } from '@/types/database'

export const metadata = {
    title: 'Analytics | Proofpoint Trainer',
}

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch vocabulary mastery
    const { data: vocab } = await supabase
        .from('vocabulary')
        .select('mastery_level')
        .eq('user_id', user.id)

    // Fetch Roleplay Evaluations
    const { data: sessions } = await supabase
        .from('roleplay_sessions')
        .select('evaluation, created_at, scenario')
        .eq('user_id', user.id)
        .not('evaluation', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

    const mastered = (vocab as any[])?.filter((v: any) => v.mastery_level >= 4).length || 0
    const familiar = (vocab as any[])?.filter((v: any) => v.mastery_level >= 2 && v.mastery_level < 4).length || 0
    const newWords = (vocab as any[])?.filter((v: any) => v.mastery_level < 2).length || 0

    const recentEvals = ((sessions as any[]) || []).map((s: any) => {
        const evalData = s.evaluation as any
        return {
            date: new Date(s.created_at).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
            scenario: s.scenario,
            score: evalData?.overall_score?.score || 0
        }
    })

    const avgScore = recentEvals.length > 0
        ? (recentEvals.reduce((acc, e) => acc + e.score, 0) / recentEvals.length).toFixed(1)
        : '0.0'

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-2">
                <BarChart className="w-5 h-5 text-fuchsia-400" />
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
            </div>

            <p className="text-gray-400 text-sm max-w-2xl">
                Ihre detaillierte Leistungsanalyse. Sehen Sie, wo Ihre Stärken liegen und in welchen Bereichen Sie sich verbessern können.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Rollenspiel-Leistung */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Rollenspiel Leistung
                        </h2>
                        <div className="bg-blue-950/50 text-blue-400 font-bold text-xl px-4 py-1.5 rounded-lg border border-blue-900 border-b-2">
                            Ø {avgScore}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {recentEvals.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">Noch keine Auswertungen verfügbar.</p>
                        ) : (
                            recentEvals.map((ev, i) => (
                                <div key={i} className="flex items-center gap-4 bg-gray-950 p-3 rounded-xl border border-gray-800">
                                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex flex-col items-center justify-center shrink-0 border border-gray-800">
                                        <span className="text-xs text-gray-500 font-medium">{ev.date.split(' ')[0]}</span>
                                        <span className="text-xs text-gray-500">{ev.date.split(' ')[1]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-white capitalize">{ev.scenario.replace('_', ' ')}</h3>
                                        {/* Progress bar */}
                                        <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2">
                                            <div
                                                className={`h-full rounded-full ${ev.score >= 8 ? 'bg-green-500' : ev.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${(ev.score / 10) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-white shrink-0 w-10 text-right">
                                        {ev.score}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Vokabel-Mastery */}
                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-emerald-400" />
                            Wortschatz Verteilung
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium text-gray-300">Gemeistert (Level 4-5)</span>
                                </div>
                                <span className="text-white font-bold">{mastered}</span>
                            </div>

                            <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium text-gray-300">Bekannt (Level 2-3)</span>
                                </div>
                                <span className="text-white font-bold">{familiar}</span>
                            </div>

                            <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <span className="text-sm font-medium text-gray-300">Neu / Lernen (Level 0-1)</span>
                                </div>
                                <span className="text-white font-bold">{newWords}</span>
                            </div>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-800 rounded-2xl p-6 text-white shadow-lg">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            KI Empfehlung
                        </h2>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            {recentEvals.length > 0 && avgScore >= '7.0'
                                ? "Starke Rollenspiel-Ergebnisse! Ihr Verkaufsgespräch auf Deutsch ist sehr flüssig. Vertiefen Sie nun spezifische Fachvokabeln im Bereich Cloud Security."
                                : recentEvals.length > 0
                                    ? "Ihre Einwandbehandlung könnte noch natürlicher wirken. Formulieren Sie Antworten auf Deutsch vorher schriftlich in der Schreibübung, bevor Sie ins Rollenspiel gehen."
                                    : "Absolvieren Sie Ihr erstes Rollenspiel, um personalisierte KI-Empfehlungen für Ihre Verkaufsstrategie zu erhalten."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

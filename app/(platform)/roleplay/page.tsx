'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Play, CheckCircle, Clock, Search, ShieldAlert, Target, XCircle } from 'lucide-react'
import type { Database } from '@/types/database'

type SessionRow = Database['public']['Tables']['roleplay_sessions']['Row']
type Scenario = SessionRow['scenario']

const SCENARIOS: { id: Scenario; title: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'discovery_call', title: 'Discovery Call', desc: 'Erster Kontakt. Qualifizieren Sie den Kunden.', icon: <Search className="w-5 h-5" /> },
    { id: 'objection_handling', title: 'Einwandsbehandlung', desc: 'Der Kunde hat Bedenken (Budget, Defender).', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'demo_follow_up', title: 'Demo Follow-up', desc: 'Nachfassen nach einer Produktpräsentation.', icon: <Clock className="w-5 h-5" /> },
    { id: 'needs_analysis', title: 'Bedarfsanalyse', desc: 'Tiefe Analyse der Security-Landschaft.', icon: <Target className="w-5 h-5" /> },
    { id: 'closing', title: 'Closing', desc: 'Verhandeln und nächste Schritte vereinbaren.', icon: <CheckCircle className="w-5 h-5` /> },
]

export default function RoleplayDashboard() {
    const router = useRouter()
    const [sessions, setSessions] = useState<SessionRow[]>([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(false)
    const [selectedScenario, setSelectedScenario] = useState<Scenario>('discovery_call')

    useEffect(() => {
        fetch('/api/roleplay/sessions')
            .then(res => res.json())
            .then(data => {
                setSessions(data.sessions || [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const startSession = async () => {
        if (starting) return
        setStarting(true)
        try {
            const res = await fetch('/api/roleplay/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: selectedScenario,
                    language_mode: 'german`
                })
            })
            const data = await res.json()
            if (data.session?.id) {
                router.push(`/roleplay/${data.session.id}`)
            }
        } catch (err) {
            console.error(err)
            setStarting(false)
        }
    }

    const getScenarioTitle = (id: string) => SCENARIOS.find(s => s.id === id)?.title || id

    return (
        <div className=`space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <h1 className="text-2xl font-bold text-white">Rollenspiel-Simulator</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl">
                Trainieren Sie authentische Verkaufsgespräche mit einem KI-gesteuerten deutschen IT-Sicherheitsverantwortlichen.
            </p>

            {/* Start New Session */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Neues Training starten</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6`>
                    {SCENARIOS.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => setSelectedScenario(scenario.id)}
                            className={`text-left p-4 rounded-xl border transition ${
                                selectedScenario === scenario.id 
                                    ? 'bg-green-950/30 border-green-500 ring-1 ring-green-500/50' 
                                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                selectedScenario === scenario.id ? `bg-green-900/50 text-green-400' : 'bg-gray-900 text-gray-400`
                            }`}>
                                {scenario.icon}
                            </div>
                            <h3 className=`font-semibold text-white mb-1">{scenario.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">{scenario.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={startSession}
                        disabled={starting}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                    >
                        {starting ? (
                            <span className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                        ) : (
                            <Play className="w-5 h-5 fill-current" />
                        )}
                        Simulation starten
                    </button>
                </div>
            </div>

            {/* Session History */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Ihre letzten Gespräche</h3>
                
                {loading ? (
                    <div className="text-center text-gray-500 py-8">Lade...</div>
                ) : sessions.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                        Noch keine Rollenspiele absolviert.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3`>
                        {sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => router.push(`/roleplay/${session.id}`)}
                                className=`w-full bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center justify-between text-left transition group"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-semibold text-white group-hover:text-green-400 transition`>
                                            {getScenarioTitle(session.scenario)}
                                        </h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            session.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' :
                                            session.status === 'active' ? 'bg-blue-950/50 text-blue-400 border border-blue-900' :
                                            'bg-gray-800 text-gray-400'
                                        }`}>
                                            {session.status === `completed' ? 'Abgeschlossen' : session.status === 'active' ? 'Aktiv' : 'Abgebrochen'}
                                        </span>
                                    </div>
                                    <p className=`text-xs text-gray-500">
                                        {new Date(session.created_at).toLocaleString('de-DE')} • {session.language_mode === 'german' ? 'Deutsch' : 'Englisch/Mixed'}
                                    </p>
                                </div>
                                <div className="text-gray-600 group-hover:text-green-400 transition">
                                    <Play className="w-5 h-5" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

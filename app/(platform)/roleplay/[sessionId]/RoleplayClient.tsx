'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, CheckCircle, ShieldAlert, XCircle, Bot, User, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type SessionRow = Database['public']['Tables']['roleplay_sessions']['Row']
type MessageRow = Database['public']['Tables']['roleplay_messages']['Row']
type Evaluation = any

export default function RoleplayClient({
    session,
    initialMessages
}: {
    session: SessionRow,
    initialMessages: MessageRow[]
}) {
    const router = useRouter()
    const [messages, setMessages] = useState<Pick<MessageRow, 'id' | 'role' | 'content'>[]>(initialMessages)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [evaluating, setEvaluating] = useState(false)
    const [evaluation, setEvaluation] = useState<Evaluation | null>(session.evaluation as any)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isCompleted = session.status === 'completed' || evaluation !== null

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, evaluation])

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || loading || isCompleted) return

        const userMsg = input.trim()
        setInput('')
        setLoading(true)

        // Optimistic UI
        const tempId = Date.now().toString()
        setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMsg }])

        try {
            const res = await fetch(`/api/roleplay/${session.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: userMsg })
            })

            if (!res.ok) throw new Error('Failed to send message')

            // Handle SSE Stream
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) throw new Error('No reader available')

            let aiContent = ''
            const aiTempId = (Date.now() + 1).toString()

            setMessages(prev => [...prev, { id: aiTempId, role: 'assistant', content: '' }])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\\n\\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') break

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.delta) {
                                aiContent += parsed.delta
                                setMessages(prev => prev.map(m =>
                                    m.id === aiTempId ? { ...m, content: aiContent } : m
                                ))
                            }
                        } catch (e) {
                            console.error('Error parsing SSE chunk', e)
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err)
            // Remove optimistic message on error or show error state
        } finally {
            setLoading(false)
        }
    }

    const finishAndEvaluate = async () => {
        if (evaluating || isCompleted) return
        setEvaluating(true)

        try {
            const res = await fetch(`/api/roleplay/${session.id}/evaluate`, {
                method: 'POST',
            })
            const data = await res.json()
            if (data.evaluation) {
                setEvaluation(data.evaluation)
                router.refresh()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setEvaluating(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gray-950 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/roleplay" className="text-gray-400 hover:text-white transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-bold text-white capitalize">
                            {session.scenario.replace('_', ' ')}
                        </h1>
                        <p className="text-xs text-gray-500 line-clamp-1">{session.persona}</p>
                    </div>
                </div>

                {!isCompleted && messages.length > 2 && (
                    <button
                        onClick={finishAndEvaluate}
                        disabled={evaluating || loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shrink-0"
                    >
                        {evaluating ? 'Auswertung läuft...' : 'Gespräch beenden & Auswerten'}
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Beginnen Sie das Gespräch.</p>
                        <p className="text-sm mt-1">Stellen Sie sich vor und nennen Sie den Grund Ihres Anrufs.</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={msg.id || i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-900 text-blue-400' : 'bg-gray-800 text-green-400'
                            }`}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`px-5 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                            }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {/* Evaluation Results */}
                {evaluation && (
                    <div className="mt-8 bg-gray-950 border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-green-400" />
                            Auswertung ({evaluation.overall_score?.score}/10)
                        </h2>

                        <p className="text-gray-300 leading-relaxed mb-6 bg-gray-900 p-4 rounded-lg border border-gray-800">
                            {evaluation.overall_summary}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {[
                                { k: 'language_clarity', l: 'Sprachliche Klarheit' },
                                { k: 'grammar_accuracy', l: 'Grammatik' },
                                { k: 'sales_discovery_quality', l: 'Discovery Qualität' },
                                { k: 'objection_handling', l: 'Einwandbehandlung' },
                                { k: 'business_tone', l: 'Professionalität' }
                            ].map(({ k, l }) => {
                                const sc = evaluation[k]
                                if (!sc) return null
                                return (
                                    <div key={k} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-gray-300">{l}</span>
                                            <span className={`font-bold ${sc.score >= 8 ? 'text-green-400' : sc.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {sc.score}/10
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">{sc.feedback}</p>
                                    </div>
                                )
                            })}
                        </div>

                        {evaluation.example_corrections && evaluation.example_corrections.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    Korrekturvorschläge
                                </h3>
                                <div className="space-y-3">
                                    {evaluation.example_corrections.map((corr: any, idx: number) => (
                                        <div key={idx} className="bg-gray-900 p-3 rounded-lg text-sm border border-gray-800">
                                            <div className="flex items-start gap-2 mb-2 text-red-400">
                                                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span className="line-through opacity-80">{corr.original}</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-emerald-400">
                                                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span className="font-medium">{corr.improved}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!isCompleted && (
                <div className="bg-gray-950 p-4 border-t border-gray-800 shrink-0">
                    <form onSubmit={sendMessage} className="relative flex items-end gap-2 max-w-4xl mx-auto">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Ihre Antwort..."
                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none min-h-[52px] max-h-32"
                            disabled={loading}
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 bottom-2 p-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-600 mt-2">
                        Drücken Sie Enter zum Senden, Shift+Enter für einen Zeilenumbruch.
                    </p>
                </div>
            )}
        </div>
    )
}

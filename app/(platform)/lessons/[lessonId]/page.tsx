import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Headphones, MessageCircle, PenTool, TextSelect } from 'lucide-react'
import WritingEditor from '@/components/lessons/WritingEditor'
import type { Database } from '@/types/database'

type Json = Database['public']['Tables']['lessons']['Row']['generated_content']

// Helper to typecast the JSON
type LessonContent = {
    title: string
    topic: string
    vocabulary: Array<{
        word_de: string
        word_en: string
        example_sentence: string
    }>
    listening: {
        dialogue: string
        questions: Array<{ question: string; answer: string }>
    }
    speaking: {
        scenario: string
        goal: string
        starter_de: string
    }
    reading: {
        article: string
        questions: Array<{ question: string; answer: string }>
    }
    writing: {
        prompt: string
        example: string
    }
}

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = await params
    const adminSupabase = createAdminClient()
    const { data: lesson } = await adminSupabase.from('lessons').select('title').eq('id', lessonId).single()
    return { title: `${(lesson as any)?.title ?? 'Lektion'} | Proofpoint Trainer` }
}

export default async function LessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = await params
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: lesson } = await adminSupabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('user_id', user.id)
        .single()

    if (!lesson || !(lesson as any).generated_content) {
        redirect('/lessons')
    }

    const content = (lesson as any).generated_content as unknown as LessonContent

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            {/* Nav */}
            <div className="flex items-center gap-4">
                <Link
                    href="/lessons"
                    className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                            Lektion
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                        <span className="text-xs text-gray-500">
                            {new Date((lesson as any).scheduled_date).toLocaleDateString('de-DE')}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white leading-tight">
                        {content.title}
                    </h1>
                </div>
            </div>

            {/* Vocabulary */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-purple-950/30 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
                    <TextSelect className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">Vokabeln</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.vocabulary.map((v, i) => (
                            <div key={i} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                                <p className="font-bold text-white mb-1">{v.word_de}</p>
                                <p className="text-sm text-gray-400 mb-3">{v.word_en}</p>
                                <p className="text-xs text-gray-500 italic bg-gray-900 p-2 rounded">
                                    "{v.example_sentence}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reading */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-blue-950/30 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-white">Leseverstehen</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-300">
                        {content.reading.article.split('\\n').map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                    <div className="bg-gray-950 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Fragen zum Text</h3>
                        {content.reading.questions.map((q, i) => (
                            <div key={i}>
                                <p className="text-sm text-gray-300 font-medium">Q: {q.question}</p>
                                <p className="text-sm text-emerald-400 mt-1">A: {q.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Listening / Dialogue */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-yellow-950/30 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
                    <Headphones className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold text-white">Hörverstehen / Dialog</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gray-950 rounded-xl p-5 font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                        {content.listening.dialogue}
                    </div>
                    <div className="bg-gray-950 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Verständnisfragen</h3>
                        {content.listening.questions.map((q, i) => (
                            <div key={i}>
                                <p className="text-sm text-gray-300 font-medium">Q: {q.question}</p>
                                <p className="text-sm text-yellow-400 mt-1">A: {q.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Speaking / Roleplay Prep */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-green-950/30 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-bold text-white">Sprechen / Vorbereitung</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-gray-950 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Szenario</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{content.speaking.scenario}</p>
                    </div>
                    <div className="bg-gray-950 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ziel</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{content.speaking.goal}</p>
                    </div>
                    <div className="bg-gray-950 rounded-xl p-4 border border-green-900/30">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Einstieg (Ihr Gegenüber)</p>
                        <p className="text-sm text-green-400 italic">"{content.speaking.starter_de}"</p>
                    </div>
                    <div className="pt-2 text-center">
                        <Link
                            href="/roleplay"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium text-sm rounded-lg transition"
                        >
                            Zum Rollenspiel-Simulator
                        </Link>
                    </div>
                </div>
            </section>

            {/* Writing Practice */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-red-950/30 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-bold text-white">Schreibübung</h2>
                </div>
                <div className="p-6">
                    <WritingEditor
                        writingPrompt={content.writing.prompt}
                        exampleAnswer={content.writing.example}
                        lessonId={lessonId}
                    />
                </div>
            </section>
        </div>
    )
}

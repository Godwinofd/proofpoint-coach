import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Calendar, Clock, Play } from 'lucide-react'

export const metadata = {
    title: 'Lektionen | Proofpoint Trainer',
}

export default async function LessonsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch all lessons for user
    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: false })

    const todayStr = new Date().toISOString().split('T')[0]

    // Check if the first lesson is today`s lesson
    const hasTodaysLesson = lessons && lessons.length > 0 && (lessons[0] as any).scheduled_date === todayStr

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 mb-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Lektionen</h1>
            </div>

            <p className="text-gray-400 text-sm max-w-2xl">
                Ihre täglichen Cybersecurity-Sprachlektionen. Jede Lektion enthält Lese-, Hör-, Sprech- und Schreibübungen.
            </p>

            {/* Daily Call to Action */}
            <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-blue-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-white mb-2">Tägliche Lektion</h2>
                    <p className="text-blue-200 mb-6 max-w-md">
                        {hasTodaysLesson
                            ? "Ihre heutige Lektion ist bereit. Fahren Sie mit dem Lernen fort."
                            : "Neue Lektion generieren basierend auf Ihrem aktuellen Sprachniveau und Cybersecurity-Fokus."}
                    </p>

                    <Link
                        href="/lessons/today"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
                    >
                        {hasTodaysLesson ? <Play className="w-5 h-5 fill-current" /> : <BookOpen className="w-5 h-5" />}
                        {hasTodaysLesson ? "Lektion fortsetzen" : "Heutige Lektion starten"}
                    </Link>
                </div>

                <div className="relative z-10 w-24 h-24 bg-blue-950 rounded-full border border-blue-800 flex items-center justify-center shrink-0">
                    <Calendar className="w-10 h-10 text-blue-400" />
                </div>
            </div>

            {/* Lesson History */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Vergangene Lektionen</h3>

                {!lessons || lessons.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                        Sie haben noch keine Lektionen absolviert. Starten Sie Ihre erste Lektion oben!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4`>
                        {(lessons as any[]).map((lesson: any) => (
                            <Link
                                key={lesson.id}
                                href={`/lessons/${lesson.id}`}
                                className=`bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 flex flex-col justify-between transition group"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(lesson.scheduled_date).toLocaleDateString(`de-DE')}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-white group-hover:text-blue-400 transition mb-2">
                                        {lesson.title}
                                    </h4>
                                    {lesson.generated_content && (
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            Topic: {(lesson.generated_content as any)?.topic ?? 'Cybersecurity'}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                                    <span className="text-blue-500 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Öffnen <Play className="w-3 h-3" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

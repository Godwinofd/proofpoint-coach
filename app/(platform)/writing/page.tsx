import WritingEditor from '@/components/lessons/WritingEditor'
import { PenLine, ShieldCheck, Mail, Linkedin, Calendar } from 'lucide-react'

export const metadata = {
    title: 'Schreibübungen | Proofpoint Trainer',
}

type WritingExercise = {
    id: string
    icon: typeof PenLine
    category: string
    prompt: string
    exampleAnswer?: string
}

const exercises: WritingExercise[] = [
    {
        id: 'cold-email-phishing',
        icon: Mail,
        category: 'Kalt-E-Mail',
        prompt:
            'Schreiben Sie eine kurze Kalt-E-Mail (maximal 150 Wörter) an einen IT-Sicherheitsleiter eines mittelständischen Unternehmens. ' +
            'Thema: Proofpoint schützt Mitarbeiter vor Phishing-Angriffen. ' +
            'Ziel: einen 15-minütigen Entdeckungsanruf vereinbaren.',
        exampleAnswer:
            'Sehr geehrter Herr Müller,\n\nphishing-Angriffe treffen täglich Tausende von Unternehmen – und die Täter werden immer raffinierter.\n\n' +
            'Proofpoint schützt über 8.000 Unternehmen weltweit vor genau diesen Bedrohungen, indem wir bösartige E-Mails blockieren, bevor sie den Posteingang Ihrer Mitarbeiter erreichen.\n\n' +
            'Hätten Sie 15 Minuten für ein kurzes Gespräch? Ich würde Ihnen gerne zeigen, wie ähnliche Unternehmen aus Ihrer Branche ihre Mitarbeiter schützen.\n\n' +
            'Mit freundlichen Grüßen\n[Ihr Name]',
    },
    {
        id: 'linkedin-insider-threat',
        icon: Linkedin,
        category: 'LinkedIn-Nachricht',
        prompt:
            'Verfassen Sie eine LinkedIn-Verbindungsanfrage (maximal 80 Wörter) an einen CISO. ' +
            'Thema: Insider-Bedrohungen und Datenverlust-Prävention (DLP). ' +
            'Bleiben Sie professionell und auf den Punkt.',
        exampleAnswer:
            'Sehr geehrte Frau Schmidt,\n\nals CISO kennen Sie die Herausforderungen innerer Bedrohungen aus eigener Erfahrung. ' +
            'Ich helfe Unternehmen dabei, mit Proofpoints DLP-Lösung vertrauliche Daten zu schützen – auch vor unbeabsichtigten Datenlecks durch eigene Mitarbeiter. ' +
            'Ich würde mich über die Möglichkeit freuen, Erfahrungen auszutauschen.\n\nMit freundlichen Grüßen\n[Ihr Name]',
    },
    {
        id: 'followup-email-security',
        icon: Mail,
        category: 'Follow-up-E-Mail',
        prompt:
            'Sie haben letzte Woche eine Demo zu Proofpoints E-Mail-Sicherheitslösung gegeben. ' +
            'Schreiben Sie eine Follow-up-E-Mail (maximal 120 Wörter) an den Ansprechpartner. ' +
            'Fassen Sie zwei wichtige Punkte zusammen und schlagen Sie einen nächsten Schritt vor.',
    },
    {
        id: 'meeting-confirmation',
        icon: Calendar,
        category: 'Terminbestätigung',
        prompt:
            'Bestätigen Sie einen Termin für einen Discovery Call mit einem potenziellen Kunden (IT-Leiter bei einer Bank). ' +
            'Das Gespräch findet am Dienstag, 10. März um 14:00 Uhr statt. ' +
            'Schreiben Sie eine professionelle Bestätigungs-E-Mail auf Deutsch (maximal 100 Wörter).',
    },
    {
        id: 'objection-response',
        icon: ShieldCheck,
        category: 'Einwand-Antwort',
        prompt:
            'Ein Interessent hat geschrieben: "Wir haben bereits eine Firewall und denken, das reicht aus." ' +
            'Schreiben Sie eine kurze, professionelle E-Mail-Antwort (maximal 130 Wörter) auf Deutsch, ' +
            'die den Unterschied zwischen einer Firewall und Proofpoints E-Mail-Sicherheitslösung erklärt.',
    },
]

export default function WritingPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2.5 mb-2">
                    <PenLine className="w-5 h-5 text-blue-400" />
                    <h1 className="text-2xl font-bold text-white">Schreibübungen</h1>
                </div>
                <p className="text-gray-400 text-sm max-w-2xl">
                    Üben Sie professionelle deutsche Geschäftskorrespondenz für den Cybersecurity-Vertrieb.
                    Wählen Sie eine Aufgabe, schreiben Sie Ihre Antwort, und erhalten Sie sofortiges KI-Feedback.
                </p>
            </div>

            {/* Exercise cards */}
            <div className="space-y-10">
                {exercises.map((exercise) => {
                    const Icon = exercise.icon
                    return (
                        <div
                            key={exercise.id}
                            className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden"
                        >
                            {/* Exercise header */}
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-950 border border-blue-800">
                                    <Icon className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                                    {exercise.category}
                                </span>
                            </div>

                            {/* Editor */}
                            <div className="p-6">
                                <WritingEditor
                                    writingPrompt={exercise.prompt}
                                    exampleAnswer={exercise.exampleAnswer}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

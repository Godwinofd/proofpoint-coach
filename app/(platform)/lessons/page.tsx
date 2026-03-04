import { BookOpen } from 'lucide-react'

export const metadata = {
    title: 'Lektionen | Proofpoint Trainer',
}

export default function LessonsPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2.5 mb-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Lektionen</h1>
            </div>
            <p className="text-gray-400 text-sm">
                This feature is currently under development. Here you will be able to start new cybersecurity language lessons.
            </p>
            
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center mt-10">
                <p className="text-gray-300">In Development</p>
            </div>
        </div>
    )
}

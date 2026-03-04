'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Global Next.js error boundary.
 * Catches unhandled runtime errors in any Server or Client Component.
 * Must be a Client Component ('use client') — Next.js requirement.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error for server-side debugging (Vercel logs will capture this)
        console.error('[Error Boundary]', error.digest ?? error.message)
    }, [error])

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950 mb-5">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>

                <h1 className="text-xl font-bold text-white mb-2">
                    Etwas ist schiefgelaufen.
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
                    Wenn das Problem anhält, wenden Sie sich an den Support.
                </p>

                {/* Error digest for debugging — only show in development */}
                {process.env.NODE_ENV === 'development' && error.digest && (
                    <p className="text-xs text-gray-600 mb-5 font-mono bg-gray-800 px-3 py-2 rounded-lg">
                        Fehler-ID: {error.digest}
                    </p>
                )}

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                    <RefreshCw className="w-4 h-4" />
                    Erneut versuchen
                </button>
            </div>
        </div>
    )
}

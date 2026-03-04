import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/platform/Sidebar'

export default async function PlatformLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Redundant guard — middleware handles this, but keep as failsafe
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

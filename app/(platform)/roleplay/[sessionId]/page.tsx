import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoleplayClient from './RoleplayClient'

export const metadata = {
    title: 'Rollenspiel | Proofpoint Trainer',
}

export default async function RoleplaySessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: session } = await supabase
        .from('roleplay_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

    if (!session) redirect('/roleplay')

    const { data: messages } = await supabase
        .from('roleplay_messages')
        .select('id, role, content, turn_index, created_at')
        .eq('session_id', sessionId)
        .order('turn_index', { ascending: true })

    return <RoleplayClient session={session} initialMessages={messages ?? []} />
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VocabularyClient from './VocabularyClient'
import type { Database } from '@/types/database'

export const metadata = {
    title: 'Vokabeln | Proofpoint Trainer',
}

type VocabRow = Database['public']['Tables']['vocabulary']['Row']

export default async function VocabularyPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch vocabulary
    const { data: words } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_date', { ascending: true })

    return <VocabularyClient initialWords={(words ?? []) as VocabRow[]} />
}

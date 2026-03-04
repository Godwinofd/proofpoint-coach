import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function TodayLessonRedirect() {
    // We hit our own API route to get or generate today's lesson,
    // then redirect to the actual lesson page.
    const headersList = await headers()
    const domain = headersList.get('host') || ''
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const baseUrl = `\${protocol}://\${domain}`

    try {
        const res = await fetch(`\${baseUrl}/api/lessons/today`, {
            method: 'GET',
            headers: {
                cookie: headersList.get('cookie') ?? '',
            },
            // Don't cache this fetch
            cache: 'no-store'
        })

        if (!res.ok) {
            throw new Error('Failed to fetch today lesson')
        }

        const data = await res.json()
        if (data?.lesson?.id) {
            redirect(`/lessons/\${data.lesson.id}`)
        } else {
            redirect('/lessons')
        }
    } catch (error) {
        console.error('Redirect to today lesson failed:', error)
        redirect('/lessons')
    }
}

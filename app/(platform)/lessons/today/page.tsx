import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function TodayLessonRedirect() {
    // We hit our own API route to get or generate today's lesson,
    // then redirect to the actual lesson page.
    const headersList = await headers()
    const domain = headersList.get('host') || ''
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const baseUrl = `${protocol}://${domain}`

    let destination = '/lessons'

    try {
        const res = await fetch(`${baseUrl}/api/lessons/today`, {
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
            destination = `/lessons/${data.lesson.id}`
        }
    } catch (error) {
        console.error('Redirect to today lesson failed:', error)
    }

    // Call redirect outside the try-catch block
    // Next.js redirect() throws a special error to halt execution and return a 307
    redirect(destination)
}

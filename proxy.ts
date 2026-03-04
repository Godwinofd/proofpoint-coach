import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Auth proxy (renamed from middleware in Next.js 16).
 * Runs on every matched request.
 *
 * Responsibilities:
 * 1. Refresh the Supabase JWT session via cookie
 * 2. Protect all platform routes — redirect to /login if unauthenticated
 * 3. Redirect authenticated users away from /login and /register
 */
export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // MUST call getUser() before any conditional logic — refreshes the session.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/lessons') ||
        pathname.startsWith('/vocabulary') ||
        pathname.startsWith('/roleplay') ||
        pathname.startsWith('/writing') ||
        pathname.startsWith('/analytics') ||
        pathname.startsWith('/progress')

    const isAuthRoute =
        pathname.startsWith('/login') || pathname.startsWith('/register')

    // Unauthenticated user → redirect to /login
    if (!user && isProtectedRoute) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Authenticated user on auth pages → redirect to /dashboard
    if (user && isAuthRoute) {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashboardUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

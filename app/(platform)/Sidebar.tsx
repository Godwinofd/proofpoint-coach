'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    BookOpen,
    Library,
    MessageSquare,
    BarChart3,
    TrendingUp,
    LogOut,
    ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lessons', label: 'Lektionen', icon: BookOpen },
    { href: '/vocabulary', label: 'Vokabular', icon: Library },
    { href: '/roleplay', label: 'Rollenspiel', icon: MessageSquare },
    { href: '/analytics', label: 'Analytik', icon: BarChart3 },
    { href: '/progress', label: 'Fortschritt', icon: TrendingUp },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login`)
        router.refresh()
    }

    return (
        <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">Proofpoint</p>
                    <p className="text-xs text-gray-500 truncate">Trainer</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto`>
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(`${href}/`)
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? `bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Icon className=`w-4 h-4 flex-shrink-0" />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Abmelden
                </button>
            </div>
        </aside>
    )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/recipes',  label: 'Recipes',      icon: '🍽️' },
  { href: '/planner',  label: 'Meal Planner',  icon: '📅' },
  { href: '/shopping', label: 'Shopping List', icon: '🛒' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
      <div className="text-lg font-bold text-green-600 mb-8 px-2">🥗 RecipeApp</div>
      <nav className="flex flex-col gap-1">
        {links.map(link => (
          <Link key={link.href} href={link.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(link.href) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span>{link.icon}</span>{link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

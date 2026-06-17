'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Header() {
  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 shrink-0">
      <div />
      <Link href="/recipes/new">
        <Button size="sm">+ Add Recipe</Button>
      </Link>
    </header>
  )
}

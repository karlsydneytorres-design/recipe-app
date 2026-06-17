import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  color?: 'green' | 'blue' | 'amber' | 'red' | 'gray'
}

export function Badge({ label, color = 'green' }: BadgeProps) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    blue:  'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    red:   'bg-red-100 text-red-800',
    gray:  'bg-gray-100 text-gray-700',
  }
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', colors[color])}>
      {label}
    </span>
  )
}

'use client'
import { ShoppingItem as ShoppingItemType } from '@/types'

export function ShoppingItem({ item, onToggle }: { item: ShoppingItemType; onToggle: (id: string) => void }) {
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${item.is_checked ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={item.is_checked} onChange={() => onToggle(item.id)}
        className="w-4 h-4 accent-green-600 cursor-pointer" />
      <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {item.amount} {item.unit} {item.name}
      </span>
    </div>
  )
}

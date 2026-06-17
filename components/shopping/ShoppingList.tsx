'use client'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ShoppingItem } from './ShoppingItem'
import { Button } from '@/components/ui/Button'

export function ShoppingList() {
  const { data: items = [], refetch } = useShoppingList()

  const handleToggle = async (id: string) => {
    // TODO: toggle is_checked in Supabase
    refetch()
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.filter(i => !i.is_checked).length} items remaining</p>
        <Button variant="secondary" size="sm">Generate from plan</Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {items.map(item => <ShoppingItem key={item.id} item={item} onToggle={handleToggle} />)}
        {items.length === 0 && (
          <p className="text-center py-12 text-gray-400 text-sm">No items yet. Generate from your meal plan!</p>
        )}
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { ShoppingItem } from '@/types'

export function useShoppingList() {
  return useQuery<ShoppingItem[]>({
    queryKey: ['shopping-list'],
    queryFn: async () => {
      const res = await fetch('/api/shopping-list')
      if (!res.ok) throw new Error('Failed to fetch shopping list')
      return res.json()
    },
  })
}

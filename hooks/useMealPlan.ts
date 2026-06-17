import { useQuery } from '@tanstack/react-query'
import { MealPlan } from '@/types'

export function useMealPlan(weekStart: string, weekEnd: string) {
  return useQuery<MealPlan[]>({
    queryKey: ['meal-plan', weekStart, weekEnd],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plans?weekStart=${weekStart}&weekEnd=${weekEnd}`)
      if (!res.ok) throw new Error('Failed to fetch meal plan')
      return res.json()
    },
  })
}

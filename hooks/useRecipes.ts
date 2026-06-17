import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Recipe } from '@/types'

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const res = await fetch('/api/recipes')
      if (!res.ok) throw new Error('Failed to fetch recipes')
      return res.json()
    },
  })
}

export function useRecipe(id: string) {
  return useQuery<Recipe>({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${id}`)
      if (!res.ok) throw new Error('Recipe not found')
      return res.json()
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

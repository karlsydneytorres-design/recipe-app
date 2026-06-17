'use client'
import { Modal } from '@/components/ui/Modal'
import { useRecipes } from '@/hooks/useRecipes'

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  mealType: string
}

export function AddMealModal({ isOpen, onClose, date, mealType }: AddMealModalProps) {
  const { data: recipes = [] } = useRecipes()

  const handleSelect = async (recipeId: string) => {
    await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: recipeId, planned_date: date, meal_type: mealType, servings: 2 }),
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add ${mealType} for ${date}`}>
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {recipes.map(recipe => (
          <button key={recipe.id} onClick={() => handleSelect(recipe.id)}
            className="text-left px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-colors text-sm border border-gray-100">
            {recipe.title}
          </button>
        ))}
        {recipes.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No recipes yet. Add some first!</p>}
      </div>
    </Modal>
  )
}

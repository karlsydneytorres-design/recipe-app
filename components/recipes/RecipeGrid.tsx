import { Recipe } from '@/types'
import { RecipeCard } from './RecipeCard'

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">🍳</p>
        <p className="text-lg font-medium">No recipes yet</p>
        <p className="text-sm mt-1">Add your first recipe to get started</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
    </div>
  )
}

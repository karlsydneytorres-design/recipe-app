import { RecipeForm } from '@/components/recipes/RecipeForm'

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Recipe</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below to save your recipe.</p>
      </div>
      <RecipeForm />
    </div>
  )
}
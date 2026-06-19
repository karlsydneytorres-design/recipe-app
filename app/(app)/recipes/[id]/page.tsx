'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Ingredient = {
  id: string; name: string; amount: number | null; unit: string | null; sort_order: number
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fiber: number | null; sugar: number | null
}
type Step = { id: string; step_number: number; instruction: string }
type Recipe = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  prep_time: number | null
  cook_time: number | null
  servings: number
  cuisine: string | null
  tags: string[]
  is_favorite: boolean
  ingredients: Ingredient[]
  steps: Step[]
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('recipes')
        .select('*, ingredients(*), steps(*)')
        .eq('id', id)
        .single()
      setRecipe(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('recipes').delete().eq('id', id)
    router.push('/recipes')
    router.refresh()
  }

  const handleFavorite = async () => {
    if (!recipe) return
    const supabase = createClient()
    const { data } = await supabase
      .from('recipes')
      .update({ is_favorite: !recipe.is_favorite })
      .eq('id', id)
      .select()
      .single()
    if (data) setRecipe({ ...recipe, is_favorite: data.is_favorite })
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-gray-400 text-sm">Loading...</p></div>
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-400 text-sm mb-4">Recipe not found.</p>
        <Link href="/recipes" className="text-green-600 text-sm font-medium hover:underline">← Back to recipes</Link>
      </div>
    )
  }

  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
  const sortedIngredients = [...(recipe.ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const sortedSteps = [...(recipe.steps ?? [])].sort((a, b) => a.step_number - b.step_number)

  // Sum nutrition across all ingredients
  const nutritionTotals = sortedIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories ?? 0),
      protein: acc.protein + (ing.protein ?? 0),
      carbs: acc.carbs + (ing.carbs ?? 0),
      fat: acc.fat + (ing.fat ?? 0),
      fiber: acc.fiber + (ing.fiber ?? 0),
      sugar: acc.sugar + (ing.sugar ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  )
  const hasNutritionData = nutritionTotals.calories > 0 || nutritionTotals.protein > 0
  const perServing = recipe.servings > 0 ? {
    calories: Math.round(nutritionTotals.calories / recipe.servings),
    protein: Math.round(nutritionTotals.protein / recipe.servings),
    carbs: Math.round(nutritionTotals.carbs / recipe.servings),
    fat: Math.round(nutritionTotals.fat / recipe.servings),
  } : nutritionTotals

  return (
    <div className="max-w-2xl">

      <div className="flex items-center justify-between mb-6">
        <Link href="/recipes" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">← Back</Link>
        <div className="flex items-center gap-2">
          <button onClick={handleFavorite}
            className={`text-xl transition-transform hover:scale-110 ${recipe.is_favorite ? 'text-yellow-400' : 'text-gray-300'}`}
            title={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>★</button>
          <Link href={`/recipes/${id}/edit`}
            className="border border-gray-200 text-gray-600 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors">
            Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="bg-red-50 text-red-600 border border-red-100 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {recipe.image_url
        ? <img src={recipe.image_url} alt={recipe.title} className="w-full h-64 object-cover rounded-2xl mb-6" />
        : <div className="w-full h-48 bg-gray-50 rounded-2xl flex items-center justify-center text-6xl mb-6">🍽️</div>
      }

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
      {recipe.description && <p className="text-gray-500 mb-4">{recipe.description}</p>}

      <div className="flex flex-wrap gap-3 mb-6">
        {recipe.prep_time && (
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Prep</p>
            <p className="text-sm font-semibold text-gray-800">{recipe.prep_time} min</p>
          </div>
        )}
        {recipe.cook_time && (
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Cook</p>
            <p className="text-sm font-semibold text-gray-800">{recipe.cook_time} min</p>
          </div>
        )}
        {totalTime > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Total</p>
            <p className="text-sm font-semibold text-gray-800">{totalTime} min</p>
          </div>
        )}
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-gray-400 mb-0.5">Servings</p>
          <p className="text-sm font-semibold text-gray-800">{recipe.servings}</p>
        </div>
        {recipe.cuisine && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-blue-400 mb-0.5">Cuisine</p>
            <p className="text-sm font-semibold text-blue-700">{recipe.cuisine}</p>
          </div>
        )}
      </div>

      {recipe.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {recipe.tags.map(tag => (
            <span key={tag} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      )}

      {/* Nutrition summary */}
      {hasNutritionData && (
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Nutrition</h2>
            <span className="text-xs text-green-700 bg-white/70 px-2.5 py-1 rounded-full font-medium">Per serving</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{perServing.calories}</p>
              <p className="text-xs text-gray-500 mt-0.5">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{perServing.protein}<span className="text-sm font-medium">g</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{perServing.carbs}<span className="text-sm font-medium">g</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{perServing.fat}<span className="text-sm font-medium">g</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Fat</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-green-100/70 text-xs text-gray-500">
            <span>Fiber: <strong className="text-gray-700">{Math.round(nutritionTotals.fiber / recipe.servings)}g</strong></span>
            <span>Sugar: <strong className="text-gray-700">{Math.round(nutritionTotals.sugar / recipe.servings)}g</strong></span>
            <span className="text-gray-400">(whole recipe: {Math.round(nutritionTotals.calories)} kcal)</span>
          </div>
        </section>
      )}

      {sortedIngredients.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h2>
          <ul className="flex flex-col gap-2">
            {sortedIngredients.map(ing => (
              <li key={ing.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                <span className="text-sm text-gray-800 flex-1">{ing.name}</span>
                {(ing.amount || ing.unit) && (
                  <span className="text-sm text-gray-500 font-medium">{ing.amount} {ing.unit}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sortedSteps.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol className="flex flex-col gap-5">
            {sortedSteps.map(step => (
              <li key={step.id} className="flex gap-4">
                <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {step.step_number}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pt-1">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

    </div>
  )
}
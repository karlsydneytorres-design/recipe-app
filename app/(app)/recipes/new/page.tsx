'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Recipe = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  prep_time: number | null
  cook_time: number | null
  cuisine: string | null
  tags: string[]
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecipes = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
      setRecipes(data ?? [])
      setLoading(false)
    }
    fetchRecipes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Loading recipes...</p>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🍳</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No recipes yet</h2>
        <p className="text-gray-400 text-sm mb-6">Add your first recipe to get started</p>
        <Link href="/recipes/new"
          className="bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-green-700 transition-colors">
          + Add Recipe
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
        <span className="text-sm text-gray-400">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {recipes.map(recipe => {
          const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
          return (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {recipe.image_url
                ? <img src={recipe.image_url} alt={recipe.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-5xl">🍽️</div>
              }
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {totalTime > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{totalTime} min</span>
                  )}
                  {recipe.cuisine && (
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{recipe.cuisine}</span>
                  )}
                  {recipe.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
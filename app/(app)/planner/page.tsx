'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addDays, startOfWeek, format, isSameDay } from 'date-fns'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = typeof MEAL_TYPES[number]

type Recipe = { id: string; title: string; image_url: string | null }
type MealPlan = {
  id: string
  recipe_id: string
  planned_date: string
  meal_type: MealType
  servings: number
  recipe: Recipe
}

export default function PlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch')
  const [adding, setAdding] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  const weekStart = format(currentWeek, 'yyyy-MM-dd')
  const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd')

  useEffect(() => {
    loadData()
  }, [currentWeek])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    const [{ data: plans }, { data: recipeList }] = await Promise.all([
      supabase
        .from('meal_plans')
        .select('*, recipe:recipes(id, title, image_url)')
        .gte('planned_date', weekStart)
        .lte('planned_date', weekEnd),
      supabase.from('recipes').select('id, title, image_url').order('title'),
    ])

    setMealPlans((plans as MealPlan[]) ?? [])
    setRecipes(recipeList ?? [])
    setLoading(false)
  }

  const openModal = (date: string, mealType: MealType) => {
    setSelectedDate(date)
    setSelectedMealType(mealType)
    setModalOpen(true)
  }

  const handleAddMeal = async (recipeId: string) => {
    setAdding(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('meal_plans').insert({
      user_id: user.id,
      recipe_id: recipeId,
      planned_date: selectedDate,
      meal_type: selectedMealType,
      servings: 2,
    })

    setModalOpen(false)
    setAdding(false)
    loadData()
  }

  const handleRemoveMeal = async (mealPlanId: string) => {
    const supabase = createClient()
    await supabase.from('meal_plans').delete().eq('id', mealPlanId)
    loadData()
  }

  const getMealsForSlot = (date: Date, mealType: MealType) =>
    mealPlans.filter(
      m => m.planned_date === format(date, 'yyyy-MM-dd') && m.meal_type === mealType
    )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentWeek(d => addDays(d, -7))}
            className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
            ← Prev
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setCurrentWeek(d => addDays(d, 7))}
            className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
            Next →
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="p-3 text-xs font-medium text-gray-400 uppercase tracking-wide" />
          {days.map(day => (
            <div key={day.toISOString()}
              className={`p-3 text-center border-l border-gray-100 ${isSameDay(day, new Date()) ? 'bg-green-50' : ''}`}>
              <p className="text-xs text-gray-400 font-medium">{format(day, 'EEE')}</p>
              <p className={`text-sm font-semibold mt-0.5 ${isSameDay(day, new Date()) ? 'text-green-600' : 'text-gray-800'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Meal rows */}
        {MEAL_TYPES.map(mealType => (
          <div key={mealType} className="grid grid-cols-8 border-b border-gray-50 last:border-0">
            {/* Meal type label */}
            <div className="p-3 flex items-center">
              <span className="text-xs font-medium text-gray-400 capitalize">{mealType}</span>
            </div>

            {/* Day slots */}
            {days.map(day => {
              const slots = getMealsForSlot(day, mealType)
              return (
                <div key={day.toISOString()} className="border-l border-gray-50 p-1.5 min-h-[72px] flex flex-col gap-1">
                  {slots.map(meal => (
                    <div key={meal.id}
                      className="bg-green-50 border border-green-100 rounded-lg px-2 py-1.5 flex items-center justify-between gap-1 group">
                      <span className="text-xs text-green-800 font-medium truncate leading-tight">
                        {meal.recipe?.title}
                      </span>
                      <button onClick={() => handleRemoveMeal(meal.id)}
                        className="text-green-300 hover:text-red-400 text-sm shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => openModal(format(day, 'yyyy-MM-dd'), mealType)}
                    className="text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-lg text-xs py-1 transition-colors w-full text-center border border-dashed border-transparent hover:border-green-200">
                    +
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Add Meal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add to planner</h2>
                <p className="text-sm text-gray-400 mt-0.5 capitalize">
                  {selectedMealType} · {format(new Date(selectedDate + 'T00:00:00'), 'EEE, MMM d')}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {recipes.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No recipes yet. Add some first!</p>
              ) : (
                recipes.map(recipe => (
                  <button key={recipe.id} onClick={() => handleAddMeal(recipe.id)} disabled={adding}
                    className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors text-sm border border-transparent hover:border-green-100 disabled:opacity-50">
                    {recipe.image_url
                      ? <img src={recipe.image_url} alt={recipe.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      : <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base shrink-0">🍽️</span>
                    }
                    <span className="font-medium">{recipe.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
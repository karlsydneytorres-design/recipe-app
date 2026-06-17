'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addDays, startOfWeek, format } from 'date-fns'

type ShoppingItem = {
  id: string
  name: string
  amount: number | null
  unit: string | null
  is_checked: boolean
}

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('shopping_list_items')
      .select('*')
      .order('created_at', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    const supabase = createClient()
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !current } : i))
    await supabase.from('shopping_list_items').update({ is_checked: !current }).eq('id', id)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('shopping_list_items').delete().eq('id', id)
  }

  const handleClearChecked = async () => {
    const supabase = createClient()
    const checkedIds = items.filter(i => i.is_checked).map(i => i.id)
    if (checkedIds.length === 0) return
    setItems(prev => prev.filter(i => !i.is_checked))
    await supabase.from('shopping_list_items').delete().in('id', checkedIds)
  }

  const handleGenerateFromPlan = async () => {
    setGenerating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGenerating(false); return }

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), 'yyyy-MM-dd')

    // Get this week's meal plans with their recipes' ingredients
    const { data: plans } = await supabase
      .from('meal_plans')
      .select('servings, recipe:recipes(servings, ingredients(name, amount, unit))')
      .gte('planned_date', weekStart)
      .lte('planned_date', weekEnd)

    if (!plans || plans.length === 0) {
      alert('No meals planned for this week yet. Add some in the Meal Planner first!')
      setGenerating(false)
      return
    }

    // Aggregate ingredients, scaling by servings ratio
    const aggregated: Record<string, { name: string; amount: number; unit: string | null }> = {}

    for (const plan of plans as any[]) {
      const recipe = plan.recipe
      if (!recipe?.ingredients) continue
      const ratio = recipe.servings ? plan.servings / recipe.servings : 1

      for (const ing of recipe.ingredients) {
        const key = `${ing.name.toLowerCase()}__${ing.unit ?? ''}`
        const scaledAmount = (ing.amount ?? 0) * ratio
        if (aggregated[key]) {
          aggregated[key].amount += scaledAmount
        } else {
          aggregated[key] = { name: ing.name, amount: scaledAmount, unit: ing.unit }
        }
      }
    }

    const newItems = Object.values(aggregated).map(item => ({
      user_id: user.id,
      name: item.name,
      amount: Math.round(item.amount * 100) / 100,
      unit: item.unit,
      is_checked: false,
    }))

    // Remove items that were auto-generated from a meal plan before (unchecked, has source link),
    // so repeated "Generate" clicks don't pile up duplicates. We identify these by matching
    // names against the freshly aggregated list and only clearing unchecked items.
    const newNames = new Set(newItems.map(i => i.name.toLowerCase()))
    const staleIds = items
      .filter(i => !i.is_checked && newNames.has(i.name.toLowerCase()))
      .map(i => i.id)

    if (staleIds.length > 0) {
      await supabase.from('shopping_list_items').delete().in('id', staleIds)
    }

    if (newItems.length > 0) {
      await supabase.from('shopping_list_items').insert(newItems)
    }

    await loadItems()
    setGenerating(false)
  }

  const remaining = items.filter(i => !i.is_checked).length
  const checked = items.filter(i => i.is_checked).length

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
      </div>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${remaining} item${remaining !== 1 ? 's' : ''} remaining`}
        </p>
        <div className="flex items-center gap-2">
          {checked > 0 && (
            <button onClick={handleClearChecked}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Clear checked
            </button>
          )}
          <button onClick={handleGenerateFromPlan} disabled={generating}
            className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
            {generating ? 'Generating...' : '↻ Generate from this week\'s plan'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-gray-500 font-medium mb-1">Your list is empty</p>
            <p className="text-sm text-gray-400">Generate one from your weekly meal plan, or it'll fill up as you plan meals.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id}
              className={`flex items-center gap-3 px-4 py-3 group transition-opacity ${item.is_checked ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                checked={item.is_checked}
                onChange={() => handleToggle(item.id, item.is_checked)}
                className="w-4 h-4 accent-green-600 cursor-pointer shrink-0"
              />
              <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.name}
              </span>
              {(item.amount || item.unit) && (
                <span className="text-xs text-gray-400 font-medium shrink-0">
                  {item.amount ? item.amount : ''} {item.unit ?? ''}
                </span>
              )}
              <button onClick={() => handleDelete(item.id)}
                className="text-gray-300 hover:text-red-400 text-base shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
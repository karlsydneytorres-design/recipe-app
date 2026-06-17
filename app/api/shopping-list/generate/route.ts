import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { weekStart, weekEnd } = await request.json()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mealPlans, error } = await supabase
    .from('meal_plans')
    .select('*, recipes(*, ingredients(*))')
    .eq('user_id', user.id)
    .gte('planned_date', weekStart)
    .lte('planned_date', weekEnd)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate ingredients across all meal plans
  const itemsMap: Record<string, { name: string; amount: number; unit: string }> = {}
  for (const plan of mealPlans ?? []) {
    const recipe = (plan as any).recipes
    for (const ing of recipe?.ingredients ?? []) {
      const key = `${ing.name}__${ing.unit}`
      if (itemsMap[key]) {
        itemsMap[key].amount += (ing.amount ?? 0) * plan.servings
      } else {
        itemsMap[key] = { name: ing.name, amount: (ing.amount ?? 0) * plan.servings, unit: ing.unit }
      }
    }
  }

  const items = Object.values(itemsMap).map(item => ({
    user_id: user.id,
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    is_checked: false,
  }))

  const { error: insertError } = await supabase.from('shopping_list_items').insert(items)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ inserted: items.length })
}

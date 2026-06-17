export type Recipe = {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  prep_time: number | null
  cook_time: number | null
  servings: number
  cuisine: string | null
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
  ingredients?: Ingredient[]
  steps?: Step[]
}

export type Ingredient = {
  id: string
  recipe_id: string
  name: string
  amount: number | null
  unit: string | null
  sort_order: number
}

export type Step = {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
}

export type MealPlan = {
  id: string
  user_id: string
  recipe_id: string
  planned_date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  servings: number
  notes: string | null
  recipe?: Recipe
}

export type ShoppingItem = {
  id: string
  user_id: string
  name: string
  amount: number | null
  unit: string | null
  is_checked: boolean
  source_meal_plan_id: string | null
}

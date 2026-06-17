import { z } from 'zod'

export const mealPlanSchema = z.object({
  recipe_id:    z.string().uuid(),
  planned_date: z.string(),
  meal_type:    z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings:     z.number().min(1).default(2),
  notes:        z.string().optional(),
})

export type MealPlanFormValues = z.infer<typeof mealPlanSchema>

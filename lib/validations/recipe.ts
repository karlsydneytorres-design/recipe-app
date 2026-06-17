import { z } from 'zod'

export const ingredientSchema = z.object({
  name:       z.string().min(1, 'Ingredient name is required'),
  amount:     z.number().positive().optional(),
  unit:       z.string().optional(),
  sort_order: z.number().default(0),
})

export const stepSchema = z.object({
  step_number: z.number(),
  instruction: z.string().min(1, 'Instruction is required'),
})

export const recipeSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  prep_time:   z.number().min(0).optional(),
  cook_time:   z.number().min(0).optional(),
  servings:    z.number().min(1).default(2),
  cuisine:     z.string().optional(),
  tags:        z.array(z.string()).default([]),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
  steps:       z.array(stepSchema).min(1, 'Add at least one step'),
})

export type RecipeFormValues = z.infer<typeof recipeSchema>

'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NutritionLookup } from './NutritionLookup'
import { scaleNutrition, NutritionResult } from '@/lib/nutrition'

type Ingredient = {
  name: string; amount: string; unit: string
  calories: string; protein: string; carbs: string; fat: string; fiber: string; sugar: string
}
type Step = { instruction: string }

type RecipeFormValues = {
  title: string
  description: string
  prep_time: string
  cook_time: string
  servings: string
  cuisine: string
  tags: string
  ingredients: Ingredient[]
  steps: Step[]
}

const emptyIngredient: Ingredient = {
  name: '', amount: '', unit: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '',
}

export function RecipeForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [expandedNutrition, setExpandedNutrition] = useState<Set<number>>(new Set())

  // Stores the raw per-100g nutrition data from the last lookup, per ingredient index.
  // When amount/unit changes later, we re-scale from this instead of stale baked-in numbers.
  const [rawNutritionByIndex, setRawNutritionByIndex] = useState<Record<number, NutritionResult>>({})

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<RecipeFormValues>({
      defaultValues: {
        title: '', description: '', prep_time: '', cook_time: '', servings: '2', cuisine: '', tags: '',
        ingredients: [{ ...emptyIngredient }],
        steps: [{ instruction: '' }],
      },
    })

  const { fields: ingredientFields, append: addIngredient, remove: removeIngredient } =
    useFieldArray({ control, name: 'ingredients' })
  const { fields: stepFields, append: addStep, remove: removeStep } =
    useFieldArray({ control, name: 'steps' })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const toggleNutritionPanel = (index: number) => {
    setExpandedNutrition(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  // Called when the user picks a result from the NutritionLookup dropdown.
  // We save the raw per-100g data AND compute the initial scaled values.
  const applyNutrition = (index: number, raw: NutritionResult) => {
    setRawNutritionByIndex(prev => ({ ...prev, [index]: raw }))

    const amount = parseFloat(watch(`ingredients.${index}.amount`)) || 1
    const unit = watch(`ingredients.${index}.unit`) || 'g'
    const scaled = scaleNutrition(raw, amount, unit)

    setValue(`ingredients.${index}.calories`, scaled.calories.toString())
    setValue(`ingredients.${index}.protein`, scaled.protein.toString())
    setValue(`ingredients.${index}.carbs`, scaled.carbs.toString())
    setValue(`ingredients.${index}.fat`, scaled.fat.toString())
    setValue(`ingredients.${index}.fiber`, scaled.fiber.toString())
    setValue(`ingredients.${index}.sugar`, scaled.sugar.toString())
    setExpandedNutrition(prev => new Set(prev).add(index))
  }

  // Watch all ingredients so we can react to amount/unit edits
  const watchedIngredients = watch('ingredients')

  // Re-scale nutrition automatically whenever amount or unit changes for any
  // ingredient that has raw lookup data attached.
  useEffect(() => {
    Object.entries(rawNutritionByIndex).forEach(([idxStr, raw]) => {
      const index = parseInt(idxStr)
      const ing = watchedIngredients[index]
      if (!ing) return

      const amount = parseFloat(ing.amount) || 1
      const unit = ing.unit || 'g'
      const scaled = scaleNutrition(raw, amount, unit)

      // Only update if the values actually differ, to avoid an infinite render loop
      if (ing.calories !== scaled.calories.toString()) {
        setValue(`ingredients.${index}.calories`, scaled.calories.toString())
        setValue(`ingredients.${index}.protein`, scaled.protein.toString())
        setValue(`ingredients.${index}.carbs`, scaled.carbs.toString())
        setValue(`ingredients.${index}.fat`, scaled.fat.toString())
        setValue(`ingredients.${index}.fiber`, scaled.fiber.toString())
        setValue(`ingredients.${index}.sugar`, scaled.sugar.toString())
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedIngredients.map(i => ({ amount: i.amount, unit: i.unit })))])

  const totals = watchedIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (parseFloat(ing.calories) || 0),
      protein: acc.protein + (parseFloat(ing.protein) || 0),
      carbs: acc.carbs + (parseFloat(ing.carbs) || 0),
      fat: acc.fat + (parseFloat(ing.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const onSubmit = async (values: RecipeFormValues) => {
    setServerError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setServerError('Not logged in'); return }

    let image_url: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('recipe-images').upload(path, imageFile)
      if (uploadError) { setServerError('Image upload failed: ' + uploadError.message); return }
      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: values.title,
        description: values.description || null,
        prep_time: values.prep_time ? parseInt(values.prep_time) : null,
        cook_time: values.cook_time ? parseInt(values.cook_time) : null,
        servings: values.servings ? parseInt(values.servings) : 2,
        cuisine: values.cuisine || null,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        image_url,
      })
      .select()
      .single()

    if (recipeError) { setServerError(recipeError.message); return }

    const validIngredients = values.ingredients.filter(i => i.name.trim())
    if (validIngredients.length > 0) {
      const { error: ingError } = await supabase.from('ingredients').insert(
        validIngredients.map((ing, i) => ({
          recipe_id: recipe.id,
          name: ing.name,
          amount: ing.amount ? parseFloat(ing.amount) : null,
          unit: ing.unit || null,
          sort_order: i,
          calories: ing.calories ? parseFloat(ing.calories) : null,
          protein:  ing.protein  ? parseFloat(ing.protein)  : null,
          carbs:    ing.carbs    ? parseFloat(ing.carbs)    : null,
          fat:      ing.fat      ? parseFloat(ing.fat)      : null,
          fiber:    ing.fiber    ? parseFloat(ing.fiber)    : null,
          sugar:    ing.sugar    ? parseFloat(ing.sugar)    : null,
        }))
      )
      if (ingError) { setServerError(ingError.message); return }
    }

    const validSteps = values.steps.filter(s => s.instruction.trim())
    if (validSteps.length > 0) {
      const { error: stepError } = await supabase.from('steps').insert(
        validSteps.map((step, i) => ({ recipe_id: recipe.id, step_number: i + 1, instruction: step.instruction }))
      )
      if (stepError) { setServerError(stepError.message); return }
    }

    router.push('/recipes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-gray-800">Basic Info</h2>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Photo</label>
          {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />}
          <input type="file" accept="image/*" onChange={handleImageChange}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Title *</label>
          <input {...register('title', { required: 'Title is required' })} placeholder="e.g. Spaghetti Carbonara"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea {...register('description')} placeholder="Brief description..." rows={3}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Prep (min)</label>
            <input {...register('prep_time')} type="number" min="0" placeholder="15"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cook (min)</label>
            <input {...register('cook_time')} type="number" min="0" placeholder="30"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Servings</label>
            <input {...register('servings')} type="number" min="1" placeholder="2"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cuisine</label>
            <input {...register('cuisine')} placeholder="e.g. Italian, Filipino"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <input {...register('tags')} placeholder="quick, vegetarian, dinner"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p className="text-xs text-gray-400">Comma separated</p>
          </div>
        </div>
      </section>

      {/* Ingredients + Nutrition */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Ingredients</h2>
          <p className="text-xs text-gray-400">Click 🔍 Nutrition to auto-fill from Open Food Facts</p>
        </div>

        {ingredientFields.map((field, index) => (
          <div key={field.id} className="border border-gray-100 rounded-xl p-3">
            <div className="flex gap-2 items-center">
              <input {...register(`ingredients.${index}.name`)} placeholder="Ingredient name"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input {...register(`ingredients.${index}.amount`)} placeholder="Amount" type="number" step="any"
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input {...register(`ingredients.${index}.unit`)} placeholder="Unit"
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />

              <NutritionLookup
                ingredientName={watchedIngredients[index]?.name ?? ''}
                onApply={(raw) => applyNutrition(index, raw)}
              />

              <button type="button" onClick={() => toggleNutritionPanel(index)}
                className="text-xs text-gray-400 hover:text-gray-600 px-1.5 transition-colors">
                {expandedNutrition.has(index) ? '▲' : '▼'}
              </button>

              <button type="button" onClick={() => removeIngredient(index)}
                className="text-gray-300 hover:text-red-400 text-xl transition-colors">×</button>
            </div>

            {rawNutritionByIndex[index] && (
              <p className="text-[11px] text-green-600 mt-2">
                ✓ Linked to "{rawNutritionByIndex[index].productName}" — values auto-update when you change amount/unit
              </p>
            )}

            {expandedNutrition.has(index) && (
              <div className="grid grid-cols-6 gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] text-gray-400">Calories</label>
                  <input {...register(`ingredients.${index}.calories`)} type="number" step="any" placeholder="0"
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] text-gray-400">Protein (g)</label>
                  <input {...register(`ingredients.${index}.protein`)} type="number" step="any" placeholder="0"
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] text-gray-400">Carbs (g)</label>
                  <input {...register(`ingredients.${index}.carbs`)} type="number" step="any" placeholder="0"
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] text-gray-400">Fat (g)</label>
                  <input {...register(`ingredients.${index}.fat`)} type="number" step="any" placeholder="0"
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] text-gray-400">Fiber (g)</label>
                  <input {...register(`ingredients.${index}.fiber`)} type="number" step="any" placeholder="0"
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] text-gray-400">Sugar (g)</label>
                  <input {...register(`ingredients.${index}.sugar`)} type="number" step="any" placeholder="0"
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={() => addIngredient({ ...emptyIngredient })}
          className="text-sm text-green-600 font-medium hover:text-green-700 text-left">
          + Add Ingredient
        </button>

        {(totals.calories > 0 || totals.protein > 0) && (
          <div className="grid grid-cols-4 gap-3 mt-2 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-400">Total Calories</p>
              <p className="text-sm font-semibold text-gray-800">{Math.round(totals.calories)} kcal</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Protein</p>
              <p className="text-sm font-semibold text-gray-800">{Math.round(totals.protein)} g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Carbs</p>
              <p className="text-sm font-semibold text-gray-800">{Math.round(totals.carbs)} g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Fat</p>
              <p className="text-sm font-semibold text-gray-800">{Math.round(totals.fat)} g</p>
            </div>
          </div>
        )}
      </section>

      {/* Steps */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Instructions</h2>
        {stepFields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-start">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-2">
              {index + 1}
            </span>
            <textarea {...register(`steps.${index}.instruction`)} placeholder={`Describe step ${index + 1}...`} rows={2}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            <button type="button" onClick={() => removeStep(index)}
              className="text-gray-300 hover:text-red-400 text-xl transition-colors mt-2">×</button>
          </div>
        ))}
        <button type="button" onClick={() => addStep({ instruction: '' })}
          className="text-sm text-green-600 font-medium hover:text-green-700 text-left">
          + Add Step
        </button>
      </section>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{serverError}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting}
          className="bg-green-600 text-white rounded-lg px-8 py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Recipe'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-200 text-gray-600 rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
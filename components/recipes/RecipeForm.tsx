'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ingredient = { name: string; amount: string; unit: string }
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

export function RecipeForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm<RecipeFormValues>({
      defaultValues: {
        title: '',
        description: '',
        prep_time: '',
        cook_time: '',
        servings: '2',
        cuisine: '',
        tags: '',
        ingredients: [{ name: '', amount: '', unit: '' }],
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

  const onSubmit = async (values: RecipeFormValues) => {
    setServerError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setServerError('Not logged in'); return }

    let image_url: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(path, imageFile)
      if (uploadError) { setServerError('Image upload failed: ' + uploadError.message); return }
      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id:     user.id,
        title:       values.title,
        description: values.description || null,
        prep_time:   values.prep_time ? parseInt(values.prep_time) : null,
        cook_time:   values.cook_time ? parseInt(values.cook_time) : null,
        servings:    values.servings ? parseInt(values.servings) : 2,
        cuisine:     values.cuisine || null,
        tags:        values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        image_url,
      })
      .select()
      .single()

    if (recipeError) { setServerError(recipeError.message); return }

    const validIngredients = values.ingredients.filter(i => i.name.trim())
    if (validIngredients.length > 0) {
      const { error: ingError } = await supabase.from('ingredients').insert(
        validIngredients.map((ing, i) => ({
          recipe_id:  recipe.id,
          name:       ing.name,
          amount:     ing.amount ? parseFloat(ing.amount) : null,
          unit:       ing.unit || null,
          sort_order: i,
        }))
      )
      if (ingError) { setServerError(ingError.message); return }
    }

    const validSteps = values.steps.filter(s => s.instruction.trim())
    if (validSteps.length > 0) {
      const { error: stepError } = await supabase.from('steps').insert(
        validSteps.map((step, i) => ({
          recipe_id:   recipe.id,
          step_number: i + 1,
          instruction: step.instruction,
        }))
      )
      if (stepError) { setServerError(stepError.message); return }
    }

    router.push('/recipes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-gray-800">Basic Info</h2>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Photo</label>
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />
          )}
          <input type="file" accept="image/*" onChange={handleImageChange}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Title *</label>
          <input {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Spaghetti Carbonara"
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

      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Ingredients</h2>
        {ingredientFields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-center">
            <input {...register(`ingredients.${index}.name`)} placeholder="Ingredient name"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input {...register(`ingredients.${index}.amount`)} placeholder="Amount"
              className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input {...register(`ingredients.${index}.unit`)} placeholder="Unit"
              className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button type="button" onClick={() => removeIngredient(index)}
              className="text-gray-300 hover:text-red-400 text-xl transition-colors">×</button>
          </div>
        ))}
        <button type="button" onClick={() => addIngredient({ name: '', amount: '', unit: '' })}
          className="text-sm text-green-600 font-medium hover:text-green-700 text-left">
          + Add Ingredient
        </button>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Instructions</h2>
        {stepFields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-start">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-2">
              {index + 1}
            </span>
            <textarea {...register(`steps.${index}.instruction`)}
              placeholder={`Describe step ${index + 1}...`} rows={2}
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
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting}
          className="bg-green-600 text-white rounded-lg px-8 py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
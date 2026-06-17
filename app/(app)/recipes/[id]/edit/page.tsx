'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'

type Ingredient = { id?: string; name: string; amount: string; unit: string }
type Step = { id?: string; instruction: string }

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

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<RecipeFormValues>({
      defaultValues: {
        title: '', description: '', prep_time: '', cook_time: '',
        servings: '2', cuisine: '', tags: '',
        ingredients: [{ name: '', amount: '', unit: '' }],
        steps: [{ instruction: '' }],
      },
    })

  const { fields: ingredientFields, append: addIngredient, remove: removeIngredient } =
    useFieldArray({ control, name: 'ingredients' })
  const { fields: stepFields, append: addStep, remove: removeStep } =
    useFieldArray({ control, name: 'steps' })

  useEffect(() => {
    const loadRecipe = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('recipes')
        .select('*, ingredients(*), steps(*)')
        .eq('id', id)
        .single()

      if (data) {
        setExistingImageUrl(data.image_url)
        const sortedIngredients = [...(data.ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order)
        const sortedSteps = [...(data.steps ?? [])].sort((a, b) => a.step_number - b.step_number)

        reset({
          title: data.title ?? '',
          description: data.description ?? '',
          prep_time: data.prep_time?.toString() ?? '',
          cook_time: data.cook_time?.toString() ?? '',
          servings: data.servings?.toString() ?? '2',
          cuisine: data.cuisine ?? '',
          tags: (data.tags ?? []).join(', '),
          ingredients: sortedIngredients.length > 0
            ? sortedIngredients.map((i: any) => ({ id: i.id, name: i.name, amount: i.amount?.toString() ?? '', unit: i.unit ?? '' }))
            : [{ name: '', amount: '', unit: '' }],
          steps: sortedSteps.length > 0
            ? sortedSteps.map((s: any) => ({ id: s.id, instruction: s.instruction }))
            : [{ instruction: '' }],
        })
      }
      setLoading(false)
    }
    loadRecipe()
  }, [id, reset])

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

    let image_url = existingImageUrl
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('recipe-images').upload(path, imageFile)
      if (uploadError) { setServerError('Image upload failed: ' + uploadError.message); return }
      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        title: values.title,
        description: values.description || null,
        prep_time: values.prep_time ? parseInt(values.prep_time) : null,
        cook_time: values.cook_time ? parseInt(values.cook_time) : null,
        servings: values.servings ? parseInt(values.servings) : 2,
        cuisine: values.cuisine || null,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        image_url,
      })
      .eq('id', id)

    if (recipeError) { setServerError(recipeError.message); return }

    // Replace ingredients: delete old, insert new
    await supabase.from('ingredients').delete().eq('recipe_id', id)
    const validIngredients = values.ingredients.filter(i => i.name.trim())
    if (validIngredients.length > 0) {
      const { error } = await supabase.from('ingredients').insert(
        validIngredients.map((ing, i) => ({
          recipe_id: id, name: ing.name,
          amount: ing.amount ? parseFloat(ing.amount) : null,
          unit: ing.unit || null, sort_order: i,
        }))
      )
      if (error) { setServerError(error.message); return }
    }

    // Replace steps: delete old, insert new
    await supabase.from('steps').delete().eq('recipe_id', id)
    const validSteps = values.steps.filter(s => s.instruction.trim())
    if (validSteps.length > 0) {
      const { error } = await supabase.from('steps').insert(
        validSteps.map((step, i) => ({ recipe_id: id, step_number: i + 1, instruction: step.instruction }))
      )
      if (error) { setServerError(error.message); return }
    }

    router.push(`/recipes/${id}`)
    router.refresh()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-gray-400 text-sm">Loading recipe...</p></div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
        <p className="text-sm text-gray-500 mt-1">Update the details below and save your changes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

        <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-5">
          <h2 className="font-semibold text-gray-800">Basic Info</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Photo</label>
            {(imagePreview || existingImageUrl) && (
              <img src={imagePreview ?? existingImageUrl ?? ''} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <input {...register('title', { required: 'Title is required' })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea {...register('description')} rows={3}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Prep (min)</label>
              <input {...register('prep_time')} type="number" min="0"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Cook (min)</label>
              <input {...register('cook_time')} type="number" min="0"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Servings</label>
              <input {...register('servings')} type="number" min="1"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Cuisine</label>
              <input {...register('cuisine')}
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
            className="text-sm text-green-600 font-medium hover:text-green-700 text-left">+ Add Ingredient</button>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">Instructions</h2>
          {stepFields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start">
              <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-2">
                {index + 1}
              </span>
              <textarea {...register(`steps.${index}.instruction`)} rows={2}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <button type="button" onClick={() => removeStep(index)}
                className="text-gray-300 hover:text-red-400 text-xl transition-colors mt-2">×</button>
            </div>
          ))}
          <button type="button" onClick={() => addStep({ instruction: '' })}
            className="text-sm text-green-600 font-medium hover:text-green-700 text-left">+ Add Step</button>
        </section>

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{serverError}</p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting}
            className="bg-green-600 text-white rounded-lg px-8 py-2.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-gray-200 text-gray-600 rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
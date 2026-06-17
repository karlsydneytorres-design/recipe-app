'use client'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recipeSchema, RecipeFormValues } from '@/lib/validations/recipe'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { IngredientFields } from './IngredientFields'
import { StepFields } from './StepFields'
import { useRouter } from 'next/navigation'

export function RecipeForm() {
  const router = useRouter()
  const methods = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { servings: 2, tags: [], ingredients: [{ name: '', sort_order: 0 }], steps: [{ step_number: 1, instruction: '' }] },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = methods

  const onSubmit = async (values: RecipeFormValues) => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) router.push('/recipes')
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
        <Input label="Recipe Title" placeholder="e.g. Spaghetti Carbonara" error={errors.title?.message} {...register('title')} />
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea placeholder="Brief description..." {...register('description')} rows={3}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Prep Time (min)" type="number" {...register('prep_time', { valueAsNumber: true })} />
          <Input label="Cook Time (min)" type="number" {...register('cook_time', { valueAsNumber: true })} />
          <Input label="Servings" type="number" {...register('servings', { valueAsNumber: true })} />
        </div>
        <Input label="Cuisine" placeholder="e.g. Italian, Filipino" {...register('cuisine')} />
        <IngredientFields />
        <StepFields />
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? 'Saving...' : 'Save Recipe'}
        </Button>
      </form>
    </FormProvider>
  )
}

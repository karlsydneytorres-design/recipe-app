'use client'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function IngredientFields() {
  const { register, control, formState: { errors } } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">Ingredients</label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <Input placeholder="e.g. Chicken breast" {...register(`ingredients.${index}.name`)} className="flex-1" />
          <Input placeholder="Amount" type="number" {...register(`ingredients.${index}.amount`, { valueAsNumber: true })} className="w-24" />
          <Input placeholder="Unit" {...register(`ingredients.${index}.unit`)} className="w-20" />
          <Button variant="ghost" size="sm" type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 mt-0.5">✕</Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" type="button" onClick={() => append({ name: '', amount: undefined, unit: '', sort_order: fields.length })}>
        + Add Ingredient
      </Button>
    </div>
  )
}

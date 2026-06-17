'use client'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/Button'

export function StepFields() {
  const { register, control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'steps' })

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">Instructions</label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-2">{index + 1}</span>
          <textarea
            placeholder={`Step ${index + 1}`}
            {...register(`steps.${index}.instruction`)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={2}
          />
          <Button variant="ghost" size="sm" type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 mt-2">✕</Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" type="button" onClick={() => append({ step_number: fields.length + 1, instruction: '' })}>
        + Add Step
      </Button>
    </div>
  )
}

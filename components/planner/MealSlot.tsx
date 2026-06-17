'use client'
import { useState } from 'react'
import { AddMealModal } from './AddMealModal'

interface MealSlotProps {
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export function MealSlot({ date, mealType }: MealSlotProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full min-h-[60px] rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs hover:border-green-400 hover:text-green-500 hover:bg-green-50 transition-colors p-2 flex items-center justify-center"
      >
        + Add
      </button>
      <AddMealModal isOpen={modalOpen} onClose={() => setModalOpen(false)} date={date} mealType={mealType} />
    </>
  )
}

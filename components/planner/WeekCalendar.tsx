'use client'
import { useState } from 'react'
import { addDays, startOfWeek, format } from 'date-fns'
import { MealSlot } from './MealSlot'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export function WeekCalendar() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setCurrentWeek(d => addDays(d, -7))} className="px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50">← Prev</button>
        <span className="font-medium">{format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, 6), 'MMM d, yyyy')}</span>
        <button onClick={() => setCurrentWeek(d => addDays(d, 7))} className="px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50">Next →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-24 text-left text-xs text-gray-500 font-medium py-2 pr-3">Meal</th>
              {days.map(day => (
                <th key={day.toISOString()} className="text-center text-sm font-medium py-2 px-2 min-w-[120px]">
                  <div className="text-gray-500 text-xs">{format(day, 'EEE')}</div>
                  <div className="text-gray-900">{format(day, 'd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map(mealType => (
              <tr key={mealType} className="border-t border-gray-100">
                <td className="text-xs text-gray-500 font-medium capitalize py-2 pr-3">{mealType}</td>
                {days.map(day => (
                  <td key={day.toISOString()} className="py-2 px-1">
                    <MealSlot date={format(day, 'yyyy-MM-dd')} mealType={mealType} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { searchOpenFoodFacts, NutritionResult } from '@/lib/nutrition'

interface NutritionLookupProps {
  ingredientName: string
  onApply: (result: NutritionResult) => void
}

export function NutritionLookup({ ingredientName, onApply }: NutritionLookupProps) {
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<NutritionResult[]>([])
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!ingredientName.trim()) {
      setError('Type an ingredient name first')
      setOpen(true)
      return
    }
    setOpen(true)
    setSearching(true)
    setError('')
    try {
      const data = await searchOpenFoodFacts(ingredientName)
      setResults(data)
      if (data.length === 0) setError('No matches found. Try a simpler search term, or enter values manually.')
    } catch {
      setError('Lookup failed. You can enter values manually instead.')
    }
    setSearching(false)
  }

  const handlePick = (result: NutritionResult) => {
    onApply(result) // pass the raw per-100g result back up; the form does the scaling
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSearch}
        title="Look up nutrition from Open Food Facts"
        className="text-xs text-gray-400 hover:text-green-600 border border-gray-200 hover:border-green-300 rounded-lg px-2 py-1 transition-colors shrink-0"
      >
        🔍 Nutrition
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 right-0 w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">Results for "{ingredientName}"</p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 text-sm">×</button>
          </div>

          {searching && <p className="text-xs text-gray-400 py-3 text-center">Searching...</p>}
          {!searching && error && <p className="text-xs text-amber-600 py-2">{error}</p>}

          {!searching && results.length > 0 && (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePick(r)}
                  className="text-left px-2.5 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-800 truncate">{r.productName}</p>
                  <p className="text-[11px] text-gray-400">
                    {r.brand ? `${r.brand} · ` : ''}{r.calories_per_100g ?? '?'} kcal / 100g
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
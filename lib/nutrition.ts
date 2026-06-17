// Open Food Facts search helper — 100% free, no API key required.
// Docs: https://wiki.openfoodfacts.org/API

export type NutritionResult = {
  productName: string
  brand: string | null
  // All values are per 100g, as returned by Open Food Facts
  calories_per_100g: number | null
  protein_per_100g: number | null
  carbs_per_100g: number | null
  fat_per_100g: number | null
  fiber_per_100g: number | null
  sugar_per_100g: number | null
}

export async function searchOpenFoodFacts(query: string): Promise<NutritionResult[]> {
  if (!query.trim()) return []

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=8`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to search Open Food Facts')
  const data = await res.json()

  return (data.products ?? [])
    .filter((p: any) => p.nutriments) // skip entries with no nutrition data at all
    .map((p: any) => ({
      productName: p.product_name || p.generic_name || 'Unnamed product',
      brand: p.brands || null,
      calories_per_100g: p.nutriments['energy-kcal_100g'] ?? null,
      protein_per_100g:  p.nutriments['proteins_100g'] ?? null,
      carbs_per_100g:    p.nutriments['carbohydrates_100g'] ?? null,
      fat_per_100g:      p.nutriments['fat_100g'] ?? null,
      fiber_per_100g:    p.nutriments['fiber_100g'] ?? null,
      sugar_per_100g:    p.nutriments['sugars_100g'] ?? null,
    }))
}

// Convert per-100g values to an actual amount + unit.
// This is an approximation: we treat any non-gram unit as roughly grams
// (good enough for an intermediate project; a production app would need
// a proper unit-conversion table per ingredient).
export function scaleNutrition(
  result: NutritionResult,
  amount: number,
  unit: string
): { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number } {
  // Rough unit-to-gram conversion for common cooking units.
  const gramsPerUnit: Record<string, number> = {
    g: 1, gram: 1, grams: 1,
    kg: 1000,
    ml: 1, l: 1000, // assumes density ~1 (true for water-based liquids, an approximation otherwise)
    tsp: 5, tbsp: 15,
    cup: 240,
    oz: 28.35,
    lb: 453.6,
    pinch: 0.5,
  }

  const grams = amount * (gramsPerUnit[unit?.toLowerCase()] ?? 1)
  const ratio = grams / 100

  return {
    calories: round((result.calories_per_100g ?? 0) * ratio),
    protein:  round((result.protein_per_100g ?? 0) * ratio),
    carbs:    round((result.carbs_per_100g ?? 0) * ratio),
    fat:      round((result.fat_per_100g ?? 0) * ratio),
    fiber:    round((result.fiber_per_100g ?? 0) * ratio),
    sugar:    round((result.sugar_per_100g ?? 0) * ratio),
  }
}

function round(n: number) {
  return Math.round(n * 10) / 10
}
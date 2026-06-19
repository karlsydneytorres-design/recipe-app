// USDA FoodData Central search helper — 100% free, requires a free API key.
// Get a key at: https://api.data.gov/signup/
// Docs: https://fdc.nal.usda.gov/api-guide.html

export type NutritionResult = {
  productName: string
  brand: string | null
  // All values are per 100g, matching USDA's standard reporting basis
  calories_per_100g: number | null
  protein_per_100g: number | null
  carbs_per_100g: number | null
  fat_per_100g: number | null
  fiber_per_100g: number | null
  sugar_per_100g: number | null
}

const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
}

export async function searchOpenFoodFacts(query: string): Promise<NutritionResult[]> {
  // Function name kept the same so the rest of the app (NutritionLookup.tsx) doesn't need changes.
  if (!query.trim()) return []

  const apiKey = process.env.NEXT_PUBLIC_USDA_API_KEY
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_USDA_API_KEY in .env.local')
  }

  // dataType filter prioritizes whole/raw foods (Foundation, SR Legacy) over heavily
  // processed branded products, which gives much better matches for recipe ingredients.
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}&dataType=Foundation,SR Legacy,Survey (FNDDS)&pageSize=8`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to search USDA FoodData Central')
  const data = await res.json()

  return (data.foods ?? []).map((food: any) => {
    const getNutrient = (id: number) => {
      const match = food.foodNutrients?.find((n: any) => n.nutrientId === id)
      return match?.value ?? null
    }

    return {
      productName: food.description || 'Unnamed food',
      brand: food.brandOwner || null,
      calories_per_100g: getNutrient(NUTRIENT_IDS.calories),
      protein_per_100g:  getNutrient(NUTRIENT_IDS.protein),
      carbs_per_100g:    getNutrient(NUTRIENT_IDS.carbs),
      fat_per_100g:      getNutrient(NUTRIENT_IDS.fat),
      fiber_per_100g:    getNutrient(NUTRIENT_IDS.fiber),
      sugar_per_100g:    getNutrient(NUTRIENT_IDS.sugar),
    }
  })
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
  const gramsPerUnit: Record<string, number> = {
    g: 1, gram: 1, grams: 1,
    kg: 1000,
    ml: 1, l: 1000,
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
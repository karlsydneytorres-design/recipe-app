import Link from 'next/link'
import { Recipe } from '@/types'
import { Badge } from '@/components/ui/Badge'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {recipe.image_url
        ? <img src={recipe.image_url} alt={recipe.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-4xl">🍽️</div>
      }
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{recipe.title}</h3>
        {recipe.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {totalTime > 0 && <Badge label={`${totalTime} min`} color="gray" />}
          {recipe.cuisine && <Badge label={recipe.cuisine} color="blue" />}
          {recipe.tags?.slice(0, 2).map(tag => <Badge key={tag} label={tag} color="green" />)}
        </div>
      </div>
    </Link>
  )
}

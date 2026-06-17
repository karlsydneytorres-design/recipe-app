// TODO: Show recipe detail
export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Recipe Detail</h1>
      <p className="text-gray-500">ID: {params.id}</p>
    </div>
  )
}

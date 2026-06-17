// TODO: Edit recipe form
export default function EditRecipePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Edit Recipe</h1>
      <p className="text-gray-500">Editing ID: {params.id}</p>
    </div>
  )
}

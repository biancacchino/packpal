interface Params {
  params: { id: string };
}

export default function TripDetailPage({ params }: Params) {
  const { id } = params;
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Trip Details</h1>
        <div className="text-stone-300 mb-6">Trip ID: {id}</div>
        <div className="rounded-xl border border-stone-700 bg-stone-800 p-4">
          <p className="text-stone-200">This is a placeholder trip page. The floating chat can help refine your packing list while you edit trip details.</p>
        </div>
      </div>
    </div>
  );
}

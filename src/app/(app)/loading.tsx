export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-gray-800 rounded-lg" />
          <div className="h-7 w-40 bg-gray-800 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-gray-800 rounded-xl" />
      </div>

      {/* Insight card skeleton */}
      <div className="h-24 bg-gray-900 border border-gray-800 rounded-2xl" />

      {/* Macro bars skeleton */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-gray-800 rounded" />
              <div className="h-3 w-12 bg-gray-800 rounded" />
            </div>
            <div className="h-2 bg-gray-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-900 border border-gray-800 rounded-2xl" />
        <div className="h-64 bg-gray-900 border border-gray-800 rounded-2xl" />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-gray-900 border border-gray-800 rounded-2xl" />
        <div className="h-56 bg-gray-900 border border-gray-800 rounded-2xl" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-36 bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="h-5 w-24 bg-gray-800 rounded mb-4" />
            <div className="h-40 bg-gray-800 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="h-5 w-36 bg-gray-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

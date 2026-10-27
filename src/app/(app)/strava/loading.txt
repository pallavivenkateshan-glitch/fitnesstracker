export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-7 w-48 bg-gray-800 rounded-lg mb-6" />
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-800 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-gray-800 rounded" />
              <div className="h-3 w-52 bg-gray-800 rounded" />
            </div>
          </div>
          <div className="h-10 w-28 bg-gray-800 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-40 bg-gray-800 rounded" />
                  <div className="h-3 w-20 bg-gray-800 rounded" />
                </div>
                <div className="h-3 w-64 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

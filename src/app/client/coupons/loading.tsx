export default function LoadingCoupons() {
  return (
    <section className="px-4 py-6 space-y-6">
      <div className="h-6 w-40 bg-gray-100 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 p-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-5 w-16 bg-gray-100 rounded" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
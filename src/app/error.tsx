'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Something went wrong</h2>
        <p className="text-surface-500 mb-4">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

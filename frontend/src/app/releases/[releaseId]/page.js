export default function ReleaseDetailPage({ params }) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Release Detail</h1>
          <p className="text-gray-600">Release ID: {params.releaseId}</p>
          <p className="text-gray-500 mt-4">Coming in Step 4!</p>
        </div>
      </div>
    )
  }
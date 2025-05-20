import Image from "next/image"

export default function DashboardPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Data Analytics</h2>
          <Image
            src="/data-analytics.png"
            alt="Data analytics dashboard"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="text-gray-600 mt-2">Overview of key performance indicators and data trends.</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Sales Performance</h2>
          <Image
            src="/sales-performance.png"
            alt="Sales performance chart"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="text-gray-600 mt-2">Track sales metrics and identify top-performing products.</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Customer Engagement</h2>
          <Image
            src="/customer-engagement.png"
            alt="Customer engagement metrics"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="text-gray-600 mt-2">Analyze customer interactions and improve engagement strategies.</p>
        </div>
      </section>
    </main>
  )
}

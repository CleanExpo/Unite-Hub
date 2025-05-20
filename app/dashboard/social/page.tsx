import Image from "next/image"

export default function SocialDashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Social Media Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Example Card 1 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Engagement Overview</h2>
          <Image
            src="/digital-marketing.png"
            alt="Digital marketing dashboard"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="text-gray-600 mt-2">Track your social media engagement metrics.</p>
        </div>

        {/* Example Card 2 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Audience Growth</h2>
          <Image
            src="/digital-marketing.png"
            alt="Digital marketing dashboard"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="text-gray-600 mt-2">Monitor your follower growth over time.</p>
        </div>

        {/* Example Card 3 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Top Performing Posts</h2>
          <Image
            src="/digital-marketing.png"
            alt="Digital marketing dashboard"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="text-gray-600 mt-2">Identify your most successful content.</p>
        </div>
      </div>
    </div>
  )
}

import type React from "react"

interface PodcastSectionProps {
  title: string
  podcasts: {
    id: string
    title: string
    description: string
    imageUrl: string
    audioUrl: string
  }[]
}

const PodcastSection: React.FC<PodcastSectionProps> = ({ title, podcasts }) => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-centre">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <div key={podcast.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={podcast.imageUrl || "/placeholder.svg"}
                alt={podcast.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{podcast.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{podcast.description}</p>
                <audio controls src={podcast.audioUrl} className="w-full"></audio>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PodcastSection

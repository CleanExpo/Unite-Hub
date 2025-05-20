import type React from "react"

interface CaseStudy {
  title: string
  description: string
  imageUrl: string
  organisation: string
  link: string
}

interface CaseStudiesProps {
  caseStudies: CaseStudy[]
}

const CaseStudies: React.FC<CaseStudiesProps> = ({ caseStudies }) => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-centre">Our Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((caseStudy, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={caseStudy.imageUrl || "/placeholder.svg"}
                alt={caseStudy.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{caseStudy.title}</h3>
                <p className="text-gray-600 mb-4">{caseStudy.description}</p>
                <p className="text-gray-700 font-medium">Organisation: {caseStudy.organisation}</p>
                <a
                  href={caseStudy.link}
                  className="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CaseStudies

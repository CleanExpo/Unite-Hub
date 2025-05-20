import type React from "react"

interface Testimonial {
  name: string
  organisation: string
  testimonial: string
  image: string
}

const Testimonials: React.FC<{ testimonials: Testimonial[] }> = ({ testimonials }) => {
  return (
    <section className="bg-gray-100 py-12">
      <div className="container mx-auto text-centre">
        <h2 className="text-3xl font-semibold mb-8">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-centre mb-4">
                <img
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <h3 className="text-lg font-semibold">{testimonial.name}</h3>
                  <p className="text-gray-600">{testimonial.organisation}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.testimonial}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials

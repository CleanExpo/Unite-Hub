import type React from "react"

interface Service {
  title: string
  description: string
  icon: React.ReactNode
}

interface ServicesListProps {
  services: Service[]
}

const ServicesList: React.FC<ServicesListProps> = ({ services }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <span className="mr-3 text-3xl text-indigo-600">{service.icon}</span>
            <h3 className="text-xl font-semibold text-gray-800">{service.title}</h3>
          </div>
          <p className="text-gray-600">{service.description}</p>
        </div>
      ))}
    </div>
  )
}

export default ServicesList

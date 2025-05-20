import Image from "next/image"

const ServicesList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Service 1 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Image
          src="/tech-solution.png"
          alt="Technology solutions"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
        <h3 className="text-xl font-semibold mt-2">Technology Solutions</h3>
        <p className="text-gray-600">
          We provide cutting-edge technology solutions to help your business thrive in the digital age.
        </p>
      </div>

      {/* Service 2 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Image
          src="/tech-solution.png"
          alt="Technology solutions"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
        <h3 className="text-xl font-semibold mt-2">Digital Marketing</h3>
        <p className="text-gray-600">Boost your online presence with our comprehensive digital marketing services.</p>
      </div>

      {/* Service 3 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Image
          src="/tech-solution.png"
          alt="Technology solutions"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
        <h3 className="text-xl font-semibold mt-2">Cloud Computing</h3>
        <p className="text-gray-600">
          Leverage the power of the cloud with our scalable and secure cloud computing solutions.
        </p>
      </div>

      {/* Service 4 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Image
          src="/tech-solution.png"
          alt="Technology solutions"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
        <h3 className="text-xl font-semibold mt-2">Data Analytics</h3>
        <p className="text-gray-600">
          Gain valuable insights from your data with our advanced data analytics services.
        </p>
      </div>

      {/* Service 5 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Image
          src="/tech-solution.png"
          alt="Technology solutions"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
        <h3 className="text-xl font-semibold mt-2">Cybersecurity</h3>
        <p className="text-gray-600">
          Protect your business from cyber threats with our robust cybersecurity solutions.
        </p>
      </div>

      {/* Service 6 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Image
          src="/tech-solution.png"
          alt="Technology solutions"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
        <h3 className="text-xl font-semibold mt-2">IT Consulting</h3>
        <p className="text-gray-600">
          Get expert advice and guidance on your IT strategy with our IT consulting services.
        </p>
      </div>
    </div>
  )
}

export default ServicesList

const Pricing = () => {
  return (
    <div className="container mx-auto py-12">
      <h2 className="text-3xl font-semibold text-gray-800 text-centre mb-8">Pricing Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Basic Plan */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Basic</h3>
          <p className="text-gray-600 mb-4">Ideal for individuals and small teams getting started.</p>
          <div className="text-2xl font-bold text-indigo-600 mb-4">$19/month</div>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>1 User</li>
            <li>5 Projects</li>
            <li>Basic Support</li>
          </ul>
          <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
            Get Started
          </button>
        </div>

        {/* Standard Plan */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Standard</h3>
          <p className="text-gray-600 mb-4">Perfect for growing teams needing more features.</p>
          <div className="text-2xl font-bold text-indigo-600 mb-4">$49/month</div>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>5 Users</li>
            <li>Unlimited Projects</li>
            <li>Priority Support</li>
            <li>Advanced Analytics</li>
          </ul>
          <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
            Get Started
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Premium</h3>
          <p className="text-gray-600 mb-4">For large organisation needing enterprise-level support.</p>
          <div className="text-2xl font-bold text-indigo-600 mb-4">$99/month</div>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Unlimited Users</li>
            <li>Unlimited Projects</li>
            <li>24/7 Support</li>
            <li>Customise Reporting</li>
            <li>Dedicated Account Manager</li>
          </ul>
          <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
            Contact Us
          </button>
        </div>
      </div>

      <div className="mt-12 text-centre">
        <p className="text-gray-500">
          Need a custom solution? Contact us to discuss your specific needs and we can optimise a programme for you.
        </p>
      </div>
    </div>
  )
}

export default Pricing

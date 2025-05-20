const TeamSection = () => {
  return (
    <section className="bg-gray-100 py-12">
      <div className="container mx-auto text-centre">
        <h2 className="text-3xl font-semibold mb-8">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Team Member 1 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-full h-32 object-cover rounded-md mb-2"
            />
            <h3 className="text-lg font-semibold">John Doe</h3>
            <p className="text-gray-600">Software Engineer</p>
            <p>
              Expert in building robust and scalable applications. Passionate about writing clean and efficient code.
            </p>
          </div>

          {/* Team Member 2 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-full h-32 object-cover rounded-md mb-2"
            />
            <h3 className="text-lg font-semibold">Jane Smith</h3>
            <p className="text-gray-600">Data Scientist</p>
            <p>
              Specialises in data analysis and machine learning. Dedicated to extracting valuable insights from complex
              datasets.
            </p>
          </div>

          {/* Team Member 3 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-full h-32 object-cover rounded-md mb-2"
            />
            <h3 className="text-lg font-semibold">Peter Jones</h3>
            <p className="text-gray-600">Project Manager</p>
            <p>
              Experienced in leading cross-functional teams and delivering successful projects on time and within
              budget.
            </p>
          </div>

          {/* Team Member 4 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <img
              src="https://via.placeholder.com/150"
              alt="Team Member"
              className="w-full h-32 object-cover rounded-md mb-2"
            />
            <h3 className="text-lg font-semibold">Alice Brown</h3>
            <p className="text-gray-600">UI/UX Designer</p>
            <p>
              Creates intuitive and visually appealing user interfaces. Committed to enhancing user experience through
              thoughtful design.
            </p>
          </div>
        </div>
        <p className="mt-4 text-gray-700">
          Our team is dedicated to providing the best possible solutions for your needs. We strive to optimise our
          processes and customise our services to meet your specific requirements. We are a diverse organisation with a
          wide range of skills and experience. We use the latest fibre technology. We are working on a new training
          programme. We avoid using any kind of mould in our processes.
        </p>
      </div>
    </section>
  )
}

export default TeamSection

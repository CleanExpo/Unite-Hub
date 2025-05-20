const FAQ = () => {
  return (
    <div className="container mx-auto py-12">
      <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-centre">Frequently Asked Questions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">What is this website about?</h3>
          <p className="text-gray-600">
            This website is designed to provide information and resources related to a specific topic. Our aim is to
            offer comprehensive and up-to-date content to help you learn and understand more about this subject.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">How do I get started?</h3>
          <p className="text-gray-600">
            To get started, we recommend browsing through our articles and tutorials. You can also use the search bar to
            find specific information. If you have any questions, feel free to contact us.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Is there a cost to use this website?</h3>
          <p className="text-gray-600">
            No, this website is completely free to use. We believe in providing accessible education and resources to
            everyone.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">How often is the content updated?</h3>
          <p className="text-gray-600">
            We strive to update our content regularly to ensure it remains accurate and relevant. New articles and
            tutorials are added frequently.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Can I contribute to this website?</h3>
          <p className="text-gray-600">
            Yes, we welcome contributions from the community. If you have expertise in this area and would like to
            contribute, please contact us.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">What if I find an error or have a suggestion?</h3>
          <p className="text-gray-600">
            We appreciate your feedback. Please contact us with any errors you find or suggestions you have for
            improving the website.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FAQ

import Link from "next/link"

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">About Us</h3>
          <p className="text-gray-400">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="text-gray-400 hover:text-[#4ecdc4]">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-gray-400 hover:text-[#4ecdc4]">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/cookie-preferences" className="text-gray-400 hover:text-[#4ecdc4]">
                Cookie Preferences
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Contact</h3>
          <p className="text-gray-400">Email: info@example.com</p>
          <p className="text-gray-400">Phone: +1 555-123-4567</p>
        </div>
      </div>

      <div className="container mx-auto mt-8 text-center">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} My Company. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer

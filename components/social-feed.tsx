import Image from "next/image"

export const SocialFeed = () => {
  return (
    <div className="space-y-4">
      {/* Post 1 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-2">
          <Image src="/profile-placeholder.jpg" alt="Profile" width={40} height={40} className="rounded-full" />
          <p className="text-sm font-semibold">John Doe</p>
        </div>
        <p className="text-gray-700 text-sm mt-2">Check out my latest blog post on digital marketing strategies!</p>
        <Image
          src="/digital-marketing.png"
          alt="Social media post"
          width={300}
          height={200}
          className="rounded-lg object-cover mt-2"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L8.5 7.793a1 1 0 001.414 0L12.293 6.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0L6.293 7.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 text-sm">12 comments</p>
        </div>
      </div>

      {/* Post 2 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-2">
          <Image src="/profile-placeholder.jpg" alt="Profile" width={40} height={40} className="rounded-full" />
          <p className="text-sm font-semibold">Jane Smith</p>
        </div>
        <p className="text-gray-700 text-sm mt-2">
          Excited to announce our new product launch! Stay tuned for more details.
        </p>
        <Image
          src="/digital-marketing.png"
          alt="Social media post"
          width={300}
          height={200}
          className="rounded-lg object-cover mt-2"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L8.5 7.793a1 1 0 001.414 0L12.293 6.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0L6.293 7.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 text-sm">5 comments</p>
        </div>
      </div>
    </div>
  )
}

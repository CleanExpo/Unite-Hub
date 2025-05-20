import type { Metadata } from "next"
import { SocialFeed } from "@/components/social-feed"

export const metadata: Metadata = {
  title: "Social Media | UNITE Group",
  description:
    "Stay connected with UNITE Group on social media. Follow us for the latest updates, courses, and industry insights.",
}

export default function SocialPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Connect With Us</h1>
        <p className="text-gray-600 mb-8">
          Stay up to date with our latest news, courses, and industry insights by following us on social media.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <a
            href="https://www.facebook.com/CARSIaus/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex-shrink-0 mr-4 bg-[#1877F2] text-white p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Facebook</h2>
              <p className="text-gray-600">Follow us for daily updates and community discussions</p>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/company/carsiaus/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex-shrink-0 mr-4 bg-[#0A66C2] text-white p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">LinkedIn</h2>
              <p className="text-gray-600">Connect with us professionally and stay updated on industry news</p>
            </div>
          </a>

          <a
            href="https://www.youtube.com/@carsi6767/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex-shrink-0 mr-4 bg-[#FF0000] text-white p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">YouTube</h2>
              <p className="text-gray-600">Watch our educational videos, tutorials, and webinars</p>
            </div>
          </a>

          <a
            href="https://www.reddit.com/r/CARSIGeneral/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex-shrink-0 mr-4 bg-[#FF4500] text-white p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <circle cx="8" cy="9" r="1" />
                <circle cx="16" cy="9" r="1" />
                <path d="M12 16a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Reddit</h2>
              <p className="text-gray-600">Join our community discussions and ask questions</p>
            </div>
          </a>
        </div>

        <h2 className="text-2xl font-bold mb-6">Recent Social Media Posts</h2>
        <SocialFeed />
      </div>
    </div>
  )
}

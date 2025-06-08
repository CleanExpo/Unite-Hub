'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFound() {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Illustration */}
          <div className="mb-8">
            <h1 className="text-[150px] font-bold text-gray-200 leading-none mb-4">
              404
            </h1>
            <div className="w-32 h-1 bg-blue-600 mx-auto mb-8"></div>
          </div>

          {/* Error Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            We couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href={`/${locale}`}>
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href={`/${locale}/contact`}>
                <Search className="mr-2 h-5 w-5" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              Need help? Here are some helpful links:
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href={`/${locale}/services`} className="text-blue-600 hover:underline">
                Our Services
              </Link>
              <span className="text-gray-400">•</span>
              <Link href={`/${locale}/about`} className="text-blue-600 hover:underline">
                About Us
              </Link>
              <span className="text-gray-400">•</span>
              <Link href={`/${locale}/faq`} className="text-blue-600 hover:underline">
                FAQ
              </Link>
              <span className="text-gray-400">•</span>
              <Link href={`/${locale}/blog`} className="text-blue-600 hover:underline">
                Blog
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

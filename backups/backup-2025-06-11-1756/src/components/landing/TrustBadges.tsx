'use client';

import { Shield, Award, CheckCircle, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const securityBadges = [
  {
    name: 'SOC 2 Type II',
    description: 'Security & Compliance Certified',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    name: 'GDPR Compliant',
    description: 'Data Protection Standards',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    name: 'ISO 27001',
    description: 'Information Security',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    name: 'PCI DSS',
    description: 'Payment Card Security',
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
];

const partnerBadges = [
  { name: 'Google Cloud Partner', logo: '/images/partners/google-cloud.svg' },
  { name: 'Microsoft Partner', logo: '/images/partners/microsoft-partner.svg' },
  { name: 'AWS Partner', logo: '/images/partners/aws-partner.svg' },
  { name: 'Stripe Partner', logo: '/images/partners/stripe-partner.svg' },
];

const reviewPlatforms = [
  { name: 'Clutch', rating: 4.9, reviews: 47, logo: '/images/reviews/clutch.svg' },
  { name: 'G2', rating: 4.8, reviews: 123, logo: '/images/reviews/g2.svg' },
  { name: 'Trustpilot', rating: 4.9, reviews: 89, logo: '/images/reviews/trustpilot.svg' },
];

export function TrustBadges() {
  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Security Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Enterprise-Grade Security & Compliance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {securityBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-lg ${badge.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${badge.color}`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {badge.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Partner Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Trusted Technology Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {partnerBadges.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                <div className="w-40 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  {/* Unite Group for partner logos */}
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    {partner.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Review Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Independently Verified Excellence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviewPlatforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-32 h-12 mx-auto mb-4 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">
                    {platform.name}
                  </span>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(platform.rating) ? 'fill-current' : 'fill-gray-300'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 font-bold text-gray-900 dark:text-white">
                    {platform.rating}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Based on {platform.reviews} reviews
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

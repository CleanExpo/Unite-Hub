'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, Database, UserCheck, Globe, Mail, Phone } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const lastUpdated = '2025-01-01'
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {/* Quick Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Privacy at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Data Security</h4>
                    <p className="text-sm text-blue-700">256-bit encryption for all data</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <UserCheck className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">GDPR Compliant</h4>
                    <p className="text-sm text-blue-700">Full compliance with EU regulations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Eye className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">No Tracking</h4>
                    <p className="text-sm text-blue-700">We don&apos;t sell your data</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Database className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Data Control</h4>
                    <p className="text-sm text-blue-700">Request deletion anytime</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support.
              </p>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Information you provide:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Company information</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Communications with our team</li>
                <li>Any other information you choose to provide</li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Information collected automatically:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Usage data (features used, time spent)</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We use the information we collect to provide, maintain, and improve our services.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Provide and deliver our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve our services</li>
                <li>Protect against fraudulent or illegal activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information in the following situations:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>With your consent or at your direction</li>
                <li>With service providers who assist in our operations</li>
                <li>To comply with legal obligations or protect rights</li>
                <li>In connection with a merger or acquisition</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>256-bit SSL encryption for data in transit</li>
                <li>Encrypted storage for sensitive data at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Restriction:</strong> Request limited processing of your data</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage</li>
                <li>Improve performance</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You can control cookies through your browser settings. Note that disabling cookies 
                may affect the functionality of our services.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                We retain your information for as long as necessary to provide our services and comply 
                with legal obligations. When we no longer need your information, we will securely delete 
                or anonymize it.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your information in accordance 
                with this privacy policy.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                If you have any questions about this privacy policy or our practices, please contact us:
              </p>
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-500 mr-3" />
                      <a href="mailto:privacy@unite-group.in" className="text-blue-600 hover:underline">
                        privacy@unite-group.in
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">+91 88888 88888</span>
                    </div>
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div className="text-gray-700">
                        Unite Group<br />
                        Unite Business Park<br />
                        Sector 62, Noida<br />
                        Uttar Pradesh 201309, India
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

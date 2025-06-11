'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, AlertCircle, Scale, Shield, Users, Globe, Mail } from 'lucide-react'

export default function TermsOfServicePage() {
  const effectiveDate = '2025-01-01'
  
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
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            Please read these terms carefully before using Unite Group services.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Effective Date: {new Date(effectiveDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-900">
                <AlertCircle className="h-5 w-5 mr-2" />
                Important Legal Agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                By accessing or using Unite Group&apos;s services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you are 
                prohibited from using or accessing our services.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                By creating an account or using Unite Group services (&quot;Services&quot;), you agree to these 
                Terms of Service (&quot;Terms&quot;). These Terms constitute a legally binding agreement between 
                you and Unite Group.
              </p>
              <p className="text-gray-600">
                We may update these Terms from time to time. Your continued use of the Services after any 
                changes indicates your acceptance of the updated Terms.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Unite Group provides enterprise software solutions including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Customer Relationship Management (CRM) system</li>
                <li>AI-powered analytics and insights</li>
                <li>Cloud infrastructure services</li>
                <li>Software development and consulting</li>
                <li>Integration and automation tools</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                To use our Services, you must:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
              <p className="text-gray-600">
                We reserve the right to suspend or terminate accounts that violate these Terms or engage 
                in fraudulent or illegal activities.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                You agree not to use our Services to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malware or harmful code</li>
                <li>Engage in unauthorized access or hacking</li>
                <li>Harass, abuse, or harm others</li>
                <li>Send spam or unsolicited communications</li>
                <li>Misrepresent your identity or affiliation</li>
                <li>Interfere with the proper functioning of the Services</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                For paid Services:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Payment is due according to your selected billing cycle</li>
                <li>All fees are non-refundable unless otherwise specified</li>
                <li>Prices may change with 30 days&apos; notice</li>
                <li>Late payments may result in service suspension</li>
                <li>You are responsible for all applicable taxes</li>
              </ul>
              <p className="text-gray-600">
                We use third-party payment processors and do not store your payment card information.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Our Property:</strong> All content, features, and functionality of the Services 
                are owned by Unite Group and protected by intellectual property laws.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Your Content:</strong> You retain ownership of content you submit to the Services. 
                By submitting content, you grant us a license to use, modify, and display it as necessary 
                to provide the Services.
              </p>
              <p className="text-gray-600">
                <strong>Feedback:</strong> Any feedback or suggestions you provide may be used by us 
                without compensation or attribution.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Protection</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Your use of our Services is also governed by our Privacy Policy. We implement 
                industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Compliance with data protection regulations</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Level Agreement</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                For enterprise customers, we offer:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>99.9% uptime guarantee</li>
                <li>24/7 technical support</li>
                <li>Priority issue resolution</li>
                <li>Regular backups and disaster recovery</li>
                <li>Performance monitoring and optimization</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, UNITE GROUP SHALL NOT BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR 
                USE OF THE SERVICES.
              </p>
              <p className="text-gray-600">
                Our total liability shall not exceed the amount paid by you for the Services in the 
                twelve months preceding the claim.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                You agree to indemnify and hold Unite Group harmless from any claims, losses, damages, 
                liabilities, and expenses arising from your use of the Services, violation of these Terms, 
                or infringement of any third-party rights.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Either party may terminate these Terms:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>By you: Cancel your account at any time</li>
                <li>By us: For violation of these Terms or non-payment</li>
                <li>Upon termination, your access to the Services will cease</li>
                <li>Certain provisions of these Terms will survive termination</li>
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">
                These Terms are governed by the laws of India, without regard to conflict of law principles. 
                Any disputes shall be resolved in the courts of Noida, Uttar Pradesh, India.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                For questions about these Terms, please contact us:
              </p>
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-500 mr-3" />
                      <a href="mailto:legal@unite-group.in" className="text-blue-600 hover:underline">
                        legal@unite-group.in
                      </a>
                    </div>
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div className="text-gray-700">
                        Unite Group Legal Department<br />
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

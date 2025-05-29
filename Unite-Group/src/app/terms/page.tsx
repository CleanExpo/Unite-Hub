"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-300 hover:text-white transition-colors">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/book-consultation">Book Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-lg">
            Last Updated: May 25, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardContent className="p-8">
              <div className="prose prose-invert max-w-none prose-headings:text-teal-400 prose-a:text-teal-400 prose-strong:text-white">
                <h2>1. Introduction</h2>
                <p>Welcome to UNITE Group ("Company", "we", "our", "us"). These Terms of Service ("Terms", "Terms of Service") govern your use of our website located at <a href="https://unite-group.com">https://unite-group.com</a> (the "Service") operated by UNITE Group.</p>
                <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

                <h2>2. Consultations and Services</h2>
                <p>UNITE Group provides business and technology consulting services. Our standard consultation fee is $550, which includes:</p>
                <ul>
                  <li>A one-hour consultation session with our experts</li>
                  <li>Business needs assessment</li>
                  <li>Strategic recommendations</li>
                  <li>Follow-up documentation of key insights</li>
                </ul>
                <p>Consultation bookings are subject to availability and confirmation from our team. We reserve the right to reschedule consultations with reasonable notice.</p>

                <h2>3. Communications</h2>
                <p>By creating an account on our service, you agree to subscribe to newsletters, marketing or promotional materials, and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.</p>

                <h2>4. Accounts</h2>
                <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
                <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

                <h2>5. Payment and Refunds</h2>
                <p>Payment for consultations is due at the time of booking unless otherwise agreed upon in writing. We accept major credit cards and electronic transfers.</p>
                <p>Refund Policy:</p>
                <ul>
                  <li>Full refund if cancellation is made at least 48 hours before the scheduled consultation</li>
                  <li>50% refund if cancellation is made between 24-48 hours before the scheduled consultation</li>
                  <li>No refund for cancellations less than 24 hours before the scheduled consultation</li>
                </ul>

                <h2>6. Intellectual Property</h2>
                <p>The Service and its original content, features, and functionality are and will remain the exclusive property of UNITE Group and its licensors. The Service is protected by copyright, trademark, and other laws of both Australia and foreign countries.</p>
                <p>Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of UNITE Group.</p>

                <h2>7. Confidentiality</h2>
                <p>We understand the sensitive nature of business consultations. Any information shared during consultations will be kept confidential unless permission is granted for its use in case studies or testimonials.</p>

                <h2>8. Limitation Of Liability</h2>
                <p>In no event shall UNITE Group, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
                <ul>
                  <li>Your access to or use of or inability to access or use the Service;</li>
                  <li>Any conduct or content of any third party on the Service;</li>
                  <li>Any content obtained from the Service; and</li>
                  <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                </ul>

                <h2>9. Disclaimer</h2>
                <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied.</p>
                <p>UNITE Group does not warrant that the results of using our services will meet your requirements.</p>

                <h2>10. Governing Law</h2>
                <p>These Terms shall be governed and construed in accordance with the laws of Australia, without regard to its conflict of law provisions.</p>
                <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.</p>

                <h2>11. Changes</h2>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
                <p>By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.</p>

                <h2>12. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at:</p>
                <p>
                  <strong>Email:</strong> support@unite-group.com<br />
                  <strong>Phone:</strong> 0457 123 005
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

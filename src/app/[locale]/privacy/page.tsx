"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
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
            Privacy Policy
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
                <p>UNITE Group ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and inform you of your privacy rights and how the law protects you.</p>
                <p>This privacy policy applies to personal data we collect when you use our website, sign up for our services, or interact with us in any way.</p>

                <h2>2. The Data We Collect About You</h2>
                <p>We may collect, use, store, and transfer different kinds of personal data about you, including:</p>
                <ul>
                  <li><strong>Identity Data</strong>: includes first name, last name, username or similar identifier</li>
                  <li><strong>Contact Data</strong>: includes email address, telephone numbers, and physical address</li>
                  <li><strong>Technical Data</strong>: includes internet protocol (IP) address, browser type and version, time zone setting and location, operating system and platform</li>
                  <li><strong>Usage Data</strong>: includes information about how you use our website and services</li>
                  <li><strong>Marketing Data</strong>: includes your preferences in receiving marketing from us</li>
                  <li><strong>Business Data</strong>: includes information about your business needs and objectives shared during consultations</li>
                </ul>

                <h2>3. How We Collect Your Personal Data</h2>
                <p>We use different methods to collect data from and about you including through:</p>
                <ul>
                  <li><strong>Direct interactions</strong>: You may give us your Identity and Contact Data by filling in forms or by corresponding with us by email, phone, or otherwise.</li>
                  <li><strong>Automated technologies</strong>: As you interact with our website, we may automatically collect Technical Data about your browsing actions and patterns.</li>
                  <li><strong>Third parties</strong>: We may receive personal data about you from various third parties such as analytics providers and advertising networks.</li>
                </ul>

                <h2>4. How We Use Your Personal Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul>
                  <li>To register you as a new customer</li>
                  <li>To process and deliver our services to you</li>
                  <li>To manage our relationship with you</li>
                  <li>To administer and protect our business and website</li>
                  <li>To deliver relevant website content and advertisements to you</li>
                  <li>To use data analytics to improve our website, products/services, marketing, customer relationships, and experiences</li>
                </ul>

                <h2>5. Data Security</h2>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.</p>
                <p>We have procedures in place to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.</p>

                <h2>6. Data Retention</h2>
                <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
                <p>To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data, and whether we can achieve those purposes through other means, and the applicable legal requirements.</p>

                <h2>7. Your Legal Rights</h2>
                <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
                <ul>
                  <li>Request access to your personal data</li>
                  <li>Request correction of your personal data</li>
                  <li>Request erasure of your personal data</li>
                  <li>Object to processing of your personal data</li>
                  <li>Request restriction of processing your personal data</li>
                  <li>Request transfer of your personal data</li>
                  <li>Right to withdraw consent</li>
                </ul>
                <p>You will not have to pay a fee to access your personal data (or to exercise any of the other rights). However, we may charge a reasonable fee if your request is clearly unfounded, repetitive, or excessive. Alternatively, we may refuse to comply with your request in these circumstances.</p>

                <h2>8. Third-Party Links</h2>
                <p>This website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements. When you leave our website, we encourage you to read the privacy policy of every website you visit.</p>

                <h2>9. Cookies</h2>
                <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.</p>
                <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
                <p>Examples of Cookies we use:</p>
                <ul>
                  <li><strong>Session Cookies</strong>: We use Session Cookies to operate our Service.</li>
                  <li><strong>Preference Cookies</strong>: We use Preference Cookies to remember your preferences and various settings.</li>
                  <li><strong>Security Cookies</strong>: We use Security Cookies for security purposes.</li>
                  <li><strong>Advertising Cookies</strong>: Advertising Cookies are used to serve you with advertisements that may be relevant to you and your interests.</li>
                </ul>

                <h2>10. Children's Privacy</h2>
                <p>Our Service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.</p>

                <h2>11. Changes to This Privacy Policy</h2>
                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.</p>
                <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

                <h2>12. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <p>
                  <strong>Email:</strong> privacy@unite-group.com<br />
                  <strong>Phone:</strong> 0457 123 005<br />
                  <strong>Address:</strong> 123 Business Street, Sydney NSW 2000, Australia
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

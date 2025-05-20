import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Privacy Policy | UNITE Group",
  description:
    "Learn how UNITE Group collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/privacy`,
    title: "Privacy Policy | UNITE Group",
    description:
      "Learn how UNITE Group collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.",
    images: [
      {
        url: `${siteUrl}/og-privacy.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | UNITE Group",
    description:
      "Learn how UNITE Group collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.",
    images: [`${siteUrl}/og-privacy.png`],
  },
}

export default function PrivacyPolicyPage() {
  // Get the current date for the "Last Updated" section
  const currentDate = new Date().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Privacy Policy</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-6">
                How we collect, use, and protect your personal information
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-6 rounded-lg mb-8 border border-[#4ecdc4]/20">
                <p className="text-gray-300 mb-0">
                  <strong>Last Updated:</strong> {currentDate}
                </p>
              </div>

              <h2>Introduction</h2>
              <p>
                UNITE Group ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you visit our website{" "}
                <Link href="/" className="text-[#4ecdc4] hover:underline">
                  unitegroup.com.au
                </Link>{" "}
                (the "Site"), use our services, or communicate with us.
              </p>
              <p>
                We value your privacy and strive to provide a safe, secure user experience. By accessing our Site or
                using our services, you consent to the data practices described in this privacy policy. Please read this
                policy carefully to understand our practices regarding your personal information.
              </p>

              <h2>Information We Collect</h2>
              <p>We may collect several types of information from and about users of our Site, including:</p>

              <h3>Personal Information</h3>
              <p>
                Personal information is data that can be used to identify you individually. We may collect the following
                personal information:
              </p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Postal address</li>
                <li>Company name and position</li>
                <li>Payment information (when purchasing services)</li>
                <li>
                  Account credentials (if you create an account for our online education platform or other services)
                </li>
              </ul>

              <h3>Non-Personal Information</h3>
              <p>We may also collect non-personal information, including:</p>
              <ul>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>IP address</li>
                <li>Device information</li>
                <li>Usage data (such as pages visited, time spent on pages, links clicked)</li>
                <li>Referring website addresses</li>
              </ul>

              <h2>How We Collect Information</h2>
              <p>We collect information in the following ways:</p>

              <h3>Direct Collection</h3>
              <p>Information you provide to us when you:</p>
              <ul>
                <li>Fill out forms on our Site (such as contact forms or newsletter subscriptions)</li>
                <li>Register for an account</li>
                <li>Purchase services</li>
                <li>Enrol in courses or educational programs</li>
                <li>Participate in surveys or feedback forms</li>
                <li>Communicate with us via email, phone, or other channels</li>
              </ul>

              <h3>Automated Collection</h3>
              <p>Information collected automatically when you visit our Site through:</p>
              <ul>
                <li>
                  <strong>Cookies:</strong> Small data files stored on your device that help us improve our Site and
                  your experience, remember your preferences, and track usage patterns.
                </li>
                <li>
                  <strong>Log Files:</strong> Records of website activity that help us analyse trends, administer the
                  Site, track user movement, and gather demographic information.
                </li>
                <li>
                  <strong>Web Beacons:</strong> Small electronic files that allow us to count users who have visited
                  certain pages and analyse site usage patterns.
                </li>
                <li>
                  <strong>Analytics Tools:</strong> We use services like Google Analytics to collect and analyse
                  information about how users engage with our Site.
                </li>
              </ul>

              <h3>Information from Third Parties</h3>
              <p>We may receive information about you from third parties, including:</p>
              <ul>
                <li>Business partners</li>
                <li>Social media platforms (if you interact with our social media accounts or use social login)</li>
                <li>Service providers</li>
                <li>Publicly available sources</li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>We may use the information we collect for various purposes, including to:</p>
              <ul>
                <li>Provide, maintain, and improve our Site and services</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative information, such as updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Provide customer support and technical assistance</li>
                <li>Send marketing communications, newsletters, and promotional materials</li>
                <li>Personalise your experience on our Site</li>
                <li>Monitor and analyse usage patterns and trends</li>
                <li>Protect against, identify, and prevent fraud and other illegal activities</li>
                <li>Comply with legal obligations</li>
                <li>Enforce our terms and conditions</li>
              </ul>

              <h2>Disclosure of Your Information</h2>
              <p>We may disclose your personal information to:</p>

              <h3>Service Providers</h3>
              <p>
                We may share your information with third-party service providers who perform services on our behalf,
                such as:
              </p>
              <ul>
                <li>Payment processors</li>
                <li>Cloud hosting providers</li>
                <li>Email service providers</li>
                <li>Analytics providers</li>
                <li>Customer relationship management systems</li>
                <li>Learning management systems</li>
              </ul>
              <p>
                These service providers are contractually obligated to use your personal information only to provide
                services to us and in accordance with our instructions.
              </p>

              <h3>Business Transfers</h3>
              <p>
                If we are involved in a merger, acquisition, sale of assets, bankruptcy, reorganisation, or similar
                event, your information may be transferred as part of that transaction. We will notify you via email
                and/or a prominent notice on our Site of any change in ownership or uses of your personal information.
              </p>

              <h3>Legal Requirements</h3>
              <p>
                We may disclose your information if required to do so by law or in response to valid requests by public
                authorities (e.g., a court or government agency).
              </p>

              <h3>With Your Consent</h3>
              <p>We may share your information with third parties when we have your consent to do so.</p>

              <h2>Your Privacy Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information. Under the
                Australian Privacy Act 1988 (Cth) and other applicable laws, these rights may include:
              </p>

              <h3>Access and Correction</h3>
              <p>
                You have the right to access and correct your personal information. You can request access to the
                personal information we hold about you and ask us to correct any information that is inaccurate,
                incomplete, or out of date.
              </p>

              <h3>Deletion</h3>
              <p>
                In certain circumstances, you may have the right to request that we delete your personal information.
              </p>

              <h3>Objection and Restriction</h3>
              <p>
                You may have the right to object to or request restriction of processing of your personal information.
              </p>

              <h3>Data Portability</h3>
              <p>
                You may have the right to receive your personal information in a structured, commonly used, and
                machine-readable format.
              </p>

              <h3>Withdraw Consent</h3>
              <p>
                Where we rely on your consent to process your personal information, you have the right to withdraw your
                consent at any time.
              </p>

              <p>
                To exercise any of these rights, please contact us using the contact information provided at the end of
                this Privacy Policy.
              </p>

              <h2>Data Security</h2>
              <p>
                We implement appropriate technical and organisational measures to protect the security of your personal
                information. However, please be aware that no method of transmission over the Internet or electronic
                storage is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p>Our security measures include:</p>
              <ul>
                <li>Encryption of sensitive information</li>
                <li>Secure socket layer (SSL) technology</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication procedures</li>
                <li>Staff training on data protection</li>
              </ul>

              <h2>Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfil the purposes outlined in this
                Privacy Policy, unless a longer retention period is required or permitted by law. When determining how
                long to retain information, we consider:
              </p>
              <ul>
                <li>The amount, nature, and sensitivity of the information</li>
                <li>The potential risk of harm from unauthorised use or disclosure</li>
                <li>The purposes for which we process the information</li>
                <li>Whether we can achieve those purposes through other means</li>
                <li>Applicable legal requirements</li>
              </ul>

              <h2>International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than the country in which you
                reside. These countries may have data protection laws that are different from the laws of your country.
              </p>
              <p>
                When we transfer your information to other countries, we will take appropriate safeguards to ensure that
                your personal information remains protected in accordance with this Privacy Policy and applicable law.
              </p>

              <h2>Children's Privacy</h2>
              <p>
                Our Site and services are not intended for children under the age of 16. We do not knowingly collect
                personal information from children under 16. If you are a parent or guardian and believe that your child
                has provided us with personal information, please contact us, and we will delete such information from
                our records.
              </p>

              <h2>Third-Party Links</h2>
              <p>
                Our Site may contain links to third-party websites, plugins, and applications. Clicking on those links
                or enabling those connections may allow third parties to collect or share data about you. We do not
                control these third-party websites and are not responsible for their privacy statements. We encourage
                you to read the privacy policy of every website you visit.
              </p>

              <h2>Social Media Features</h2>
              <p>
                Our Site includes social media features, such as Facebook, LinkedIn, Twitter, and YouTube buttons or
                links. These features may collect your IP address, which page you are visiting on our Site, and may set
                a cookie to enable the feature to function properly. Social media features are either hosted by a third
                party or hosted directly on our Site. Your interactions with these features are governed by the privacy
                policy of the company providing them.
              </p>

              <h2>Cookies and Similar Technologies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience on our Site. You can set your browser
                to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you
                disable or refuse cookies, please note that some parts of this Site may become inaccessible or not
                function properly.
              </p>
              <p>We use the following types of cookies:</p>
              <ul>
                <li>
                  <strong>Essential Cookies:</strong> Necessary for the operation of our Site. They enable basic
                  functions like page navigation and access to secure areas.
                </li>
                <li>
                  <strong>Analytical/Performance Cookies:</strong> Allow us to recognise and count the number of
                  visitors and see how visitors move around our Site. This helps us improve the way our Site works.
                </li>
                <li>
                  <strong>Functionality Cookies:</strong> Used to recognise you when you return to our Site. This
                  enables us to personalise our content for you and remember your preferences.
                </li>
                <li>
                  <strong>Targeting Cookies:</strong> Record your visit to our Site, the pages you have visited, and the
                  links you have followed. We may use this information to make our Site and the advertising displayed on
                  it more relevant to your interests.
                </li>
              </ul>

              <h2>Marketing Communications</h2>
              <p>
                We may send you marketing communications about our products and services that we believe may be of
                interest to you. You can opt out of receiving marketing communications from us at any time by:
              </p>
              <ul>
                <li>Clicking the "unsubscribe" link in marketing emails</li>
                <li>Contacting us using the contact information provided below</li>
              </ul>
              <p>
                Please note that even if you opt out of marketing communications, we may still send you non-marketing
                communications, such as those about your account, transactions, or our ongoing business relations.
              </p>

              <h2>Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other
                operational, legal, or regulatory reasons. The updated policy will be posted on this page with a revised
                "Last Updated" date. We encourage you to review this Privacy Policy periodically to stay informed about
                how we are protecting your information.
              </p>
              <p>
                If we make material changes to this Privacy Policy, we will notify you by email or through a notice on
                our Site prior to the change becoming effective.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices,
                please contact us at:
              </p>
              <p>
                <strong>UNITE Group</strong>
                <br />
                Email: support@carsi.com.au
                <br />
                Phone: 0457 123 005
                <br />
                Address: Brisbane, QLD, Australia
                <br />
                ABN: 12 345 678 901
              </p>
              <p>
                We will respond to your inquiry within a reasonable timeframe and in accordance with applicable data
                protection laws.
              </p>

              <h2>Complaints</h2>
              <p>
                If you believe that we have breached the Australian Privacy Principles or any other applicable privacy
                laws, please contact us using the details above. We will investigate your complaint and respond to you
                within 30 days.
              </p>
              <p>
                If you are not satisfied with our response, you may complain to the Office of the Australian Information
                Commissioner (OAIC). Contact details for the OAIC can be found at{" "}
                <a
                  href="https://www.oaic.gov.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4ecdc4] hover:underline"
                >
                  www.oaic.gov.au
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Have Questions About Your Privacy?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  We're committed to transparency and protecting your personal information. If you have any questions or
                  concerns, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                      Contact Us
                    </Button>
                  </Link>
                  <Link href="/terms">
                    <Button
                      variant="outline"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                      size="lg"
                    >
                      Terms of Service
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Cookie Policy | UNITE Group",
  description:
    "Learn how UNITE Group uses cookies and similar technologies on our website. Our cookie policy explains what cookies are and how we use them.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/cookies`,
    title: "Cookie Policy | UNITE Group",
    description:
      "Learn how UNITE Group uses cookies and similar technologies on our website. Our cookie policy explains what cookies are and how we use them.",
    images: [
      {
        url: `${siteUrl}/og-cookies.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Cookie Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | UNITE Group",
    description:
      "Learn how UNITE Group uses cookies and similar technologies on our website. Our cookie policy explains what cookies are and how we use them.",
    images: [`${siteUrl}/og-cookies.png`],
  },
}

export default function CookiePolicyPage() {
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
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Cookie Policy</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-6">
                How we use cookies and similar technologies on our website
              </p>
            </div>
          </div>
        </section>

        {/* Cookie Policy Content */}
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
                This Cookie Policy explains how UNITE Group ("we," "our," or "us") uses cookies and similar technologies
                on our website{" "}
                <Link href="/" className="text-[#4ecdc4] hover:underline">
                  unitegroup.com.au
                </Link>{" "}
                (the "Site"). This policy provides you with information about how we use cookies, what types of cookies
                we use, and how you can control them.
              </p>
              <p>
                By using our Site, you consent to the use of cookies in accordance with this Cookie Policy. If you do
                not accept the use of cookies, please disable them as described below or refrain from using our Site.
              </p>

              <h2>What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your computer, smartphone, or other device when you
                visit a website. They are widely used to make websites work more efficiently, provide a better user
                experience, and give website owners information about how their site is being used.
              </p>
              <p>Cookies can be:</p>
              <ul>
                <li>
                  <strong>Session cookies:</strong> These are temporary cookies that expire when you close your browser.
                </li>
                <li>
                  <strong>Persistent cookies:</strong> These remain on your device until they expire or you delete them.
                  They help us remember your preferences and settings for future visits.
                </li>
                <li>
                  <strong>First-party cookies:</strong> These are set by the website you are visiting.
                </li>
                <li>
                  <strong>Third-party cookies:</strong> These are set by a domain other than the one you are visiting,
                  such as by analytics providers or advertising networks.
                </li>
              </ul>

              <h2>How We Use Cookies</h2>
              <p>We use cookies for various purposes, including:</p>
              <ul>
                <li>
                  <strong>Essential cookies:</strong> These are necessary for the operation of our Site. They enable
                  basic functions like page navigation, access to secure areas, and maintaining user sessions. The Site
                  cannot function properly without these cookies.
                </li>
                <li>
                  <strong>Analytical/performance cookies:</strong> These allow us to recognise and count the number of
                  visitors and see how visitors move around our Site. This helps us improve the way our Site works, for
                  example, by ensuring that users can find what they are looking for easily.
                </li>
                <li>
                  <strong>Functionality cookies:</strong> These are used to recognise you when you return to our Site.
                  This enables us to personalise our content for you, greet you by name, and remember your preferences
                  (for example, your choice of language or region).
                </li>
                <li>
                  <strong>Targeting/advertising cookies:</strong> These record your visit to our Site, the pages you
                  have visited, and the links you have followed. We may use this information to make our Site and the
                  advertising displayed on it more relevant to your interests. We may also share this information with
                  third parties for this purpose.
                </li>
              </ul>

              <h2>Specific Cookies We Use</h2>
              <p>The following table provides more information about the specific cookies we use:</p>
              <table>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Type</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_ga</td>
                    <td>Analytical</td>
                    <td>Used by Google Analytics to distinguish users</td>
                    <td>2 years</td>
                  </tr>
                  <tr>
                    <td>_gid</td>
                    <td>Analytical</td>
                    <td>Used by Google Analytics to distinguish users</td>
                    <td>24 hours</td>
                  </tr>
                  <tr>
                    <td>_gat</td>
                    <td>Analytical</td>
                    <td>Used by Google Analytics to throttle request rate</td>
                    <td>1 minute</td>
                  </tr>
                  <tr>
                    <td>session</td>
                    <td>Essential</td>
                    <td>Maintains user session information</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td>user_preferences</td>
                    <td>Functionality</td>
                    <td>Remembers user preferences (e.g., language, theme)</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>

              <h2>Third-Party Cookies</h2>
              <p>
                We also use third-party services that may set cookies on your device when you visit our Site. These
                third-party services include:
              </p>
              <ul>
                <li>
                  <strong>Google Analytics:</strong> We use Google Analytics to help us understand how visitors engage
                  with our Site. Google Analytics uses cookies to collect information about how visitors use our Site.
                  The information generated by the cookie about your use of the Site (including your IP address) will be
                  transmitted to and stored by Google on servers in the United States. Google will use this information
                  for the purpose of evaluating your use of the Site, compiling reports on website activity for website
                  operators, and providing other services relating to website activity and internet usage. Google may
                  also transfer this information to third parties where required to do so by law, or where such third
                  parties process the information on Google's behalf. Google will not associate your IP address with any
                  other data held by Google.
                </li>
                <li>
                  <strong>Social Media Platforms:</strong> Our Site includes features from social media platforms such
                  as Facebook, LinkedIn, Twitter, and YouTube. These features may collect your IP address, which page
                  you are visiting on our Site, and may set a cookie to enable the feature to function properly. Social
                  media features are either hosted by a third party or hosted directly on our Site. Your interactions
                  with these features are governed by the privacy policy of the company providing them.
                </li>
                <li>
                  <strong>Marketing and Advertising Partners:</strong> We may work with third-party advertising partners
                  to show you ads that we think may interest you. These advertising partners may set and access their
                  own cookies on your device and they may use similar technologies to collect information about your
                  online activities over time and across different websites.
                </li>
              </ul>

              <h2>Managing Cookies</h2>
              <p>
                Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse
                cookies or delete certain cookies. Generally, you can also manage similar technologies in the same way
                that you manage cookies – using your browser's preferences.
              </p>
              <p>
                Please note that if you choose to block cookies, this may impair or prevent due functioning of our Site
                and services.
              </p>
              <p>Here are links to instructions on how to manage cookies in popular browsers:</p>
              <ul>
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4ecdc4] hover:underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4ecdc4] hover:underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/en-au/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4ecdc4] hover:underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4ecdc4] hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>
              <p>
                To opt out of being tracked by Google Analytics across all websites, you can visit{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4ecdc4] hover:underline"
                >
                  https://tools.google.com/dlpage/gaoptout
                </a>
                .
              </p>

              <h2>Do Not Track Signals</h2>
              <p>
                Some browsers have a "Do Not Track" feature that lets you tell websites that you do not want to have
                your online activities tracked. These features are not yet uniform, so we do not currently respond to
                such signals.
              </p>

              <h2>Changes to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our
                business practices. Any changes will be posted on this page with an updated revision date. If we make
                significant changes to this policy, we may notify you by email or through a notice on our Site.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions or concerns about our use of cookies or this Cookie Policy, please contact us
                at:
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
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Need More Information?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  If you have any questions about our cookie practices or need assistance managing your preferences,
                  please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                      Contact Us
                    </Button>
                  </Link>
                  <Link href="/privacy">
                    <Button
                      variant="outline"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                      size="lg"
                    >
                      Privacy Policy
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

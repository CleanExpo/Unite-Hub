import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Terms of Service | UNITE Group",
  description: "Read UNITE Group's Terms of Service. These terms govern your use of our website and services.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/terms`,
    title: "Terms of Service | UNITE Group",
    description: "Read UNITE Group's Terms of Service. These terms govern your use of our website and services.",
    images: [
      {
        url: `${siteUrl}/og-terms.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | UNITE Group",
    description: "Read UNITE Group's Terms of Service. These terms govern your use of our website and services.",
    images: [`${siteUrl}/og-terms.png`],
  },
}

export default function TermsOfServicePage() {
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
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Terms of Service</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-6">
                Please read these terms carefully before using our services
              </p>
            </div>
          </div>
        </section>

        {/* Terms of Service Content */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-6 rounded-lg mb-8 border border-[#4ecdc4]/20">
                <p className="text-gray-300 mb-0">
                  <strong>Last Updated:</strong> {currentDate}
                </p>
              </div>

              <h2>1. Introduction</h2>
              <p>
                Welcome to UNITE Group. These Terms of Service ("Terms") govern your use of our website located at{" "}
                <Link href="/" className="text-[#4ecdc4] hover:underline">
                  unitegroup.com.au
                </Link>{" "}
                (the "Site") and all related services, including but not limited to our online education platform,
                software development services, and SEO services (collectively, the "Services").
              </p>
              <p>
                By accessing or using our Site or Services, you agree to be bound by these Terms. If you do not agree to
                these Terms, please do not use our Site or Services.
              </p>

              <h2>2. Definitions</h2>
              <p>Throughout these Terms, the following definitions apply:</p>
              <ul>
                <li>
                  <strong>"UNITE Group,"</strong> "we," "us," or "our" refers to UNITE Group, an Australian business
                  with ABN 12 345 678 901.
                </li>
                <li>
                  <strong>"User,"</strong> "you," or "your" refers to any individual or entity that accesses or uses our
                  Site or Services.
                </li>
                <li>
                  <strong>"Content"</strong> refers to all text, images, videos, audio, graphics, and other materials
                  that appear on our Site or are delivered through our Services.
                </li>
                <li>
                  <strong>"Intellectual Property"</strong> refers to all patents, trademarks, service marks, logos,
                  trade names, internet domain names, rights in designs, copyright (including rights in computer
                  software), database rights, and any other intellectual property rights, in each case whether
                  registered or unregistered.
                </li>
              </ul>

              <h2>3. Account Registration</h2>
              <p>
                Some of our Services may require you to create an account. When you register for an account, you agree
                to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your account credentials secure and not share them with any third party</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorised use of your account or any other breach of security</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate your account if we have reason to believe that the
                information you provided is inaccurate, outdated, or incomplete, or if you have violated these Terms.
              </p>

              <h2>4. User Conduct</h2>
              <p>When using our Site or Services, you agree not to:</p>
              <ul>
                <li>Violate any applicable law, regulation, or these Terms</li>
                <li>Infringe upon the rights of others, including their intellectual property rights</li>
                <li>Use our Site or Services to transmit any harmful code, such as viruses or malware</li>
                <li>Interfere with or disrupt the operation of our Site or Services</li>
                <li>Attempt to gain unauthorised access to any part of our Site or Services</li>
                <li>Use our Site or Services for any fraudulent or illegal purpose</li>
                <li>Collect or harvest any information about other users without their consent</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
                <li>
                  Engage in any activity that could disable, overburden, or impair the proper functioning of our Site or
                  Services
                </li>
              </ul>

              <h2>5. Intellectual Property Rights</h2>
              <h3>Our Intellectual Property</h3>
              <p>
                The Site, Services, and all Content, features, and functionality thereof, including but not limited to
                all information, software, text, displays, images, video, and audio, and the design, selection, and
                arrangement thereof, are owned by UNITE Group, our licensors, or other providers of such material and
                are protected by Australian and international copyright, trademark, patent, trade secret, and other
                intellectual property or proprietary rights laws.
              </p>
              <p>
                These Terms do not grant you any right, title, or interest in or to the Site, Services, or Content. You
                may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform,
                republish, download, store, or transmit any of the material on our Site or Services, except as follows:
              </p>
              <ul>
                <li>
                  Your computer may temporarily store copies of such materials in RAM incidental to your accessing and
                  viewing those materials
                </li>
                <li>
                  You may store files that are automatically cached by your web browser for display enhancement purposes
                </li>
                <li>
                  You may print or download one copy of a reasonable number of pages of the Site for your own personal,
                  non-commercial use and not for further reproduction, publication, or distribution
                </li>
                <li>
                  If we provide social media features with certain Content, you may take such actions as are enabled by
                  such features
                </li>
              </ul>

              <h3>Your Content</h3>
              <p>
                If you submit, upload, or share any Content through our Site or Services ("User Content"), you grant us
                a non-exclusive, worldwide, royalty-free, perpetual, irrevocable, and fully sublicensable right to use,
                reproduce, modify, adapt, publish, translate, create derivative works from, distribute, perform, and
                display such User Content in connection with providing and promoting our Site and Services.
              </p>
              <p>You represent and warrant that:</p>
              <ul>
                <li>
                  You own or control all rights in and to the User Content and have the right to grant the license
                  granted above
                </li>
                <li>
                  The User Content does not violate the privacy rights, publicity rights, copyright, contractual rights,
                  or any other rights of any person or entity
                </li>
                <li>
                  The User Content does not contain any material that is defamatory, obscene, indecent, abusive,
                  offensive, harassing, violent, hateful, inflammatory, or otherwise objectionable
                </li>
              </ul>
              <p>
                We reserve the right to remove any User Content that, in our judgment, violates these Terms or may be
                offensive, illegal, or violate the rights, harm, or threaten the safety of any person.
              </p>

              <h2>6. Educational Services</h2>
              <p>
                Our educational services, including online courses and IICRC continuing education credits, are subject
                to the following additional terms:
              </p>
              <h3>Course Enrollment and Access</h3>
              <p>
                Upon enrollment and payment for a course, you will be granted access to the course materials for the
                specified period. Access to course materials may expire after a certain period, as indicated in the
                course description.
              </p>
              <h3>Certification and Credits</h3>
              <p>
                Completion of our courses may result in certificates or continuing education credits. We do not
                guarantee that our courses will be accepted for continuing education credits by all organisations or
                regulatory bodies. It is your responsibility to verify that our courses meet the requirements of your
                specific organisation or regulatory body.
              </p>
              <h3>Course Content</h3>
              <p>
                We strive to provide accurate and up-to-date course content. However, we do not guarantee the accuracy,
                completeness, or usefulness of any course content. Course content is provided for general informational
                and educational purposes only and should not be construed as professional advice.
              </p>

              <h2>7. Software Development and SEO Services</h2>
              <p>
                Our software development and SEO services are subject to separate agreements that will be provided to
                you before the commencement of such services. These agreements may include additional terms and
                conditions, such as project scope, deliverables, timelines, payment terms, and intellectual property
                rights.
              </p>

              <h2>8. Payment Terms</h2>
              <h3>Fees and Payment</h3>
              <p>
                We charge fees for certain Services, such as online courses, software development, and SEO services. All
                fees are in Australian dollars and are exclusive of applicable taxes unless otherwise stated.
              </p>
              <p>
                Payment must be made using the payment methods specified on our Site. By providing your payment
                information, you represent and warrant that you are authorised to use the designated payment method.
              </p>
              <h3>Refunds</h3>
              <p>
                Our refund policy varies depending on the Service. For online courses, we may offer a refund within a
                specified period after purchase if you are not satisfied with the course. For software development and
                SEO services, refunds are subject to the terms of the separate agreement governing those services.
              </p>
              <h3>Subscription Services</h3>
              <p>
                Some of our Services may be offered on a subscription basis. By signing up for a subscription, you
                authorise us to charge your payment method on a recurring basis until you cancel your subscription.
              </p>
              <p>
                You may cancel your subscription at any time by following the instructions on our Site or by contacting
                us. Cancellation will take effect at the end of your current billing period.
              </p>

              <h2>9. Third-Party Links and Services</h2>
              <p>
                Our Site and Services may contain links to third-party websites, services, or content that are not owned
                or controlled by UNITE Group. We have no control over, and assume no responsibility for, the content,
                privacy policies, or practices of any third-party websites or services.
              </p>
              <p>
                You acknowledge and agree that UNITE Group shall not be responsible or liable, directly or indirectly,
                for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on
                any such content, goods, or services available on or through any such websites or services.
              </p>
              <p>
                We strongly advise you to read the terms and conditions and privacy policies of any third-party websites
                or services that you visit or use.
              </p>

              <h2>10. Disclaimer of Warranties</h2>
              <p>
                YOUR USE OF THE SITE AND SERVICES IS AT YOUR SOLE RISK. THE SITE AND SERVICES ARE PROVIDED ON AN "AS IS"
                AND "AS AVAILABLE" BASIS. UNITE GROUP EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                UNITE GROUP MAKES NO WARRANTY THAT (i) THE SITE OR SERVICES WILL MEET YOUR REQUIREMENTS, (ii) THE SITE
                OR SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, (iii) THE RESULTS THAT MAY BE OBTAINED
                FROM THE USE OF THE SITE OR SERVICES WILL BE ACCURATE OR RELIABLE, OR (iv) THE QUALITY OF ANY PRODUCTS,
                SERVICES, INFORMATION, OR OTHER MATERIAL PURCHASED OR OBTAINED BY YOU THROUGH THE SITE OR SERVICES WILL
                MEET YOUR EXPECTATIONS.
              </p>
              <p>
                ANY MATERIAL DOWNLOADED OR OTHERWISE OBTAINED THROUGH THE USE OF THE SITE OR SERVICES IS DONE AT YOUR
                OWN DISCRETION AND RISK. YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM OR LOSS
                OF DATA THAT RESULTS FROM THE DOWNLOAD OF ANY SUCH MATERIAL.
              </p>
              <p>
                NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM UNITE GROUP OR THROUGH OR FROM
                THE SITE OR SERVICES SHALL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS.
              </p>

              <h2>11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL UNITE GROUP, ITS AFFILIATES,
                OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE,
                GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (i) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS
                OR USE THE SITE OR SERVICES; (ii) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SITE OR SERVICES;
                (iii) ANY CONTENT OBTAINED FROM THE SITE OR SERVICES; AND (iv) UNAUTHORISED ACCESS, USE, OR ALTERATION
                OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR
                ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
              </p>
              <p>
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT PAID BY YOU, IF ANY, FOR
                ACCESSING OR USING THE SITE OR SERVICES DURING THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO
                THE LIABILITY.
              </p>
              <p>
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR THE LIMITATION OR EXCLUSION OF
                LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES. ACCORDINGLY, SOME OF THE ABOVE LIMITATIONS MAY NOT
                APPLY TO YOU.
              </p>

              <h2>12. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless UNITE Group, its affiliates, officers, directors,
                employees, agents, suppliers, and licensors from and against any claims, liabilities, damages,
                judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out
                of or relating to your violation of these Terms or your use of the Site or Services, including, but not
                limited to, your User Content, any use of the Site's or Services' content, services, and products other
                than as expressly authorised in these Terms, or your use of any information obtained from the Site or
                Services.
              </p>

              <h2>13. Governing Law and Jurisdiction</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Queensland, Australia,
                without regard to its conflict of law provisions.
              </p>
              <p>
                Any dispute arising from or relating to these Terms or your use of the Site or Services shall be subject
                to the exclusive jurisdiction of the courts of Queensland, Australia.
              </p>

              <h2>14. Changes to These Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision
                is material, we will provide at least 30 days' notice prior to any new terms taking effect. What
                constitutes a material change will be determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use our Site or Services after any revisions become effective, you agree to
                be bound by the revised terms. If you do not agree to the new terms, you are no longer authorised to use
                the Site or Services.
              </p>

              <h2>15. Termination</h2>
              <p>
                We may terminate or suspend your access to the Site or Services immediately, without prior notice or
                liability, for any reason whatsoever, including without limitation if you breach these Terms.
              </p>
              <p>
                Upon termination, your right to use the Site and Services will immediately cease. If you wish to
                terminate your account, you may simply discontinue using the Site and Services, or you may contact us to
                request account deletion.
              </p>
              <p>
                All provisions of these Terms which by their nature should survive termination shall survive
                termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and
                limitations of liability.
              </p>

              <h2>16. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy and any other legal notices or additional terms and
                conditions published by UNITE Group on the Site or through the Services, shall constitute the entire
                agreement between you and UNITE Group concerning the Site and Services.
              </p>
              <p>
                If any provision of these Terms is deemed invalid by a court of competent jurisdiction, the invalidity
                of such provision shall not affect the validity of the remaining provisions of these Terms, which shall
                remain in full force and effect.
              </p>
              <p>
                No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any
                other term, and UNITE Group's failure to assert any right or provision under these Terms shall not
                constitute a waiver of such right or provision.
              </p>

              <h2>17. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at:</p>
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
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Have Questions About Our Terms?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  We're here to help you understand our terms and conditions. If you have any questions or concerns,
                  please don't hesitate to reach out.
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

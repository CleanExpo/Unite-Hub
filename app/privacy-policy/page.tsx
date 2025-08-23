import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Unite Group",
  description:
    "Understand how Unite Group collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "June 13, 2025"; // Update this date as needed

  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="mx-auto h-16 w-16 text-cyan-400 mb-6" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
            Your privacy is critically important to us. This policy outlines how
            Unite Group handles your personal information.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert prose-lg max-w-none text-slate-300 prose-headings:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-strong:text-slate-100">
            <p className="border-l-4 border-cyan-500 pl-4 italic text-slate-400">
              <strong>Important Note:</strong> This is a template Privacy Policy
              and should be reviewed by a legal professional to ensure it
              complies with all applicable laws and regulations specific to your
              business operations and jurisdiction.
            </p>

            <h2>1. Introduction</h2>
            <p>
              Welcome to Unite Group (&quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;). We are committed to protecting your personal
              information and your right to privacy. If you have any questions
              or concerns about this privacy notice, or our practices with
              regards to your personal information, please contact us at{" "}
              <a href="mailto:contact@unite-group.in">
                contact@unite-group.in
              </a>
              .
            </p>
            <p>
              This privacy notice describes how we might use your information if
              you:
            </p>
            <ul>
              <li>
                Visit our website at{" "}
                <Link href="/">https://unite-group.in</Link>
              </li>
              <li>
                Engage with us in other related ways ― including any sales,
                marketing, or events
              </li>
            </ul>
            <p>In this privacy notice, if we refer to:</p>
            <ul>
              <li>
                <strong>&quot;Website&quot;</strong>, we are referring to any
                website of ours that references or links to this policy
              </li>
              <li>
                <strong>&quot;Services&quot;</strong>, we are referring to our
                Website, and other related services, including any sales,
                marketing, or events
              </li>
            </ul>
            <p>
              The purpose of this privacy notice is to explain to you in the
              clearest way possible what information we collect, how we use it,
              and what rights you have in relation to it. If there are any terms
              in this privacy notice that you do not agree with, please
              discontinue use of our Services immediately.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us
              when you express an interest in obtaining information about us or
              our products and Services, when you participate in activities on
              the Website or otherwise when you contact us.
            </p>
            <p>
              The personal information that we collect depends on the context of
              your interactions with us and the Website, the choices you make
              and the products and features you use. The personal information we
              collect may include the following:
            </p>
            <ul>
              <li>
                <strong>Personal Information Provided by You:</strong> We
                collect names; phone numbers; email addresses; mailing
                addresses; job titles; contact preferences; billing addresses;
                and other similar information.
              </li>
              <li>
                <strong>Usage Data:</strong> We may also collect information how
                the Service is accessed and used (&quot;Usage Data&quot;). This
                Usage Data may include information such as your computer&apos;s
                Internet Protocol address (e.g. IP address), browser type,
                browser version, the pages of our Service that you visit, the
                time and date of your visit, the time spent on those pages,
                unique device identifiers and other diagnostic data.
              </li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
              We use personal information collected via our Website for a
              variety of business purposes described below. We process your
              personal information for these purposes in reliance on our
              legitimate business interests, in order to enter into or perform a
              contract with you, with your consent, and/or for compliance with
              our legal obligations. We indicate the specific processing grounds
              we rely on next to each purpose listed below.
            </p>
            <p>We use the information we collect or receive:</p>
            <ul>
              <li>
                <strong>
                  To facilitate account creation and logon process.
                </strong>
              </li>
              <li>
                <strong>To post testimonials.</strong> We post testimonials on
                our Website that may contain personal information. Prior to
                posting a testimonial, we will obtain your consent to use your
                name and the content of the testimonial.
              </li>
              <li>
                <strong>Request feedback.</strong> We may use your information
                to request feedback and to contact you about your use of our
                Website.
              </li>
              <li>
                <strong>To manage user accounts.</strong> We may use your
                information for the purposes of managing our account and keeping
                it in working order.
              </li>
              <li>
                <strong>To send administrative information to you.</strong> We
                may use your personal information to send you product, service
                and new feature information and/or information about changes to
                our terms, conditions, and policies.
              </li>
              <li>
                <strong>To protect our Services.</strong> We may use your
                information as part of our efforts to keep our Website safe and
                secure (for example, for fraud monitoring and prevention).
              </li>
              <li>
                <strong>
                  To enforce our terms, conditions and policies for business
                  purposes, to comply with legal and regulatory requirements or
                  in connection with our contract.
                </strong>
              </li>
              <li>
                <strong>To respond to legal requests and prevent harm.</strong>{" "}
                If we receive a subpoena or other legal request, we may need to
                inspect the data we hold to determine how to respond.
              </li>
              <li>
                <strong>Fulfill and manage your orders.</strong> We may use your
                information to fulfill and manage your orders, payments,
                returns, and exchanges made through the Website.
              </li>
              <li>
                <strong>Administer prize draws and competitions.</strong> We may
                use your information to administer prize draws and competitions
                when you elect to participate in our competitions.
              </li>
              <li>
                <strong>
                  To deliver and facilitate delivery of services to the user.
                </strong>{" "}
                We may use your information to provide you with the requested
                service.
              </li>
              <li>
                <strong>
                  To respond to user inquiries/offer support to users.
                </strong>{" "}
                We may use your information to respond to your inquiries and
                solve any potential issues you might have with the use of our
                Services.
              </li>
              <li>
                <strong>
                  To send you marketing and promotional communications.
                </strong>{" "}
                We and/or our third-party marketing partners may use the
                personal information you send to us for our marketing purposes,
                if this is in accordance with your marketing preferences. You
                can opt-out of our marketing emails at any time.
              </li>
              <li>
                <strong>Deliver targeted advertising to you.</strong> We may use
                your information to develop and display personalized content and
                advertising.
              </li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>
              We may process or share your data that we hold based on the
              following legal basis:
            </p>
            <ul>
              <li>
                <strong>Consent:</strong> We may process your data if you have
                given us specific consent to use your personal information for a
                specific purpose.
              </li>
              <li>
                <strong>Legitimate Interests:</strong> We may process your data
                when it is reasonably necessary to achieve our legitimate
                business interests.
              </li>
              <li>
                <strong>Performance of a Contract:</strong> Where we have
                entered into a contract with you, we may process your personal
                information to fulfill the terms of our contract.
              </li>
              <li>
                <strong>Legal Obligations:</strong> We may disclose your
                information where we are legally required to do so in order to
                comply with applicable law, governmental requests, a judicial
                proceeding, court order, or legal process, such as in response
                to a court order or a subpoena.
              </li>
              <li>
                <strong>Vital Interests:</strong> We may disclose your
                information where we believe it is necessary to investigate,
                prevent, or take action regarding potential violations of our
                policies, suspected fraud, situations involving potential
                threats to the safety of any person and illegal activities, or
                as evidence in litigation in which we are involved.
              </li>
            </ul>
            <p>
              More specifically, we may need to process your data or share your
              personal information in the following situations: Business
              Transfers, Affiliates, Business Partners.
            </p>

            <h2>5. Cookies and Tracking Technologies</h2>
            <p>
              We may use cookies and similar tracking technologies (like web
              beacons and pixels) to access or store information. Specific
              information about how we use such technologies and how you can
              refuse certain cookies is set out in our Cookie Policy (if
              applicable, otherwise, this section can be expanded).
            </p>

            <h2>6. Data Security</h2>
            <p>
              We have implemented appropriate technical and organizational
              security measures designed to protect the security of any personal
              information we process. However, despite our safeguards and
              efforts to secure your information, no electronic transmission
              over the Internet or information storage technology can be
              guaranteed to be 100% secure, so we cannot promise or guarantee
              that hackers, cybercriminals, or other unauthorized third parties
              will not be able to defeat our security, and improperly collect,
              access, steal, or modify your information. Although we will do our
              best to protect your personal information, transmission of
              personal information to and from our Website is at your own risk.
              You should only access the Website within a secure environment.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We will only keep your personal information for as long as it is
              necessary for the purposes set out in this privacy notice, unless
              a longer retention period is required or permitted by law (such as
              tax, accounting or other legal requirements). No purpose in this
              notice will require us keeping your personal information for
              longer than the period of time in which users have an account with
              us.
            </p>

            <h2>8. Your Data Protection Rights</h2>
            <p>
              Depending on your location, you may have certain rights under
              applicable data protection laws. These may include the right (i)
              to request access and obtain a copy of your personal information,
              (ii) to request rectification or erasure; (iii) to restrict the
              processing of your personal information; and (iv) if applicable,
              to data portability. In certain circumstances, you may also have
              the right to object to the processing of your personal
              information. To make such a request, please use the contact
              details provided below. We will consider and act upon any request
              in accordanceance with applicable data protection laws.
            </p>
            <p>
              If we are relying on your consent to process your personal
              information, you have the right to withdraw your consent at any
              time. Please note however that this will not affect the lawfulness
              of the processing before its withdrawal, nor will it affect the
              processing of your personal information conducted in reliance on
              lawful processing grounds other than consent.
            </p>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13 (or 16 in
              some jurisdictions). We do not knowingly collect personally
              identifiable information from children under 13. If you are a
              parent or guardian and you are aware that your child has provided
              us with Personal Data, please contact us. If we become aware that
              we have collected Personal Data from children without verification
              of parental consent, we take steps to remove that information from
              our servers.
            </p>

            <h2>10. Links to Other Websites</h2>
            <p>
              Our Service may contain links to other websites that are not
              operated by us. If you click on a third party link, you will be
              directed to that third party&apos;s site. We strongly advise you
              to review the Privacy Policy of every site you visit. We have no
              control over and assume no responsibility for the content, privacy
              policies or practices of any third party sites or services.
            </p>

            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy notice from time to time. The updated
              version will be indicated by an updated &quot;Last updated&quot;
              date and the updated version will be effective as soon as it is
              accessible. If we make material changes to this privacy notice, we
              may notify you either by prominently posting a notice of such
              changes or by directly sending you a notification. We encourage
              you to review this privacy notice frequently to be informed of how
              we are protecting your information.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have questions or comments about this notice, you may email
              us at{" "}
              <a href="mailto:contact@unite-group.in">
                contact@unite-group.in
              </a>{" "}
              or by post to:
            </p>
            <p>
              Unite Group
              <br />
              Union Place, Ipswich CBD
              <br />
              Queensland, Australia
            </p>
          </div>

          <div className="mt-16 text-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
              >
                Contact Us For Any Queries{" "}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

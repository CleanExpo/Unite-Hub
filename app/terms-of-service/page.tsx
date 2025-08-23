import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Unite Group",
  description:
    "Read the terms and conditions for using Unite Group's website and services.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "June 13, 2025"; // Update this date as needed

  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="mx-auto h-16 w-16 text-amber-400 mb-6" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Terms of Service
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
            Please read these terms carefully before using our services. This is
            a binding legal agreement.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert prose-lg max-w-none text-slate-300 prose-headings:text-white prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-strong:text-slate-100">
            <p className="border-l-4 border-amber-500 pl-4 italic text-slate-400">
              <strong>Important Note:</strong> This is a template Terms of
              Service and should be reviewed by a legal professional to ensure
              it complies with all applicable laws and regulations specific to
              your business operations and jurisdiction.
            </p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By using our Services (as defined in our Privacy Policy), you
              agree to be bound by these Terms of Service (&quot;Terms&quot;).
              If you do not agree to these Terms, do not use our Services.
            </p>

            <h2>2. Use of Our Services</h2>
            <p>To use our Services, you must agree to these terms.</p>
            <ul>
              <li>
                <strong>Eligibility:</strong> You must be at least 13 years old
                (or 16 in some jurisdictions) to use our Services. By agreeing
                to these Terms, you represent and warrant to us that you are of
                legal age to form a binding contract.
              </li>
              <li>
                <strong>User Accounts:</strong> You may need to create an
                account to access some of our Services. You are responsible for
                safeguarding your account and for all activities that occur
                under it.
              </li>
              <li>
                <strong>Acceptable Use:</strong> You agree not to misuse the
                Services or help anyone else to do so. This includes, but is not
                limited to, probing, scanning, or testing the vulnerability of
                any system or network.
              </li>
            </ul>

            <h2>3. Intellectual Property Rights</h2>
            <p>
              The Services and their original content (excluding Content
              provided by you or other users), features and functionality are
              and will remain the exclusive property of Unite Group and its
              licensors. Our trademarks and trade dress may not be used in
              connection with any product or service without the prior written
              consent of Unite Group.
            </p>

            <h2>4. User Content</h2>
            <p>
              Our Service may allow you to post, link, store, share and
              otherwise make available certain information, text, graphics,
              videos, or other material (&quot;Content&quot;). You are
              responsible for the Content that you post on or through the
              Service, including its legality, reliability, and appropriateness.
            </p>
            <p>
              By posting Content on or through the Service, You represent and
              warrant that: (i) the Content is yours (you own it) and/or you
              have the right to use it and the right to grant us the rights and
              license as provided in these Terms, and (ii) that the posting of
              your Content on or through the Service does not violate the
              privacy rights, publicity rights, copyrights, contract rights or
              any other rights of any person or entity.
            </p>

            <h2>5. Prohibited Activities</h2>
            <p>
              You may not access or use the Website for any purpose other than
              that for which we make the Website available. The Website may not
              be used in connection with any commercial endeavors except those
              that are specifically endorsed or approved by us.
            </p>
            <p>As a user of the Website, you agree not to:</p>
            <ul>
              <li>
                Systematically retrieve data or other content from the Website
                to create or compile, directly or indirectly, a collection,
                compilation, database, or directory without written permission
                from us.
              </li>
              <li>
                Trick, defraud, or mislead us and other users, especially in any
                attempt to learn sensitive account information such as user
                passwords.
              </li>
              <li>
                Circumvent, disable, or otherwise interfere with
                security-related features of the Website, including features
                that prevent or restrict the use or copying of any Content or
                enforce limitations on the use of the Website and/or the Content
                contained therein.
              </li>
              <li>
                Disparage, tarnish, or otherwise harm, in our opinion, us and/or
                the Website.
              </li>
              <li>
                Use any information obtained from the Website in order to
                harass, abuse, or harm another person.
              </li>
              <li>
                Engage in any automated use of the system, such as using scripts
                to send comments or messages, or using any data mining, robots,
                or similar data gathering and extraction tools.
              </li>
            </ul>

            <h2>6. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the
              Service immediately, without prior notice or liability, under our
              sole discretion, for any reason whatsoever and without limitation,
              including but not limited to a breach of the Terms.
            </p>

            <h2>7. Disclaimers and Limitation of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; BASIS. USE OF THE SERVICE IS AT YOUR OWN RISK. TO
              THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS
              PROVIDED WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
              IMPLIED.
            </p>
            <p>
              IN NO EVENT SHALL UNITE GROUP, NOR ITS DIRECTORS, EMPLOYEES,
              PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES,
              INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE,
              GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS
              TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </p>

            <h2>8. Indemnification</h2>
            <p>
              You agree to defend, indemnify and hold harmless Unite Group and
              its licensee and licensors, and their employees, contractors,
              agents, officers and directors, from and against any and all
              claims, damages, obligations, losses, liabilities, costs or debt,
              and expenses (including but not limited to attorney&apos;s fees),
              resulting from or arising out of a) your use and access of the
              Service, by you or any person using your account and password; b)
              a breach of these Terms, or c) Content posted on the Service.
            </p>

            <h2>9. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of Queensland, Australia, without regard to its conflict of
              law provisions. Any disputes will be resolved in the courts of
              Queensland.
            </p>

            <h2>10. Changes to These Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material we will provide
              at least 30 days&apos; notice prior to any new terms taking
              effect. What constitutes a material change will be determined at
              our sole discretion.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:contact@unite-group.in">
                contact@unite-group.in
              </a>
              .
            </p>
          </div>

          <div className="mt-16 text-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
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

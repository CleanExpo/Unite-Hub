import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle,
  Handshake,
  Users,
  GitFork,
  Zap,
  TrendingUp,
  Network,
  ShieldCheck,
  Rocket,
  Brain,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function UniteEcosystemPage() {
  const partners = [
    { name: "AWS", description: "Cloud computing services" },
    { name: "Google Cloud", description: "Cloud computing platform" },
    { name: "Microsoft Azure", description: "Cloud computing service" },
    { name: "Stripe", description: "Online payment processing" },
    { name: "Salesforce", description: "Customer Relationship Management" },
    { name: "HubSpot", description: "Marketing, sales, and service software" },
  ]

  const ecosystemPillars = [
    {
      icon: Handshake,
      title: "Strategic Alliances",
      description:
        "We forge powerful alliances with industry frontrunners, thought leaders, and specialized service providers. These collaborations are built on mutual trust and shared objectives, enabling us to extend our service capabilities, co-create innovative solutions, and deliver comprehensive, end-to-end value propositions that address complex client challenges with unmatched expertise.",
      image: "/diverse-professionals-handshake-modern-office-setting.png",
      keyOutcomes: [
        "Access to specialized, niche expertise.",
        "Joint development of cutting-edge solutions.",
        "Expanded market reach and service offerings.",
        "Enhanced problem-solving capabilities for clients.",
      ],
    },
    {
      icon: GitFork,
      title: "Technology Partnerships",
      description:
        "Our technology partnerships are foundational to our innovation engine. We collaborate intimately with leading global software, hardware, and platform providers. This allows us to integrate state-of-the-art tools, from advanced cloud infrastructure and AI/ML frameworks to robust data analytics and cybersecurity platforms, ensuring our clients benefit from the latest technological advancements and achieve transformative operational efficiencies.",
      image: "/glowing-network-lines-connecting-tech-logos-dark-background.png",
      keyOutcomes: [
        "Early access to emerging technologies.",
        "Optimized and scalable technology stacks.",
        "Seamless integration of best-in-class tools.",
        "Accelerated digital transformation for clients.",
      ],
    },
    {
      icon: Users,
      title: "Community & Academic Engagement",
      description:
        "Unite Group is deeply committed to nurturing the broader tech ecosystem and fostering future talent. We actively participate in open-source projects, contribute to academic research, support educational initiatives and bootcamps, sponsor tech conferences and local meetups, and mentor emerging professionals. We believe a vibrant, knowledgeable community fuels collective innovation and sustainable growth for all stakeholders.",
      image: "/students-professionals-collaborating-tech-workshop-bright-room.png",
      keyOutcomes: [
        "Contribution to open-source innovation.",
        "Development of future tech talent.",
        "Knowledge sharing and industry best practices.",
        "Strengthened local and global tech communities.",
      ],
    },
  ]

  const clientAdvantages = [
    {
      icon: Brain,
      title: "Holistic Expertise",
      description: "Access a wider pool of specialized knowledge and cross-industry insights through our network.",
    },
    {
      icon: Rocket,
      title: "Accelerated Innovation",
      description: "Benefit from faster adoption of cutting-edge technologies and co-created solutions.",
    },
    {
      icon: ShieldCheck,
      title: "Integrated & Robust Solutions",
      description: "Receive comprehensive, seamlessly integrated solutions that address your unique challenges.",
    },
    {
      icon: TrendingUp,
      title: "Future-Proof Growth",
      description: "Stay ahead with solutions built on a foundation of collaborative strength and foresight.",
    },
  ]

  const partnershipBenefits = [
    {
      icon: Zap,
      title: "Drive Innovation Together",
      description:
        "Engage in a dynamic, collaborative environment where pioneering ideas are nurtured, and new solutions are co-developed by leveraging collective intelligence and diverse perspectives.",
    },
    {
      icon: TrendingUp,
      title: "Expand Your Horizons",
      description:
        "Unlock access to new customer segments, untapped markets, and diverse geographies through synergistic joint marketing initiatives and an expanded, high-quality referral network.",
    },
    {
      icon: Network,
      title: "Amplify Your Capabilities",
      description:
        "Complement and enhance your existing offerings with Unite Group's deep expertise, extensive resources, and established market presence, delivering more comprehensive and impactful value to your clients.",
    },
  ]

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/abstract-network-ecosystem-background.png"
            alt="Abstract digital network representing the Unite Ecosystem"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 mb-6">
            The Unite Ecosystem
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            Connecting expertise, technology, and communities to create synergistic value and drive collective growth
            through powerful, strategic partnerships.
          </p>
        </div>
      </section>

      {/* Ecosystem Overview Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white mb-6">
                Strength in Collaboration, Power in Collective Unity
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                The Unite Ecosystem is far more than a network; it's a dynamic, living confluence of strategic partners,
                pioneering technology providers, seasoned industry experts, and vibrant community initiatives. We are
                firm believers that by cultivating robust, transparent collaborations, we can deliver solutions that are
                not only comprehensive and innovative but also deeply impactful for our clients. This approach allows us
                to transcend individual limitations and achieve a state of collective excellence and shared, sustainable
                success.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Our ecosystem is meticulously architected upon a foundation of shared values: relentless innovation,
                unwavering commitment to quality, and a profound dedication to client success. Together, we harness our
                amalgamated strengths to dissect and conquer the most intricate challenges, unlock emergent
                opportunities, and collaboratively co-create the future—a future that no single entity could manifest in
                isolation.
              </p>
            </div>
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/corporate-timeline-montage.png"
                alt="Dynamic abstract visualization of a global collaboration network with interconnected nodes and flowing energy, conveying synergy and technological advancement."
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Our Ecosystem Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-16">
            Foundational Pillars of the Unite Ecosystem
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {ecosystemPillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="bg-slate-800 border-slate-700 text-slate-50 flex flex-col hover:shadow-orange-400/30 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative w-full h-56">
                  <Image
                    src={pillar.image || "/placeholder.svg"}
                    alt={`Illustrative image for ${pillar.title}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-md"
                  />
                </div>
                <CardHeader className="items-center text-center pt-6">
                  <pillar.icon size={36} className="mb-3 text-orange-400" />
                  <CardTitle className="text-xl text-white">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <p className="text-slate-300 text-center text-sm leading-relaxed mb-4 flex-grow">
                    {pillar.description}
                  </p>
                  <div className="mt-auto border-t border-slate-700 pt-4">
                    <h4 className="text-sm font-semibold text-orange-300 mb-2 text-center">Key Outcomes:</h4>
                    <ul className="space-y-1 text-xs text-slate-400">
                      {pillar.keyOutcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start">
                          <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Ecosystem Advantage for Clients Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">The Unite Ecosystem Advantage for Your Business</h2>
            <p className="text-slate-400 max-w-3xl mx-auto">
              Our interconnected ecosystem translates directly into tangible benefits for our clients, empowering them
              to achieve more and navigate the complexities of the modern business landscape with confidence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            {clientAdvantages.map((advantage) => (
              <Card
                key={advantage.title}
                className="bg-slate-800 border-slate-700 text-slate-50 p-6 text-center h-full flex flex-col"
              >
                <div className="flex justify-center mb-4">
                  <advantage.icon className="h-12 w-12 text-amber-400" />
                </div>
                <CardTitle className="text-lg text-white mb-2">{advantage.title}</CardTitle>
                <p className="text-slate-300 text-sm leading-relaxed flex-grow">{advantage.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Image
              src="/client-centric-solutions-network-visualization.png"
              alt="Visualization of client-centric solutions emerging from a network"
              width={700}
              height={400}
              className="mx-auto rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits of Partnering Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">Why Partner with Unite Group?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Joining the Unite Ecosystem offers strategic advantages designed to foster innovation, accelerate growth,
              and ensure mutual, long-term success.
            </p>
          </div>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {partnershipBenefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="bg-slate-800 border-slate-700 text-slate-50 p-6 h-full flex flex-col"
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <benefit.icon className="h-10 w-10 text-orange-400 flex-shrink-0" />
                  <CardTitle className="text-xl text-white">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-slate-300 text-sm leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Image
              src="/diverse-professionals-strategic-meeting-boardroom.png"
              alt="Diverse group of professionals in a modern boardroom discussing strategy"
              width={800}
              height={450}
              className="mx-auto rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Our Esteemed Technology Partners Section - Redesigned */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-6">Our Esteemed Technology Partners</h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16">
            We are privileged to collaborate with these industry-leading technology companies, integrating their
            pioneering solutions to deliver exceptional outcomes and drive innovation for our clients.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="group relative p-6 rounded-xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 shadow-lg 
                           hover:from-orange-500 hover:via-amber-500 hover:to-yellow-500 
                           transition-all duration-300 ease-in-out transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-black opacity-20 group-hover:opacity-0 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-slate-900 transition-colors duration-300">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-slate-400 group-hover:text-slate-800 transition-colors duration-300">
                    {partner.description}
                  </p>
                </div>
                {/* Optional: Subtle background pattern or texture for added "sexiness" */}
                <div
                  className="absolute inset-0 z-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundImage: "url('/subtle-tech-pattern.png')", backgroundSize: "cover" }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Become a Partner Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">Become a Catalyst in Our Vision</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We are perpetually seeking innovative companies, visionary leaders, and specialized experts to join our
              thriving network and collaborate on architecting the future of technology and business solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-6">Our Ideal Partner Profile</h3>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 text-orange-400 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold text-white block">Aligned Vision & Values:</strong> A profound
                    commitment to pioneering innovation, delivering exceptional quality, and maintaining unwavering
                    customer-centricity.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 text-orange-400 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold text-white block">Synergistic Expertise:</strong> Specialized
                    skills, unique technological assets, or privileged market access that enhances our collective
                    service offering and amplifies our shared value proposition.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 text-orange-400 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold text-white block">Collaborative & Growth Mindset:</strong> A
                    genuine enthusiasm for working transparently, co-creating substantial value for clients, and a
                    relentless pursuit of continuous learning and adaptation.
                  </span>
                </li>
              </ul>
            </div>
            <Card className="bg-slate-800 border-slate-700 text-slate-50 p-8 shadow-xl hover:shadow-orange-500/40 transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white text-center">Ready to Explore Synergies?</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-300 mb-8">
                  If your organization resonates with our passion for innovation and our commitment to excellence, we
                  cordially invite you to initiate a conversation about potential partnership opportunities. Let's
                  co-create the future, together.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-300"
                  asChild
                >
                  <Link href="/contact?subject=EcosystemPartnershipInquiry&message=I'm interested in learning more about partnership opportunities with Unite Group.">
                    Connect With Our Partnership Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, TestTube2, Bot, Zap, Lightbulb, Rocket, Microscope, CloudCog, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function InnovationLabPage() {
  const researchAreas = [
    {
      name: "Generative AI & LLMs",
      icon: Bot,
      description:
        "Pioneering advanced applications in natural language understanding, content generation, and AI-driven automation solutions.",
    },
    {
      name: "Quantum Computing Applications",
      icon: Cpu,
      description:
        "Exploring and preparing for the transformative potential of quantum algorithms in complex problem-solving and optimization.",
    },
    {
      name: "Advanced Data Science & Predictive Analytics",
      icon: BarChart3,
      description:
        "Developing novel algorithms and models for deeper data insights, forecasting, and data-driven decision-making.",
    },
    {
      name: "Sustainable & Ethical Technology",
      icon: TestTube2,
      description:
        "Researching and promoting the development of environmentally conscious and ethically sound technological solutions.",
    },
  ]

  const innovationPipeline = [
    {
      name: "Ideation & Discovery",
      icon: Lightbulb,
      description:
        "Identifying emerging trends, challenges, and opportunities through market research and collaborative brainstorming.",
    },
    {
      name: "Research & Feasibility",
      icon: Microscope,
      description:
        "Conducting in-depth studies and experiments to validate concepts and assess technological viability.",
    },
    {
      name: "Prototyping & MVP Development",
      icon: Rocket,
      description: "Building functional prototypes and Minimum Viable Products (MVPs) for rapid testing and iteration.",
    },
    {
      name: "Pilot & Integration Pathways",
      icon: Zap,
      description:
        "Exploring pathways for successful pilot programs and potential integration into client solutions or new ventures.",
    },
  ]

  const techTools = [
    { name: "Python & R", description: "For statistical analysis and ML model development." },
    { name: "TensorFlow & PyTorch", description: "Deep learning frameworks." },
    { name: "Kubernetes & Docker", description: "For scalable deployment of experiments." },
    { name: "AWS & Azure AI Services", description: "Leveraging cloud-native AI capabilities." },
    { name: "Jupyter Notebooks", description: "For collaborative research and data exploration." },
    { name: "Git & Agile Methodologies", description: "For version control and iterative development." },
  ]

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative py-24 md:py-40 bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/futuristic-ai-brain-network-visualization.png"
            alt="Futuristic AI Brain Network Visualization"
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 mb-8">
            Unite Group Innovation Lab
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            Catalyzing breakthrough solutions by exploring the frontiers of technology. We are dedicated to research,
            experimentation, and the creation of impactful innovations.
          </p>
        </div>
      </section>

      {/* About the Lab Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="prose prose-invert lg:prose-xl max-w-none">
              <h2 className="text-3xl font-semibold text-white mb-6">The Epicenter of Next-Generation Ideas</h2>
              <p className="text-slate-300">
                The Unite Group Innovation Lab is more than just a research facility; it's a dynamic ecosystem where
                brilliant minds converge to challenge the status quo. Our philosophy is rooted in a passion for
                discovery, a commitment to rigorous scientific methods, and a drive to translate complex research into
                tangible value.
              </p>
              <p className="text-slate-300">
                We foster an environment of intellectual curiosity and open collaboration, attracting diverse talent
                from fields like artificial intelligence, data science, software engineering, and strategic foresight.
                Our team thrives on tackling complex problems and pioneering solutions that anticipate the needs of
                tomorrow.
              </p>
            </div>
            <div>
              <Image
                src="/diverse-research-team-collaborating-modern-lab.png"
                alt="Diverse research team collaborating in a modern innovation lab setting"
                width={600}
                height={450}
                className="rounded-lg shadow-2xl object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Research Areas Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-16">Pioneering Research at the Forefront</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {researchAreas.map((area) => (
              <Card
                key={area.name}
                className="bg-slate-800/70 border-slate-700 text-slate-50 hover:shadow-purple-500/40 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardHeader className="items-center text-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4 inline-block">
                    <area.icon size={32} className="text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">{area.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm text-center">{area.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Innovation Pipeline Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-16">Our Innovation Pipeline</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {innovationPipeline.map((stage) => (
              <div
                key={stage.name}
                className="flex flex-col items-center text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-pink-500/50 transition-colors"
              >
                <stage.icon size={40} className="mb-4 text-pink-400" />
                <h3 className="text-xl font-semibold text-white mb-2">{stage.name}</h3>
                <p className="text-slate-400 text-sm">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Project Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">Featured Project: "Helios" Predictive Engine</h2>
            <p className="text-slate-300 max-w-3xl mx-auto">
              An advanced AI engine developed in-house, designed to analyze vast datasets and predict market dynamics,
              customer behavior, and operational efficiencies with remarkable accuracy.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Image
                src="/interactive-dashboard-helios-predictive-analytics.png"
                alt="Interactive dashboard showcasing the Helios predictive analytics engine in action"
                width={600}
                height={450}
                className="rounded-lg shadow-2xl object-cover"
              />
            </div>
            <div className="order-1 md:order-2 prose prose-invert lg:prose-lg max-w-none">
              <h3 className="text-2xl font-semibold text-white mb-4">Unveiling Helios</h3>
              <p className="text-slate-300">
                Project Helios represents a significant leap in our predictive capabilities. This machine learning
                framework ingests and processes diverse, high-velocity data streams—from financial markets and supply
                chain logistics to social sentiment and IoT sensor data—to identify subtle patterns and forecast future
                outcomes. Its potential applications span across industries, offering proactive insights for strategic
                decision-making.
              </p>
              <h4 className="text-xl font-semibold text-white mt-6 mb-3">Core Innovations:</h4>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start">
                  <Zap className="h-5 w-5 mr-3 mt-1 text-pink-400 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Adaptive Neural Architecture:</strong> Utilizes a proprietary,
                    self-optimizing neural network that adapts to evolving data landscapes.
                  </span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-5 w-5 mr-3 mt-1 text-pink-400 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Hyper-Dimensional Analysis:</strong> Capable of processing and
                    correlating thousands of variables in real-time for comprehensive insights.
                  </span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-5 w-5 mr-3 mt-1 text-pink-400 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Transparent AI (XAI) Core:</strong> Designed with explainability
                    modules to provide clear, interpretable rationale behind its predictions, fostering trust and
                    actionability.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech & Tools Powering Innovation Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-16">
            Technology & Tools Fueling Our Discoveries
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 text-center">
            {techTools.map((tool) => (
              <div key={tool.name} className="p-4 bg-slate-800/60 rounded-lg border border-slate-700">
                <CloudCog size={32} className="mx-auto mb-3 text-purple-400" />
                <h4 className="text-md font-semibold text-white mb-1">{tool.name}</h4>
                {/* <p className="text-xs text-slate-400">{tool.description}</p> */}
              </div>
            ))}
          </div>
          <p className="text-center text-slate-400 mt-8 max-w-2xl mx-auto">
            Our lab is equipped with a state-of-the-art technology stack, enabling our researchers to push the
            boundaries of what's possible. We leverage leading AI/ML frameworks, cloud computing resources, and
            collaborative platforms.
          </p>
        </div>
      </section>

      {/* Impact & Future Outlook Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="prose prose-invert lg:prose-xl max-w-none">
              <h2 className="text-3xl font-semibold text-white mb-6">Shaping Tomorrow, Today</h2>
              <p className="text-slate-300">
                The innovations born from Unite Group's Lab are not just theoretical exercises. They are designed to
                drive tangible impact for our clients, helping them navigate complexity, unlock new revenue streams, and
                build resilient, future-proof businesses.
              </p>
              <p className="text-slate-300">
                Looking ahead, we are committed to expanding our research into areas like decentralized AI, advanced
                cybersecurity protocols, and the intersection of AI with human augmentation. Our goal is to remain at
                the vanguard of technological evolution, translating pioneering research into practical, world-changing
                applications.
              </p>
            </div>
            <div>
              <Image
                src="/glowing-abstract-representation-future-technology-impact.png"
                alt="Glowing abstract representation of future technology and its impact"
                width={600}
                height={450}
                className="rounded-lg shadow-2xl object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-t from-black via-slate-950 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-8">
            Partner with Us on the Path to Innovation
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-10">
            Do you have a complex challenge that requires cutting-edge thinking? Or are you interested in exploring
            collaborative research opportunities? Reach out to our Innovation Lab.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-10 py-4 rounded-lg shadow-xl transition duration-300 text-lg"
            asChild
          >
            <Link href="/contact?subject=InnovationLabCollaborationInquiry">Engage Our Experts</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

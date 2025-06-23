import { Search, Lightbulb, Code2, Rocket } from "lucide-react" // Example icons

const processSteps = [
  {
    id: 1,
    title: "Discovery & Strategy",
    description: "We start by deeply understanding your business, challenges, and goals to craft a tailored strategy.",
    icon: Search,
  },
  {
    id: 2,
    title: "Design & Prototyping",
    description: "Our team designs intuitive solutions and creates prototypes to visualize the path forward.",
    icon: Lightbulb,
  },
  {
    id: 3,
    title: "Development & Implementation",
    description: "Leveraging cutting-edge technologies, we build robust solutions and integrate them seamlessly.",
    icon: Code2,
  },
  {
    id: 4,
    title: "Launch & Growth",
    description:
      "We ensure a smooth launch and provide ongoing support to help you scale and achieve long-term success.",
    icon: Rocket,
  },
]

export default function OurProcessSection() {
  return (
    <section className="py-12 md:py-16 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-center text-white mb-4">Our Path to Your Success</h2>
        <p className="text-center text-slate-400 max-w-2xl mx-auto mb-10 md:mb-12">
          We follow a proven, collaborative process designed to deliver impactful results and ensure your objectives are
          met.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {processSteps.map((step) => {
            const IconComponent = step.icon
            return (
              <div
                key={step.id}
                className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 text-left shadow-md"
              >
                <div className="flex items-center gap-3 mb-3">
                  <IconComponent className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

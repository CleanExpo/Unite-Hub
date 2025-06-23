import { TrendingUp, CheckCircle, Users, Globe } from "lucide-react" // Example icons

const stats = [
  {
    value: "50+",
    label: "Successful Projects Delivered",
    icon: CheckCircle,
    description: "Across diverse industries and complex challenges.",
  },
  {
    value: "95%",
    label: "Client Satisfaction Rate",
    icon: Users,
    description: "Based on post-project feedback and long-term partnerships.",
  },
  {
    value: "40%",
    label: "Avg. Operational Efficiency Gain",
    icon: TrendingUp,
    description: "Reported by clients after implementing our solutions.",
  },
  {
    value: "10+",
    label: "Countries Served",
    icon: Globe,
    description: "Helping businesses achieve global reach and impact.",
  },
]

export default function AggregateStatsSection() {
  return (
    <section className="py-12 md:py-16 bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-center text-white mb-4">Our Collective Impact by the Numbers</h2>
        <p className="text-center text-slate-400 max-w-2xl mx-auto mb-10 md:mb-12">
          We measure our success by the success of our clients. Here's a glimpse of what we've achieved together.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-slate-800/70 p-6 rounded-lg border border-slate-700/50 text-center shadow-lg hover:border-cyan-500/50 transition-all"
              >
                <div className="flex justify-center mb-3">
                  <IconComponent className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
                <h3 className="text-lg font-medium text-slate-300 mb-2">{stat.label}</h3>
                <p className="text-xs text-slate-400">{stat.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

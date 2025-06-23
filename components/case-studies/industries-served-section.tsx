import { caseStudies } from "@/lib/case-studies-data"
import { Badge } from "@/components/ui/badge"
import { Building, ShoppingCart, Truck, Stethoscope, Factory, Lightbulb } from "lucide-react" // Example icons
import type { LucideIcon } from "lucide-react"

interface IndustryIconMap {
  [key: string]: LucideIcon
}

const industryIconMap: IndustryIconMap = {
  "SaaS & Technology": Building,
  "E-commerce & Retail": ShoppingCart,
  "Logistics & Supply Chain": Truck,
  "Healthcare Services": Stethoscope,
  "International Trade & Manufacturing": Factory,
  Default: Lightbulb,
}

export default function IndustriesServedSection() {
  const uniqueIndustries = Array.from(new Set(caseStudies.map((cs) => cs.industry))).sort()

  return (
    <section className="py-12 md:py-16 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-center text-white mb-4">Industries We Transform</h2>
        <p className="text-center text-slate-400 max-w-2xl mx-auto mb-10">
          Our expertise spans across diverse sectors, delivering tailored solutions that address unique industry
          challenges and drive growth.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {uniqueIndustries.map((industry) => {
            const IconComponent = industryIconMap[industry] || industryIconMap["Default"]
            return (
              <Badge
                key={industry}
                variant="outline"
                className="text-sm md:text-base px-4 py-2 border-cyan-500/70 text-cyan-400 bg-slate-800/50 flex items-center gap-2 transition-all hover:bg-cyan-500/10 hover:shadow-md"
              >
                <IconComponent size={18} />
                {industry}
              </Badge>
            )
          })}
        </div>
      </div>
    </section>
  )
}

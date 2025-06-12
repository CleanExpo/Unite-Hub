"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface ServiceFeature {
  name: string;
  description: string;
  consultation: boolean | string;
  development: boolean | string;
  seo: boolean | string;
  strategy: boolean | string;
  qa: boolean | string;
  education: boolean | string;
}

const features: ServiceFeature[] = [
  {
    name: "Initial Assessment",
    description: "Comprehensive analysis of your current business state",
    consultation: true,
    development: "Basic",
    seo: true,
    strategy: true,
    qa: "Basic",
    education: false
  },
  {
    name: "Custom Development",
    description: "Tailored software solutions for your specific needs",
    consultation: false,
    development: true,
    seo: false,
    strategy: false,
    qa: true,
    education: false
  },
  {
    name: "Market Research",
    description: "In-depth analysis of your market and competitors",
    consultation: true,
    development: false,
    seo: true,
    strategy: true,
    qa: false,
    education: false
  },
  {
    name: "Technical Architecture",
    description: "Design and planning of technical infrastructure",
    consultation: true,
    development: true,
    seo: false,
    strategy: true,
    qa: true,
    education: "Available"
  },
  {
    name: "Performance Optimization",
    description: "Speed and efficiency improvements",
    consultation: false,
    development: true,
    seo: true,
    strategy: false,
    qa: true,
    education: false
  },
  {
    name: "Team Training",
    description: "Upskilling your team with latest technologies",
    consultation: "Available",
    development: "Available",
    seo: "Available",
    strategy: "Available",
    qa: "Available",
    education: true
  },
  {
    name: "Ongoing Support",
    description: "Continuous assistance and maintenance",
    consultation: "3 months",
    development: "12 months",
    seo: "6 months",
    strategy: "6 months",
    qa: "12 months",
    education: "3 months"
  },
  {
    name: "Analytics & Reporting",
    description: "Detailed insights and progress tracking",
    consultation: true,
    development: true,
    seo: true,
    strategy: true,
    qa: true,
    education: true
  },
  {
    name: "Strategic Roadmap",
    description: "Long-term planning and milestone setting",
    consultation: true,
    development: true,
    seo: true,
    strategy: true,
    qa: false,
    education: false
  },
  {
    name: "Compliance & Security",
    description: "Ensuring regulatory compliance and security standards",
    consultation: "Basic",
    development: true,
    seo: false,
    strategy: true,
    qa: true,
    education: "Available"
  }
];

const services = [
  {
    id: "consultation",
    name: "Initial Consultation",
    price: "$550",
    popular: false,
    description: "Perfect starting point for any business transformation",
    cta: "Book Consultation",
    href: "/services/initial-consultation"
  },
  {
    id: "development",
    name: "Software Development",
    price: "Custom Quote",
    popular: true,
    description: "End-to-end custom software solutions",
    cta: "Get Quote",
    href: "/services/software-development"
  },
  {
    id: "seo",
    name: "Strategic SEO",
    price: "From $2,000/mo",
    popular: false,
    description: "Dominate search results in your industry",
    cta: "Start Growing",
    href: "/services/strategic-seo"
  },
  {
    id: "strategy",
    name: "Business Strategy",
    price: "Custom Quote",
    popular: false,
    description: "Data-driven business transformation",
    cta: "Get Started",
    href: "/services/business-strategy"
  },
  {
    id: "qa",
    name: "Quality Assurance",
    price: "From $1,500/mo",
    popular: false,
    description: "Ensure flawless performance",
    cta: "Learn More",
    href: "/services/quality-assurance"
  },
  {
    id: "education",
    name: "Expert Education",
    price: "From $5,000",
    popular: false,
    description: "Empower your team with knowledge",
    cta: "View Programs",
    href: "/services/expert-education"
  }
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-slate-600 mx-auto" />
    );
  }
  return (
    <span className="text-sm text-slate-400 text-center block">
      {value}
    </span>
  );
}

export function ServiceComparisonTable() {
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  return (
    <div className="w-full overflow-x-auto">
      <TooltipProvider>
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr>
              <th className="text-left p-4 bg-slate-800/50 rounded-tl-lg sticky left-0 z-10">
                <div className="font-bold text-white">Features</div>
              </th>
              {services.map((service) => (
                <th
                  key={service.id}
                  className={`p-4 bg-slate-800/50 text-center transition-all ${
                    service.id === services[services.length - 1].id ? "rounded-tr-lg" : ""
                  } ${hoveredService === service.id ? "bg-slate-700/50" : ""}`}
                  onMouseEnter={() => setHoveredService(service.id)}
                  onMouseLeave={() => setHoveredService(null)}
                >
                  <div className="space-y-2">
                    {service.popular && (
                      <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                        Most Popular
                      </Badge>
                    )}
                    <div className="font-bold text-white">{service.name}</div>
                    <div className="text-sm text-slate-400">{service.price}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <motion.tr
                key={feature.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-slate-800/50 hover:bg-slate-800/20"
              >
                <td className="p-4 sticky left-0 z-10 bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{feature.name}</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{feature.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>
                {services.map((service) => (
                  <td
                    key={service.id}
                    className={`p-4 text-center transition-all ${
                      hoveredService === service.id ? "bg-slate-800/20" : ""
                    }`}
                    onMouseEnter={() => setHoveredService(service.id)}
                    onMouseLeave={() => setHoveredService(null)}
                  >
                    <FeatureCell value={feature[service.id as keyof ServiceFeature] as boolean | string} />
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="p-4 rounded-bl-lg bg-slate-800/50 sticky left-0 z-10">
                <div className="text-sm text-slate-400">
                  Ready to get started?
                </div>
              </td>
              {services.map((service, index) => (
                <td
                  key={service.id}
                  className={`p-4 bg-slate-800/50 text-center ${
                    index === services.length - 1 ? "rounded-br-lg" : ""
                  }`}
                >
                  <Button
                    asChild
                    size="sm"
                    className={service.popular ? 
                      "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500" : 
                      "bg-slate-700 hover:bg-slate-600"
                    }
                  >
                    <Link href={service.href}>{service.cta}</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </TooltipProvider>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building, 
  Cpu, 
  Heart, 
  DollarSign, 
  ShoppingBag, 
  Factory, 
  GraduationCap, 
  Hotel, 
  Truck, 
  Briefcase,
  Clock,
  TrendingUp,
  Zap,
  Users,
  ArrowRight
} from "lucide-react";
import { CaseStudy, INDUSTRY_LABELS } from "@/types/case-studies";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  featured?: boolean;
}

const industryIcons = {
  technology: Cpu,
  healthcare: Heart,
  finance: DollarSign,
  retail: ShoppingBag,
  manufacturing: Factory,
  education: GraduationCap,
  real_estate: Building,
  hospitality: Hotel,
  logistics: Truck,
  other: Briefcase
};

const metricIcons: Record<string, any> = {
  TrendingUp,
  Zap,
  DollarSign,
  Users,
  Clock
};

export function CaseStudyCard({ caseStudy, featured = false }: CaseStudyCardProps) {
  const IndustryIcon = industryIcons[caseStudy.industry];

  // Get first testimonial if available
  const testimonial = caseStudy.testimonials?.[0];

  // Get top metrics to display
  const topMetrics = caseStudy.metrics?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className={`h-full bg-slate-800 border-slate-700 hover:border-teal-600 transition-all hover:shadow-xl group overflow-hidden ${
        featured ? 'md:col-span-2 lg:col-span-1' : ''
      }`}>
        <Link href={`/case-studies/${caseStudy.slug}`} className="block h-full">
          {/* Featured Image */}
          {caseStudy.featured_image ? (
            <div className="relative h-48 md:h-56 overflow-hidden">
              <Image
                src={caseStudy.featured_image}
                alt={caseStudy.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    Featured Success
                  </Badge>
                </div>
              )}
              {/* Industry Badge */}
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-slate-900/80 text-white flex items-center gap-1">
                  <IndustryIcon className="h-3 w-3" />
                  {INDUSTRY_LABELS[caseStudy.industry]}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="relative h-48 md:h-56 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <IndustryIcon className="h-24 w-24 text-slate-600" />
              {featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    Featured Success
                  </Badge>
                </div>
              )}
              {/* Industry Badge */}
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-slate-900/80 text-white flex items-center gap-1">
                  <IndustryIcon className="h-3 w-3" />
                  {INDUSTRY_LABELS[caseStudy.industry]}
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="p-6 flex flex-col h-full">
            {/* Client Name */}
            <p className="text-sm text-slate-400 mb-2">{caseStudy.client_name}</p>

            {/* Title */}
            <h3 className={`font-bold text-white mb-3 group-hover:text-teal-400 transition-colors ${
              featured ? 'text-2xl' : 'text-xl'
            }`}>
              {caseStudy.title}
            </h3>

            {/* Challenge */}
            <p className="text-slate-300 mb-4 flex-grow line-clamp-3">
              {caseStudy.challenge}
            </p>

            {/* Key Metrics */}
            {topMetrics.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {topMetrics.map((metric) => {
                  const MetricIcon = metric.metric_icon ? metricIcons[metric.metric_icon] : TrendingUp;
                  return (
                    <div key={metric.id} className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <MetricIcon className="h-4 w-4 text-teal-400" />
                      </div>
                      <div className="text-lg font-bold text-white">{metric.metric_value}</div>
                      <div className="text-xs text-teal-400">{metric.metric_improvement}</div>
                      <div className="text-xs text-slate-400">{metric.metric_name}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Services Used */}
            {caseStudy.services && caseStudy.services.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {caseStudy.services.slice(0, 3).map((service) => (
                  <Badge
                    key={service.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {service.name}
                  </Badge>
                ))}
                {caseStudy.services.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{caseStudy.services.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Implementation Time */}
            {caseStudy.implementation_time && (
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Clock className="h-4 w-4" />
                <span>Completed in {caseStudy.implementation_time}</span>
              </div>
            )}

            {/* Testimonial Preview */}
            {testimonial && (
              <div className="mt-auto pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-300 italic mb-2 line-clamp-2">
                  &ldquo;{testimonial.testimonial_text}&rdquo;
                </p>
                <p className="text-xs text-slate-400">
                  — {testimonial.author_name}, {testimonial.author_title}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-teal-400 font-medium group-hover:text-teal-300">
                  View Case Study
                </span>
                <ArrowRight className="h-4 w-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}

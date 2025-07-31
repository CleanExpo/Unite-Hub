"use client";

import PricingSection from "@/components/pricing-section";
import { pricingPlansData, faqDataItems } from "@/lib/pricing-data";
import {
  CheckCircle,
  BarChartHorizontalBig,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

const coreFeatures = [
  "Business Strategy Sessions",
  "Custom Software Development",
  "SEO & Digital Marketing",
  "Quality Assurance Testing",
  "Ongoing Support & Maintenance",
  "Performance Optimization",
  "Security Best Practices",
  "Regular Progress Reports",
];

const planComparisonFeatures = [
  {
    feature: "Consultation Hours",
    startup: "2 Hours",
    professional: "5 Hours",
    enterprise: "Unlimited",
  },
  {
    feature: "Project Management",
    startup: "Basic",
    professional: "Dedicated Manager",
    enterprise: "Full Team",
  },
  {
    feature: "Custom Development",
    startup: "Simple Solutions",
    professional: "Advanced Features",
    enterprise: "Full Custom",
  },
  {
    feature: "Support Response",
    startup: "24-48 Hours",
    professional: "Same Day",
    enterprise: "Immediate",
  },
  {
    feature: "SEO Services",
    startup: "Basic Optimization",
    professional: "Full Campaign",
    enterprise: "Comprehensive Strategy",
  },
  {
    feature: "Testing & QA",
    startup: "Basic Testing",
    professional: "Full Testing Suite",
    enterprise: "Advanced QA",
  },
  {
    feature: "Training & Onboarding",
    startup: "Documentation",
    professional: "Team Training",
    enterprise: "Full Training Program",
  },
  {
    feature: "Maintenance",
    startup: "Bug Fixes",
    professional: "Regular Updates",
    enterprise: "Proactive Maintenance",
  },
  {
    feature: "Analytics & Reporting",
    startup: "Monthly Reports",
    professional: "Weekly Insights",
    enterprise: "Real-time Dashboard",
  },
  {
    feature: "Priority Support",
    startup: "Email Only",
    professional: "Phone & Email",
    enterprise: "Dedicated Account Manager",
  },
];

export default function PricingPage() {
  return (
    // Header and Footer are now handled by layout.tsx
    <>
      <section className="py-16 md:py-24 bg-slate-950">
        <PricingSection plans={pricingPlansData} faqs={faqDataItems} />
      </section>

      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              What's Included in Every Project
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Every Unite Group service includes these essential elements to
              ensure your project succeeds and delivers real business value.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {coreFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                className="bg-slate-800 p-5 rounded-lg shadow-lg flex items-center space-x-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <CheckCircle
                  size={20}
                  className="text-cyan-400 flex-shrink-0"
                />
                <span className="text-sm text-slate-200">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-slate-950">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <BarChartHorizontalBig
              size={48}
              className="text-cyan-400 mx-auto mb-4"
            />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Service Level Comparison
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose the service level that matches your business needs and
              growth stage. We scale with you.
            </p>
          </div>
          <div className="overflow-x-auto bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/50">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6"
                  >
                    Service Feature
                  </th>
                  {pricingPlansData.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className="px-3 py-3.5 text-center text-sm font-semibold text-white"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800/70">
                {planComparisonFeatures.map((item, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? undefined : "bg-slate-800/40"}
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-200 sm:pl-6">
                      {item.feature}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 text-center">
                      {typeof item.startup === "boolean" ? (
                        item.startup ? (
                          <CheckCircle
                            className="mx-auto text-green-500"
                            size={20}
                          />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )
                      ) : (
                        item.startup
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 text-center">
                      {typeof item.professional === "boolean" ? (
                        item.professional ? (
                          <CheckCircle
                            className="mx-auto text-green-500"
                            size={20}
                          />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )
                      ) : (
                        item.professional
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 text-center">
                      {typeof item.enterprise === "boolean" ? (
                        item.enterprise ? (
                          <CheckCircle
                            className="mx-auto text-green-500"
                            size={20}
                          />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )
                      ) : (
                        item.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle size={48} className="text-cyan-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-5">
            Need Help Choosing?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Not sure which service level is right for your business? Let's have
            a conversation about your goals and find the perfect fit.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3.5 text-lg group"
          >
            <Link href="/contact">
              Get Free Consultation{" "}
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

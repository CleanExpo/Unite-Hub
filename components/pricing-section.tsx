"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PricingPlan, FAQItem } from "@/lib/pricing-data";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  plans: PricingPlan[];
  faqs: FAQItem[];
}

export default function PricingSection({ plans, faqs }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">(
    "annually"
  );

  return (
    <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-slate-300">
          Choose the perfect plan for your business. All plans include our core
          features with no hidden fees.
        </p>
      </div>

      <div className="flex justify-center items-center mb-10 md:mb-12">
        <Button
          variant={billingCycle === "monthly" ? "default" : "outline"}
          onClick={() => setBillingCycle("monthly")}
          className={cn(
            "rounded-r-none px-6 py-3 text-sm font-medium",
            billingCycle === "monthly"
              ? "bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600"
              : "text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
          )}
        >
          Monthly
        </Button>
        <div className="relative">
          <Button
            variant={billingCycle === "annually" ? "default" : "outline"}
            onClick={() => setBillingCycle("annually")}
            className={cn(
              "rounded-l-none px-6 py-3 text-sm font-medium",
              billingCycle === "annually"
                ? "bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600"
                : "text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
            )}
          >
            Annually
          </Button>
          {billingCycle === "annually" && (
            <span className="absolute -top-2 -right-3 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full transform translate-x-1/2 -translate-y-1/2 rotate-6">
              Save 20%
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 md:mb-24">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
            className="flex"
          >
            <Card
              className={cn(
                "w-full flex flex-col bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl relative overflow-hidden",
                plan.isPopular
                  ? "border-2 border-cyan-500 shadow-cyan-500/30"
                  : "border-slate-700"
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl font-semibold text-white mb-2">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {typeof plan.monthlyPrice === "string"
                      ? plan.monthlyPrice
                      : `$${
                          billingCycle === "monthly"
                            ? plan.monthlyPrice
                            : plan.annualPrice
                        }`}
                  </span>
                  {typeof plan.monthlyPrice === "number" && (
                    <span className="text-slate-400">/month</span>
                  )}
                  {billingCycle === "annually" &&
                    typeof plan.monthlyPrice === "number" && (
                      <p className="text-xs text-slate-500 mt-1">
                        Billed annually
                      </p>
                    )}
                </div>
                <Button
                  asChild
                  className={cn(
                    "w-full font-semibold text-lg py-6",
                    plan.isPopular
                      ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-100"
                  )}
                >
                  <a href={plan.ctaLink}>{plan.ctaText}</a>
                </Button>
                <div className="mt-8">
                  <p className="text-sm font-medium text-slate-200 mb-3">
                    What's included:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start text-sm text-slate-300"
                      >
                        <CheckCircle
                          size={18}
                          className="text-cyan-400 mr-2.5 mt-0.5 flex-shrink-0"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mb-16 md:mb-24">
        <h3 className="text-2xl md:text-3xl font-semibold text-white text-center mb-8 md:mb-10">
          Frequently Asked Questions
        </h3>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="bg-slate-800/50 border-slate-700/80 rounded-lg mb-3 px-2"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                <div className="flex items-center">
                  <HelpCircle
                    size={20}
                    className="text-cyan-400 mr-3 flex-shrink-0"
                  />
                  {faq.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-relaxed pb-4 px-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="text-center bg-slate-800/60 p-8 md:p-12 rounded-xl shadow-xl border border-slate-700/50">
        <h3 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          Ready to transform your business?
        </h3>
        <p className="max-w-xl mx-auto text-lg text-slate-300 mb-8">
          Join over 500+ companies already using Unite Group to power their
          growth.
        </p>
        <div className="flex  justify-center items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white font-semibold px-8 py-3.5 text-lg"
          >
            <a href="/contact">Talk to Our Team</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

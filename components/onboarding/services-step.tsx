"use client"

import type React from "react"

import { useState } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight } from "lucide-react"

const SERVICES = [
  {
    id: "education",
    name: "Education & Training",
    description: "Expert-led online education and IICRC continuing education credits",
    icon: "/education-service.png",
  },
  {
    id: "software",
    name: "Software Development",
    description: "Custom software solutions for businesses of all sizes",
    icon: "/software-development.png",
  },
  {
    id: "seo",
    name: "SEO Services",
    description: "Improve your online visibility and drive more traffic to your website",
    icon: "/seo-service.png",
  },
  {
    id: "consulting",
    name: "Business Consulting",
    description: "Strategic guidance to help your business grow and succeed",
    icon: "/business-consulting.png",
  },
  {
    id: "app",
    name: "App Development",
    description: "Mobile and web application development for your business needs",
    icon: "/App-Development.png",
  },
  {
    id: "gmb",
    name: "Google My Business",
    description: "Optimize your Google Business Profile to attract local customers",
    icon: "/GMB-Strategies.png",
  },
]

export function ServicesStep() {
  const { nextStep, prevStep, updateServices, servicesData } = useOnboarding()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>(servicesData.interests || [])

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateServices({ interests: selectedServices })
      nextStep()
    } catch (error) {
      console.error("Error updating services:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Select Services of Interest</h2>
        <p className="text-gray-300 mt-2">
          Choose the services you're interested in to help us personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className={`
                flex items-start p-4 rounded-lg border cursor-pointer transition-all
                ${
                  selectedServices.includes(service.id)
                    ? "bg-[#4ecdc4]/10 border-[#4ecdc4]"
                    : "bg-[#001428] border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50"
                }
              `}
              onClick={() => toggleService(service.id)}
            >
              <Checkbox
                checked={selectedServices.includes(service.id)}
                onCheckedChange={() => toggleService(service.id)}
                className="mt-1 data-[state=checked]:bg-[#4ecdc4] data-[state=checked]:border-[#4ecdc4]"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <img
                    src={service.icon || "/placeholder.svg"}
                    alt={service.name}
                    className="w-8 h-8 object-contain mr-2"
                  />
                  <h3 className="font-medium text-white">{service.name}</h3>
                </div>
                <p className="text-sm text-gray-400 mt-1">{service.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-[#4ecdc4]/50 text-gray-300 hover:bg-[#001428] hover:text-white"
            onClick={prevStep}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button type="submit" className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Continue"} {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}

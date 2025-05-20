"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

interface ServiceContactFormProps {
  serviceName: string
  serviceOptions?: string[]
  budgetRanges?: string[]
  showTimeframe?: boolean
  additionalFields?: {
    name: string
    label: string
    type: "text" | "textarea" | "select" | "checkbox"
    options?: string[]
    required?: boolean
  }[]
}

export default function ServiceContactForm({
  serviceName,
  serviceOptions = [],
  budgetRanges = ["$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000+"],
  showTimeframe = true,
  additionalFields = [],
}: ServiceContactFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    serviceOption: serviceOptions.length > 0 ? serviceOptions[0] : "",
    budget: "",
    timeframe: "",
    message: "",
    additionalData: {} as Record<string, string | boolean>,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      additionalData: { ...prev.additionalData, [name]: checked },
    }))
  }

  const handleAdditionalFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalData: { ...prev.additionalData, [name]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real application, you would send this data to your API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, service: serviceName }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Form submitted successfully!",
        description: `Thank you for your interest in our ${serviceName} services. We'll be in touch soon.`,
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        serviceOption: serviceOptions.length > 0 ? serviceOptions[0] : "",
        budget: "",
        timeframe: "",
        message: "",
        additionalData: {},
      })

      // Redirect to thank you page
      // router.push('/thank-you');
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">{serviceName} Inquiry</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Your email address"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="company" className="text-sm font-medium">
              Company/Organization
            </label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Your company or organization"
            />
          </div>
        </div>

        {serviceOptions.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="serviceOption" className="text-sm font-medium">
              What specific {serviceName} service are you interested in?
            </label>
            <Select
              value={formData.serviceOption}
              onValueChange={(value) => handleSelectChange("serviceOption", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${serviceName} service`} />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="budget" className="text-sm font-medium">
              Budget Range
            </label>
            <Select value={formData.budget} onValueChange={(value) => handleSelectChange("budget", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your budget range" />
              </SelectTrigger>
              <SelectContent>
                {budgetRanges.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showTimeframe && (
            <div className="space-y-2">
              <label htmlFor="timeframe" className="text-sm font-medium">
                Timeframe
              </label>
              <Select value={formData.timeframe} onValueChange={(value) => handleSelectChange("timeframe", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As soon as possible</SelectItem>
                  <SelectItem value="1month">Within 1 month</SelectItem>
                  <SelectItem value="3months">Within 3 months</SelectItem>
                  <SelectItem value="6months">Within 6 months</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {additionalFields.map((field) => (
          <div key={field.name} className="space-y-2">
            {field.type === "checkbox" ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.name}
                  checked={!!formData.additionalData[field.name]}
                  onCheckedChange={(checked) => handleCheckboxChange(field.name, checked as boolean)}
                />
                <label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                </label>
              </div>
            ) : field.type === "select" && field.options ? (
              <>
                <label htmlFor={field.name} className="text-sm font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Select
                  value={(formData.additionalData[field.name] as string) || ""}
                  onValueChange={(value) => handleAdditionalFieldChange(field.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : field.type === "textarea" ? (
              <>
                <label htmlFor={field.name} className="text-sm font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  id={field.name}
                  value={(formData.additionalData[field.name] as string) || ""}
                  onChange={(e) => handleAdditionalFieldChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.label}
                />
              </>
            ) : (
              <>
                <label htmlFor={field.name} className="text-sm font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  id={field.name}
                  value={(formData.additionalData[field.name] as string) || ""}
                  onChange={(e) => handleAdditionalFieldChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.label}
                />
              </>
            )}
          </div>
        ))}

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Project Details <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Please describe your project or requirements"
            rows={5}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Inquiry"}
        </Button>
      </form>
    </div>
  )
}

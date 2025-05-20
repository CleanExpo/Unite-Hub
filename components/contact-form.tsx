"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function ContactForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: data.message,
        })
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-white font-medium">
            First Name
          </label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            className="bg-[#002a42] border-[#4ecdc4]/30 focus:border-[#4ecdc4] text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-white font-medium">
            Last Name
          </label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            className="bg-[#002a42] border-[#4ecdc4]/30 focus:border-[#4ecdc4] text-white"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-white font-medium">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email address"
          className="bg-[#002a42] border-[#4ecdc4]/30 focus:border-[#4ecdc4] text-white"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="phone" className="text-white font-medium">
          Phone Number
        </label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your phone number"
          className="bg-[#002a42] border-[#4ecdc4]/30 focus:border-[#4ecdc4] text-white"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="subject" className="text-white font-medium">
          Subject
        </label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="What is this regarding?"
          className="bg-[#002a42] border-[#4ecdc4]/30 focus:border-[#4ecdc4] text-white"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="message" className="text-white font-medium">
          Message
        </label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="How can we help you?"
          className="min-h-[150px] bg-[#002a42] border-[#4ecdc4]/30 focus:border-[#4ecdc4] text-white"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  )
}

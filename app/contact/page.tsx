"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#112240] border-[#1a2f55]">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-[#64ffda]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-300 mb-6">We've received your message and will get back to you within 24 hours.</p>
            <Button
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  name: "",
                  email: "",
                  company: "",
                  service: "",
                  message: "",
                })
              }}
              className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7]"
            >
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Get in <span className="text-[#64ffda]">Touch</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">
              Ready to start your next project? We'd love to hear from you. Send us a message and we'll respond as soon
              as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-[#112240] border-[#1a2f55]">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Send us a message</CardTitle>
                  <CardDescription className="text-gray-400">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#1a2f55] border border-[#2a4365] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64ffda] focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#1a2f55] border border-[#2a4365] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64ffda] focus:border-transparent"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#1a2f55] border border-[#2a4365] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64ffda] focus:border-transparent"
                          placeholder="Your Company"
                        />
                      </div>
                      <div>
                        <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-2">
                          Service of Interest
                        </label>
                        <select
                          id="service"
                          name="service"
                          value={formData.service}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#1a2f55] border border-[#2a4365] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#64ffda] focus:border-transparent"
                        >
                          <option value="">Select a service</option>
                          <option value="software-development">Software Development</option>
                          <option value="seo-services">SEO Services</option>
                          <option value="expert-education">Expert Education</option>
                          <option value="consultation">General Consultation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#1a2f55] border border-[#2a4365] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#64ffda] focus:border-transparent"
                        placeholder="Tell us about your project or how we can help you..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold py-3"
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="bg-[#112240] border-[#1a2f55]">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-[#64ffda] mt-1" />
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p className="text-gray-400">hello@unitegroup.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-[#64ffda] mt-1" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-400">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-[#64ffda] mt-1" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-400">
                        123 Business Ave
                        <br />
                        Suite 100
                        <br />
                        City, State 12345
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-[#64ffda] mt-1" />
                    <div>
                      <p className="text-white font-medium">Business Hours</p>
                      <p className="text-gray-400">
                        Monday - Friday: 9:00 AM - 6:00 PM
                        <br />
                        Saturday: 10:00 AM - 4:00 PM
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#112240] border-[#1a2f55]">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Quick Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">
                    We typically respond to all inquiries within 24 hours during business days. For urgent matters,
                    please call us directly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

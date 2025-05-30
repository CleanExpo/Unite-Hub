"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Calendar, MessageSquare } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit the form');
      }
      
      setSuccess(true);
      setFormData({ name: "", email: "", company: "", service: "", message: "" });
      
      // Scroll to top of form to show success message
      const formElement = document.getElementById('contact-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: <Calendar className="h-6 w-6 text-teal-400" />,
      title: "Book Consultation",
      details: "$550 - 1 Hour Session",
      description: "Comprehensive business analysis and strategic planning"
    },
    {
      icon: <Mail className="h-6 w-6 text-purple-400" />,
      title: "Email",
      details: "support@carsi.com.au",
      description: "Send us an email anytime"
    },
    {
      icon: <Phone className="h-6 w-6 text-blue-400" />,
      title: "Phone",
      details: "0457 123 005",
      description: "Mon-Fri from 8am to 6pm"
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-green-400" />,
      title: "Response Time",
      details: "Within 24 Hours",
      description: "We're committed to quick responses"
    }
  ];

  const services = [
    "Initial Consultation ($550)",
    "Expert Education",
    "Software Development", 
    "Strategic SEO",
    "Business Strategy",
    "General Inquiry"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-300 hover:text-white transition-colors">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-white font-medium">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            Ready to Transform
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Your Business?
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Start with our comprehensive $550 consultation or reach out for any questions about our services. We're here to help you succeed.
          </p>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Send us a Message</CardTitle>
                <CardDescription className="text-slate-300">
                  Fill out the form below and we&apos;ll get back to you within 24 hours to discuss your needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success && (
                  <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-md">
                    <p className="text-green-400 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Message sent successfully!
                    </p>
                    <p className="text-green-300 text-sm mt-1">Thank you for your message. We'll get back to you within 24 hours to discuss your needs.</p>
                  </div>
                )}
                
                {error && (
                  <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md">
                    <p className="text-red-400 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Error sending message
                    </p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                )}
                
                <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-300">Company (Optional)</Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={handleChange}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-slate-300">Service Interest</Label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                      title="Select the service you are interested in"
                      required
                    >
                      <option value="">Select a service...</option>
                      {services.map((service, index) => (
                        <option key={index} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-300">Message</Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="flex min-h-[120px] w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white ring-offset-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                      placeholder="Tell us about your project, goals, or questions..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  Contact Information
                </h2>
                <p className="text-lg text-slate-300 mb-8">
                  Ready to get started? Book your consultation or reach out through any of these channels.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">
                            {info.title}
                          </h3>
                          <p className="text-lg font-medium text-slate-200 mb-1">
                            {info.details}
                          </p>
                          <p className="text-sm text-slate-400">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Consultation CTA */}
              <Card className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border-teal-500/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-3">
                    Ready to Start Your Journey?
                  </h3>
                  <p className="text-slate-300 mb-4">
                    Book your $550 consultation today and take the first step toward transforming your business.
                  </p>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Link href="/pricing">Book Consultation</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">How quickly will you respond?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  We typically respond to all inquiries within 24 hours during business days. 
                  For consultation bookings, we&apos;ll contact you to schedule within the same timeframe.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">What happens during the consultation?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Our $550 consultation includes comprehensive business analysis, technology needs assessment, 
                  and strategic roadmap development with a detailed follow-up report.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Do you work with all business sizes?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Yes! We work with startups, SMEs, and large enterprises across all industries. 
                  Our solutions are tailored to your specific business size and needs.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">How is project pricing determined?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  After your initial consultation, we provide detailed quotes based on project scope, 
                  complexity, timeline, and resource requirements. All pricing is transparent with no hidden fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

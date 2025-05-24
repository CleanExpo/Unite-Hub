"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", company: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6 text-purple-600" />,
      title: "Email",
      details: "hello@unitegroup.com",
      description: "Send us an email anytime"
    },
    {
      icon: <Phone className="h-6 w-6 text-purple-600" />,
      title: "Phone",
      details: "+1 (555) 123-4567",
      description: "Mon-Fri from 8am to 6pm"
    },
    {
      icon: <MapPin className="h-6 w-6 text-purple-600" />,
      title: "Office",
      details: "123 Business Ave, Suite 100",
      description: "San Francisco, CA 94105"
    },
    {
      icon: <Clock className="h-6 w-6 text-purple-600" />,
      title: "Support Hours",
      details: "24/7 Support",
      description: "We're here when you need us"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">Unite Group</Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Get in Touch
            <span className="block text-purple-600">We&apos;re Here to Help</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions about Unite Group? Want to see a demo? Our team is ready to help you get started.
          </p>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Reach out to us through any of these channels. We&apos;re always happy to help!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {info.title}
                          </h3>
                          <p className="text-lg font-medium text-gray-800 mb-1">
                            {info.details}
                          </p>
                          <p className="text-sm text-gray-600">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Additional Support Options */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Need Immediate Help?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Check out our help center for instant answers to common questions.
                  </p>
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    Visit Help Center
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How quickly will you respond?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We typically respond to all inquiries within 24 hours during business days. 
                  For urgent matters, please call our support line.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I schedule a demo?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Absolutely! Mention that you&apos;d like to schedule a demo in your message, 
                  and we&apos;ll set up a personalized walkthrough of Unite Group.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer phone support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes, phone support is available for Professional and Enterprise customers. 
                  Starter plan users can reach us via email and chat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What about technical issues?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  For technical support, please include details about your issue, browser, 
                  and any error messages. This helps us resolve problems faster.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

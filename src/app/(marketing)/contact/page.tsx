'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      company: formData.get('company') || '',
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        e.currentTarget.reset();
        // Auto-hide success message after 10 seconds
        setTimeout(() => setSuccess(false), 10000);
      } else {
        setError(result.error || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success && (
                  <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Message sent successfully!</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        We'll get back to you within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        First Name *
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name *
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">
                      Company
                    </label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    * Required fields
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  For general inquiries
                </p>
                <a
                  href="mailto:hello@unite-hub.com"
                  className="text-primary hover:underline font-medium"
                >
                  hello@unite-hub.com
                </a>
                <p className="text-sm text-muted-foreground mt-4 mb-3">
                  For support
                </p>
                <a
                  href="mailto:support@unite-hub.com"
                  className="text-primary hover:underline font-medium"
                >
                  support@unite-hub.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with our support team in real-time
                </p>
                <Button variant="outline" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9AM - 6PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">10AM - 4PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Office</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  [Your Business Address]
                </p>
                <p className="text-sm text-muted-foreground">
                  [City, State ZIP]
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Contact Options */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Other Ways to Reach Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Interested in Unite-Hub for your team?
                </p>
                <a
                  href="mailto:sales@unite-hub.com"
                  className="text-primary hover:underline font-medium text-sm"
                >
                  sales@unite-hub.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partnership Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Looking to partner with us?
                </p>
                <a
                  href="mailto:partnerships@unite-hub.com"
                  className="text-primary hover:underline font-medium text-sm"
                >
                  partnerships@unite-hub.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Press & Media</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Media inquiries and press releases
                </p>
                <a
                  href="mailto:press@unite-hub.com"
                  className="text-primary hover:underline font-medium text-sm"
                >
                  press@unite-hub.com
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-16 bg-muted/50 border rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">Have a quick question?</h3>
          <p className="text-muted-foreground mb-6">
            Check out our documentation and support center for instant answers
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="outline" asChild>
              <a href="/docs">Documentation</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/support">Support Center</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

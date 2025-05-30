"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Clock, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookConsultation() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    company: "",
    phone: "",
    service_type: "Initial Consultation ($550)",
    preferred_date: undefined as Date | undefined,
    preferred_time: "",
    alternate_date: undefined as Date | undefined,
    message: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];
  
  const serviceTypes = [
    "Initial Consultation ($550)",
    "Follow-up Consultation",
    "Project Discussion",
    "Technical Review",
    "Strategy Session"
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData({
      ...formData,
      [field]: date
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate form
    if (!formData.client_name || !formData.client_email || !formData.preferred_date || !formData.preferred_time) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to book consultation');
      }
      
      setSuccess(true);
      setFormData({
        client_name: "",
        client_email: "",
        company: "",
        phone: "",
        service_type: "Initial Consultation ($550)",
        preferred_date: undefined,
        preferred_time: "",
        alternate_date: undefined,
        message: ""
      });
      
      // Scroll to top of form to show success message
      const formElement = document.getElementById('booking-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
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
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/book-consultation">Book Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            Book Your
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Strategic Consultation
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Schedule your $550 consultation session with our experts. 
            This comprehensive business analysis will provide you with actionable insights and a strategic roadmap for success.
          </p>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-10 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Book Your Consultation</CardTitle>
              <CardDescription className="text-slate-300">
                Complete the form below to schedule your consultation session. 
                We'll confirm your booking within 24 hours.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {success && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-md">
                  <p className="text-green-400 font-medium flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    Consultation booked successfully!
                  </p>
                  <p className="text-green-300 text-sm mt-1">
                    Thank you for booking a consultation with UNITE Group. We'll contact you within 24 hours to confirm your preferred time and date.
                  </p>
                </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md">
                  <p className="text-red-400 font-medium flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Error booking consultation
                  </p>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              )}
              
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_name" className="text-slate-300">
                      Full Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="client_name"
                      name="client_name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.client_name}
                      onChange={handleChange}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client_email" className="text-slate-300">
                      Email Address <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="client_email"
                      name="client_email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.client_email}
                      onChange={handleChange}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-300">
                      Company (Optional)
                    </Label>
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
                    <Label htmlFor="phone" className="text-slate-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service_type" className="text-slate-300">
                    Consultation Type <span className="text-red-400">*</span>
                  </Label>
                  <select
                    id="service_type"
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                    aria-label="Consultation Type"
                    title="Select the type of consultation you're interested in"
                    required
                  >
                    {serviceTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">
                      Preferred Date <span className="text-red-400">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white",
                            !formData.preferred_date && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.preferred_date ? format(formData.preferred_date, "MMMM d, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={formData.preferred_date}
                          onSelect={(date) => handleDateChange('preferred_date', date)}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="bg-slate-800 text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preferred_time" className="text-slate-300">
                      Preferred Time <span className="text-red-400">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white",
                            !formData.preferred_time && "text-slate-400"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {formData.preferred_time || "Select time"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <div className="p-2 grid gap-1">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              variant="ghost"
                              className={cn(
                                "justify-start font-normal hover:bg-slate-700",
                                formData.preferred_time === time ? "bg-slate-700 text-white" : "text-slate-300"
                              )}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  preferred_time: time
                                });
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Alternate Date (Optional)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white",
                          !formData.alternate_date && "text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.alternate_date ? format(formData.alternate_date, "MMMM d, yyyy") : "Select alternate date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={formData.alternate_date}
                        onSelect={(date) => handleDateChange('alternate_date', date)}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="bg-slate-800 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-300">
                    What would you like to discuss? (Optional)
                  </Label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please share any specific topics you'd like to discuss during the consultation..."
                    className="flex w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading || success}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-6 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Book Consultation - $550
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-slate-400 text-center">
                  By booking a consultation, you agree to our <Link href="/terms" className="text-teal-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-teal-400 hover:underline">Privacy Policy</Link>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            What to Expect From Your Consultation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <CardTitle className="text-white">Comprehensive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Our expert consultants will conduct an in-depth analysis of your business, technology needs, market position, and growth opportunities.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-white">Strategic Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Receive a detailed strategic roadmap with actionable recommendations tailored to your business goals, technical requirements, and budget.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-white">Implementation Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Get a clear implementation timeline with defined milestones, resource requirements, and cost estimates for your project or business initiative.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

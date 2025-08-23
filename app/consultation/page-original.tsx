'use client';

import { useState } from 'react';
import { Calendar, Clock, Check, Phone } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function ConsultationPage() {
  const [selectedService, setSelectedService] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    goals: '',
    budget: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const services = [
    { value: 'competitive-analysis', label: 'Competitive Analysis Strategy', duration: '60 min' },
    { value: 'seo-audit', label: 'SEO Audit & Strategy', duration: '45 min' },
    { value: 'market-research', label: 'Market Research Planning', duration: '60 min' },
    { value: 'agile-marketing', label: 'Agile Marketing Transformation', duration: '90 min' },
    { value: 'social-advertising', label: 'Social Advertising Strategy', duration: '45 min' },
    { value: 'growth-hacking', label: 'Growth Hacking Workshop', duration: '75 min' },
    { value: 'digital-strategy', label: 'Complete Digital Strategy', duration: '120 min' }
  ];

  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:30 AM - 11:30 AM',
    '12:00 PM - 1:00 PM',
    '1:30 PM - 2:30 PM',
    '3:00 PM - 4:00 PM',
    '4:30 PM - 5:30 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate booking submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultation Booked!</h2>
          <p className="text-gray-600 mb-6">
            Your consultation has been scheduled successfully. You'll receive a confirmation email shortly with meeting details.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Service:</strong> {services.find(s => s.value === selectedService)?.label}<br />
              <strong>Time:</strong> {selectedTime}
            </p>
          </div>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSelectedService('');
              setSelectedTime('');
              setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                goals: '',
                budget: ''
              });
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Book Another Consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'WebPage',
          name: 'Book a Free Consultation - Unite Group',
          description: 'Book a free consultation with Unite Group digital marketing experts. Get personalized advice on competitive analysis, SEO, growth hacking and more.',
          url: 'https://unite-group.com.au/consultation',
          publisher: {
            name: 'Unite Group',
            url: 'https://unite-group.com.au'
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Breadcrumb
        items={[
          { name: 'Home', href: '/' },
          { name: 'Consultation', href: '/consultation' }
        ]}
      />
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book a Free Consultation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get expert advice tailored to your business needs. Our consultation sessions are 
            designed to provide actionable insights and strategic recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Consultation Benefits */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What You'll Get</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Personalized strategy recommendations</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Industry-specific insights</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Competitive analysis overview</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Growth opportunity identification</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">ROI projections and budget guidance</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Next steps roadmap</span>
                </li>
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center text-green-600 mb-2">
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Need immediate help?</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Call us directly for urgent questions
                </p>
                <a 
                  href="tel:+61730000000" 
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  +61 7 3000 0000
                </a>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Select Consultation Type
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {services.map((service) => (
                      <label
                        key={service.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedService === service.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={service.value}
                          checked={selectedService === service.value}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{service.label}</span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedService && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Select Preferred Time
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {timeSlots.map((time) => (
                        <label
                          key={time}
                          className={`border rounded-lg p-3 cursor-pointer text-center transition-all ${
                            selectedTime === time
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-green-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="time"
                            value={time}
                            checked={selectedTime === time}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-gray-900">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {selectedTime && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Your Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="your.email@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+61 7 3000 0000"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Marketing Budget
                      </label>
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select budget range...</option>
                        <option value="under-5k">Under $5,000</option>
                        <option value="5k-15k">$5,000 - $15,000</option>
                        <option value="15k-50k">$15,000 - $50,000</option>
                        <option value="50k-100k">$50,000 - $100,000</option>
                        <option value="over-100k">Over $100,000</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Goals & Challenges *
                      </label>
                      <textarea
                        id="goals"
                        name="goals"
                        required
                        rows={4}
                        value={formData.goals}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Tell us about your main business goals and current marketing challenges..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Booking Consultation...' : 'Book Free Consultation'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </>
  );
}
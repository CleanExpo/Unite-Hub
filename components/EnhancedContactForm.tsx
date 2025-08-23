'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Building2, MessageSquare, Send, 
  CheckCircle, AlertCircle, Loader2, MapPin, Clock, 
  Calendar, DollarSign, Briefcase, Target, Sparkles 
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  timeline: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EnhancedContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    budget: '',
    timeline: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const services = [
    'Website Development',
    'SEO & Growth Hacking',
    'Social Media Marketing',
    'Complete Digital Transformation',
    'Other'
  ];

  const budgetRanges = [
    'Under $5,000',
    '$5,000 - $15,000',
    '$15,000 - $50,000',
    '$50,000+'
  ];

  const timelines = [
    'ASAP',
    'Within 1 month',
    '1-3 months',
    '3-6 months',
    'Just exploring'
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.service) {
      newErrors.service = 'Please select a service';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please tell us about your project';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Shake animation for errors
      const firstError = Object.keys(errors)[0];
      document.getElementById(firstError)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: '',
        budget: '',
        timeline: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {submitStatus === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h3>
            <p className="text-lg text-gray-600 mb-8">
              We've received your message and will get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Send Another Message
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name Field */}
                <FloatingLabelInput
                  id="name"
                  label="Full Name"
                  icon={User}
                  value={formData.name}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  isFocused={focusedField === 'name'}
                  required
                />

                {/* Email Field */}
                <FloatingLabelInput
                  id="email"
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  onChange={(value) => handleChange('email', value)}
                  error={errors.email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  isFocused={focusedField === 'email'}
                  required
                />

                {/* Phone Field */}
                <FloatingLabelInput
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                  error={errors.phone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  isFocused={focusedField === 'phone'}
                  required
                />

                {/* Company Field */}
                <FloatingLabelInput
                  id="company"
                  label="Company Name"
                  icon={Building2}
                  value={formData.company}
                  onChange={(value) => handleChange('company', value)}
                  onFocus={() => setFocusedField('company')}
                  onBlur={() => setFocusedField(null)}
                  isFocused={focusedField === 'company'}
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                Project Details
              </h3>

              {/* Service Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What service are you interested in? *
                </label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {services.map((service) => (
                    <motion.button
                      key={service}
                      type="button"
                      onClick={() => handleChange('service', service)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.service === service
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Target className="w-5 h-5 mb-2" />
                      <span className="font-medium">{service}</span>
                    </motion.button>
                  ))}
                </div>
                {errors.service && (
                  <p className="mt-2 text-sm text-red-600">{errors.service}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Budget Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <DollarSign className="inline w-4 h-4 mr-1" />
                    Budget Range
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select budget</option>
                    {budgetRanges.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                {/* Timeline Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Timeline
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => handleChange('timeline', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select timeline</option>
                    {timelines.map((timeline) => (
                      <option key={timeline} value={timeline}>{timeline}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Field */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Tell us about your project *
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={5}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Describe your project goals, challenges, and what success looks like for you..."
                />
                {errors.message && (
                  <p className="mt-2 text-sm text-red-600">{errors.message}</p>
                )}
                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-500">
                    {formData.message.length} / 500 characters
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Your Message...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </motion.button>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>24hr Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>No Spam Guarantee</span>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// Floating Label Input Component
function FloatingLabelInput({
  id,
  label,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  error,
  onFocus,
  onBlur,
  isFocused,
  required = false
}: {
  id: string;
  label: string;
  type?: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <div className={`relative transition-all ${error ? 'mb-6' : ''}`}>
        <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
          isFocused ? 'text-blue-600' : error ? 'text-red-500' : 'text-gray-400'
        }`} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder=" "
        />
        <label
          htmlFor={id}
          className={`absolute left-12 transition-all pointer-events-none ${
            value || isFocused
              ? 'top-0 -translate-y-1/2 text-xs bg-gray-50 px-2'
              : 'top-1/2 -translate-y-1/2 text-base'
          } ${error ? 'text-red-500' : isFocused ? 'text-blue-600' : 'text-gray-500'}`}
        >
          {label} {required && '*'}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute text-sm text-red-600 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
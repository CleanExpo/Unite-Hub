'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Check, Phone, Video, MessageSquare, 
  Users, Target, TrendingUp, Award, Sparkles, ChevronRight,
  Star, Zap, Shield, Gift, Timer, Globe, Building2,
  DollarSign, BarChart3, Brain, Rocket
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SchemaMarkup from '@/components/SchemaMarkup';
import BackgroundPattern from '@/components/BackgroundPatterns';
import { AnimatedNumber, CircularProgress } from '@/components/AnimatedStats';
import EnhancedCard from '@/components/EnhancedCard';
import SectionAnimation from '@/components/SectionAnimation';
import { PageLoader, ProgressLoader } from '@/components/LoadingStates';

interface TimeSlot {
  time: string;
  available: boolean;
  popular?: boolean;
}

const services = [
  { 
    value: 'competitive-analysis', 
    label: 'Competitive Analysis Strategy', 
    duration: '60 min',
    description: 'Discover how to beat your competitors and win more jobs',
    icon: Target,
    color: 'purple',
    outcomes: ['Competitor weaknesses identified', 'Pricing strategy', 'Market positioning']
  },
  { 
    value: 'seo-audit', 
    label: 'SEO Audit & Strategy', 
    duration: '45 min',
    description: 'Get found online and dominate local search results',
    icon: TrendingUp,
    color: 'blue',
    outcomes: ['Website audit', 'Keyword opportunities', 'Local SEO roadmap']
  },
  { 
    value: 'market-research', 
    label: 'Market Research Planning', 
    duration: '60 min',
    description: 'Understand your market and identify growth opportunities',
    icon: BarChart3,
    color: 'cyan',
    outcomes: ['Market analysis', 'Customer insights', 'Growth opportunities']
  },
  { 
    value: 'agile-marketing', 
    label: 'Agile Marketing Transformation', 
    duration: '90 min',
    description: 'Complete more jobs with sprint-based project management',
    icon: Rocket,
    color: 'green',
    outcomes: ['Sprint planning', 'Team efficiency', '32% faster completion']
  },
  { 
    value: 'growth-hacking', 
    label: 'Growth Hacking Workshop', 
    duration: '75 min',
    description: 'Rapid growth strategies for ambitious businesses',
    icon: Zap,
    color: 'orange',
    outcomes: ['Growth experiments', 'Viral tactics', 'Automation strategies']
  },
  { 
    value: 'digital-strategy', 
    label: 'Complete Digital Strategy', 
    duration: '120 min',
    description: 'End-to-end digital transformation for your business',
    icon: Brain,
    color: 'pink',
    outcomes: ['Full audit', 'Custom roadmap', '12-month plan']
  }
];

const timeSlots: TimeSlot[] = [
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true, popular: true },
  { time: '11:00 AM', available: false },
  { time: '12:00 PM', available: true },
  { time: '1:00 PM', available: true },
  { time: '2:00 PM', available: true, popular: true },
  { time: '3:00 PM', available: true },
  { time: '4:00 PM', available: false },
  { time: '5:00 PM', available: true }
];

const consultationStats = [
  { value: 1247, label: 'Consultations Delivered', icon: Users },
  { value: 98, label: 'Satisfaction Rate', suffix: '%', icon: Star },
  { value: 4.9, label: 'Average Rating', suffix: '/5', icon: Award },
  { value: 24, label: 'Hour Response', suffix: 'hr', icon: Timer }
];

const testimonials = [
  {
    quote: "The consultation completely changed our approach. We're now winning 45% more jobs!",
    author: "Mike Patterson",
    company: "Premier Plumbing",
    rating: 5
  },
  {
    quote: "In just 60 minutes, they identified $50K in missed opportunities. Incredible value!",
    author: "Sarah Chen",
    company: "Spark Electrical",
    rating: 5
  },
  {
    quote: "The roadmap they provided has been our growth bible. Revenue up 67% in 6 months.",
    author: "Tom Williams",
    company: "BuildRight Construction",
    rating: 5
  }
];

export default function ConsultationEnhancedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [meetingType, setMeetingType] = useState<'video' | 'phone'>('video');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    goals: '',
    budget: '',
    urgency: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Calculate progress
    let completed = 0;
    if (selectedService) completed += 25;
    if (selectedDate) completed += 25;
    if (selectedTime) completed += 25;
    if (formData.name && formData.email && formData.phone) completed += 25;
    setProgress(completed);
  }, [selectedService, selectedDate, selectedTime, formData]);

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

  // Generate next 14 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    return dates;
  };

  const availableDates = generateDates();

  if (isLoading) {
    return <PageLoader text="Loading consultation booking..." fullScreen />;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <EnhancedCard variant="glass">
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Consultation Confirmed!
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Your strategic consultation has been scheduled. Check your email for meeting details and preparation materials.
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Service</p>
                    <p className="font-semibold text-gray-900">
                      {services.find(s => s.value === selectedService)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {services.find(s => s.value === selectedService)?.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="font-semibold text-gray-900">{selectedTime}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  Back to Home
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentStep(1);
                    setSelectedService('');
                    setSelectedDate('');
                    setSelectedTime('');
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      goals: '',
                      budget: '',
                      urgency: ''
                    });
                  }}
                  className="px-8 py-3 bg-white text-green-600 rounded-lg font-semibold border-2 border-green-500 hover:bg-green-50 transition-all"
                >
                  Book Another
                </motion.button>
              </div>
            </div>
          </EnhancedCard>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'WebPage',
          name: 'Book a Free Strategic Consultation - Unite Group',
          description: 'Book a free consultation with Unite Group digital marketing experts. Get personalized strategies for growth.',
          url: 'https://unite-group.com.au/consultation'
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <BackgroundPattern variant="dots" opacity={0.03} />
        
        <Breadcrumb
          items={[
            { name: 'Home', href: '/' },
            { name: 'Consultation', href: '/consultation' }
          ]}
        />

        {/* Hero Section */}
        <SectionAnimation>
          <div className="relative py-16 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Gift className="w-4 h-4" />
                  Free Strategic Consultation - Worth $497
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Book Your Free
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                    Strategic Consultation
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
                  Get personalized advice from our experts. We'll analyze your business, 
                  identify opportunities, and create a custom growth roadmap.
                </p>
              </motion.div>

              {/* Trust Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
              >
                {consultationStats.map((stat, index) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      <AnimatedNumber value={stat.value} decimals={stat.label.includes('Rating') ? 1 : 0} />
                      {stat.suffix}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </SectionAnimation>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <ProgressLoader progress={progress} text="Booking Progress" />
        </div>

        {/* Main Booking Section */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Benefits */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="sticky top-8 space-y-6"
              >
                <EnhancedCard variant="gradient">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      What You'll Get
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Personalized growth strategy',
                        'Competitor intelligence report',
                        'Industry-specific insights',
                        'ROI projections',
                        '90-day action plan',
                        'Follow-up resources'
                      ].map((item, index) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start text-white/90"
                        >
                          <Check className="w-5 h-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </EnhancedCard>

                <EnhancedCard variant="glass">
                  <div className="p-6">
                    <div className="flex items-center text-green-600 mb-3">
                      <Phone className="w-5 h-5 mr-2" />
                      <span className="font-semibold">Need Help?</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Our team is here to assist you
                    </p>
                    <a 
                      href="tel:+61730000000" 
                      className="text-green-600 hover:text-green-700 font-semibold"
                    >
                      +61 7 3000 0000
                    </a>
                  </div>
                </EnhancedCard>

                {/* Testimonial */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-3">
                    "{testimonials[0].quote}"
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{testimonials[0].author}</p>
                  <p className="text-xs text-gray-600">{testimonials[0].company}</p>
                </div>
              </motion.div>
            </div>

            {/* Main Booking Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Service Selection */}
                  <AnimatePresence mode="wait">
                    {currentStep >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="mb-8"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                            1
                          </span>
                          Select Your Consultation Type
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {services.map((service) => (
                            <motion.div
                              key={service.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <label
                                className={`block cursor-pointer ${
                                  selectedService === service.value ? 'ring-2 ring-green-500' : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="service"
                                  value={service.value}
                                  checked={selectedService === service.value}
                                  onChange={(e) => {
                                    setSelectedService(e.target.value);
                                    if (currentStep < 2) setCurrentStep(2);
                                  }}
                                  className="sr-only"
                                />
                                <EnhancedCard variant={selectedService === service.value ? 'gradient' : 'default'}>
                                  <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                      <service.icon className={`w-8 h-8 text-${service.color}-500`} />
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {service.duration}
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-2">{service.label}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                                    <div className="space-y-1">
                                      {service.outcomes.map((outcome) => (
                                        <div key={outcome} className="flex items-center text-xs text-gray-500">
                                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                          {outcome}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </EnhancedCard>
                              </label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 2: Date Selection */}
                  <AnimatePresence mode="wait">
                    {currentStep >= 2 && selectedService && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="mb-8"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                            2
                          </span>
                          Choose Your Preferred Date
                        </h3>
                        
                        <div className="grid grid-cols-7 gap-2">
                          {availableDates.map((date) => (
                            <motion.button
                              key={date.date}
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedDate(date.date);
                                if (currentStep < 3) setCurrentStep(3);
                              }}
                              disabled={date.isWeekend}
                              className={`p-3 rounded-lg text-center transition-all ${
                                selectedDate === date.date
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                  : date.isWeekend
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white border border-gray-200 hover:border-green-400 text-gray-700'
                              }`}
                            >
                              <div className="text-xs font-medium">{date.day}</div>
                              <div className="text-lg font-bold">{date.dayNum}</div>
                              <div className="text-xs">{date.month}</div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 3: Time & Meeting Type */}
                  <AnimatePresence mode="wait">
                    {currentStep >= 3 && selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="mb-8"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                            3
                          </span>
                          Select Time & Meeting Type
                        </h3>
                        
                        {/* Meeting Type */}
                        <div className="mb-6">
                          <p className="text-sm font-medium text-gray-700 mb-3">Preferred Meeting Type</p>
                          <div className="grid grid-cols-2 gap-4">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setMeetingType('video')}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                meetingType === 'video'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <Video className="w-6 h-6 mx-auto mb-2 text-green-600" />
                              <span className="font-medium">Video Call</span>
                            </motion.button>
                            
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setMeetingType('phone')}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                meetingType === 'phone'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <Phone className="w-6 h-6 mx-auto mb-2 text-green-600" />
                              <span className="font-medium">Phone Call</span>
                            </motion.button>
                          </div>
                        </div>
                        
                        {/* Time Slots */}
                        <p className="text-sm font-medium text-gray-700 mb-3">Available Time Slots</p>
                        <div className="grid grid-cols-3 gap-3">
                          {timeSlots.map((slot) => (
                            <motion.button
                              key={slot.time}
                              type="button"
                              whileHover={{ scale: slot.available ? 1.05 : 1 }}
                              whileTap={{ scale: slot.available ? 0.95 : 1 }}
                              onClick={() => {
                                if (slot.available) {
                                  setSelectedTime(slot.time);
                                  if (currentStep < 4) setCurrentStep(4);
                                }
                              }}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg text-center transition-all relative ${
                                selectedTime === slot.time
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                  : !slot.available
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white border border-gray-200 hover:border-green-400 text-gray-700'
                              }`}
                            >
                              {slot.popular && slot.available && (
                                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                  Popular
                                </span>
                              )}
                              <span className="font-medium">{slot.time}</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 4: Contact Information */}
                  <AnimatePresence mode="wait">
                    {currentStep >= 4 && selectedTime && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                            4
                          </span>
                          Your Information
                        </h3>
                        
                        <div className="bg-white rounded-xl shadow-lg p-8">
                          <div className="grid md:grid-cols-2 gap-6">
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
                              />
                            </div>
                            
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
                              />
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
                              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                                How urgent is this?
                              </label>
                              <select
                                id="urgency"
                                name="urgency"
                                value={formData.urgency}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="">Select urgency...</option>
                                <option value="asap">ASAP - Critical need</option>
                                <option value="month">Within a month</option>
                                <option value="quarter">This quarter</option>
                                <option value="exploring">Just exploring</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                              What are your main goals? *
                            </label>
                            <textarea
                              id="goals"
                              name="goals"
                              required
                              rows={4}
                              value={formData.goals}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Tell us about your business goals and challenges..."
                            />
                          </div>
                          
                          <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                          >
                            {isSubmitting ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <Clock className="w-5 h-5" />
                                </motion.div>
                                Booking Consultation...
                              </>
                            ) : (
                              <>
                                <Calendar className="w-5 h-5" />
                                Confirm Free Consultation
                                <ChevronRight className="w-5 h-5" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <SectionAnimation>
          <div className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-12">
                What Our Clients Say
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </SectionAnimation>
      </div>
    </>
  );
}
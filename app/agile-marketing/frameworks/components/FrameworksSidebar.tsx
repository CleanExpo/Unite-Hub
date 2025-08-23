'use client';

import { motion } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  GitBranch, 
  Download, 
  Clock, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  BookOpen,
  Star
} from 'lucide-react';

export default function FrameworksSidebar() {
  const quickComparison = [
    {
      framework: 'Scrum',
      icon: Target,
      bestFor: 'Campaign teams',
      complexity: 'Medium',
      timeToImplement: '4-6 weeks',
      teamSize: '5-9 people'
    },
    {
      framework: 'Kanban',
      icon: BarChart3,
      bestFor: 'Ongoing work',
      complexity: 'Low',
      timeToImplement: '2-3 weeks',
      teamSize: 'Any size'
    },
    {
      framework: 'Lean',
      icon: GitBranch,
      bestFor: 'Process optimization',
      complexity: 'High',
      timeToImplement: '8-12 weeks',
      teamSize: 'Any size'
    }
  ];

  const resources = [
    {
      title: 'Scrum Marketing Guide',
      type: 'PDF',
      size: '2.3 MB',
      description: 'Complete guide to implementing Scrum in marketing teams'
    },
    {
      title: 'Kanban Board Templates',
      type: 'Excel',
      size: '1.1 MB',
      description: 'Ready-to-use Kanban board templates for marketing'
    },
    {
      title: 'Lean Marketing Checklist',
      type: 'PDF',
      size: '850 KB',
      description: 'Waste identification and elimination checklist'
    },
    {
      title: 'Framework Selection Tool',
      type: 'Interactive',
      size: 'Online',
      description: 'Quiz to help choose the right framework for your team'
    }
  ];

  const upcomingEvents = [
    {
      title: 'Agile Marketing Workshop',
      date: 'Feb 15, 2025',
      time: '9:00 AM - 5:00 PM',
      location: 'Brisbane CBD',
      spots: '8 spots left'
    },
    {
      title: 'Scrum Master Certification',
      date: 'Mar 8-9, 2025',
      time: '9:00 AM - 5:00 PM',
      location: 'Online',
      spots: '12 spots left'
    },
    {
      title: 'Lean Marketing Masterclass',
      date: 'Mar 22, 2025',
      time: '1:00 PM - 4:00 PM',
      location: 'Brisbane CBD',
      spots: '15 spots left'
    }
  ];

  const testimonials = [
    {
      quote: 'The Scrum framework transformed how our marketing team collaborates. We\'re 60% faster now.',
      author: 'Sarah Chen',
      company: 'TechStart Brisbane',
      rating: 5
    },
    {
      quote: 'Kanban gave us the visibility we needed. No more dropped tasks or missed deadlines.',
      author: 'Mike Torres',
      company: 'RetailPlus Australia',
      rating: 5
    }
  ];

  return (
    <div className="space-y-6">
      {/* Framework Quick Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Quick Comparison
        </h3>
        
        <div className="space-y-4">
          {quickComparison.map((framework, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <framework.icon className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white">{framework.framework}</h4>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Best for:</span>
                  <span className="text-gray-300">{framework.bestFor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Complexity:</span>
                  <span className="text-gray-300">{framework.complexity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timeline:</span>
                  <span className="text-gray-300">{framework.timeToImplement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team size:</span>
                  <span className="text-gray-300">{framework.teamSize}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Download Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-400" />
          Free Resources
        </h3>
        
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white text-sm">{resource.title}</h4>
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                  {resource.type}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-2">{resource.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">{resource.size}</span>
                <Download className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Download All Resources
        </button>
      </motion.div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Upcoming Training
        </h3>
        
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-medium text-white text-sm mb-2">{event.title}</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-green-400 text-xs font-medium">{event.spots}</span>
                <button className="text-purple-400 text-xs hover:text-purple-300 transition-colors">
                  Register →
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Client Testimonials */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-400" />
          Success Stories
        </h3>
        
        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex gap-1 mb-2">
                {[...Array(testimonial.rating)].map((_, starIndex) => (
                  <Star key={starIndex} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 text-sm italic mb-3">"{testimonial.quote}"</p>
              <div>
                <div className="text-white font-medium text-sm">{testimonial.author}</div>
                <div className="text-gray-400 text-xs">{testimonial.company}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6 text-center"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Need Help Choosing?</h3>
        <p className="text-gray-300 text-sm mb-4">
          Get personalized framework recommendations from our agile marketing experts.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm"
        >
          Free Consultation
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </motion.div>
    </div>
  );
}
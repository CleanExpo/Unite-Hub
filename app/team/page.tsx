'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Linkedin, Twitter, Mail, Phone, Award, Briefcase,
  GraduationCap, MapPin, Calendar, ArrowRight, Star
} from 'lucide-react';

export default function TeamPage() {
  const teamMembers = [
    {
      name: "Michael Chen",
      role: "CEO & Founder",
      bio: "Former tradie turned digital marketing expert. Michael started Unite Group after helping his brother's plumbing business grow from 2 to 15 employees using digital strategies.",
      expertise: ["Business Strategy", "Growth Planning", "Trade Industry"],
      experience: "15+ years",
      education: "MBA, Queensland University",
      certifications: ["Google Ads Certified", "HubSpot Inbound Marketing"],
      email: "michael@unite-group.com.au",
      linkedin: "michael-chen-unite",
      image: "/team/michael-chen.jpg"
    },
    {
      name: "Sarah Mitchell",
      role: "Head of Digital Marketing",
      bio: "Sarah specializes in helping trades dominate local search. She's helped over 200 Brisbane contractors achieve first-page Google rankings.",
      expertise: ["Local SEO", "Google Ads", "Content Strategy"],
      experience: "12+ years",
      education: "Bachelor of Marketing, Griffith University",
      certifications: ["Google Analytics IQ", "SEMrush SEO Toolkit"],
      email: "sarah@unite-group.com.au",
      linkedin: "sarah-mitchell-marketing",
      image: "/team/sarah-mitchell.jpg"
    },
    {
      name: "James Thompson",
      role: "Lead Automation Specialist",
      bio: "James helps trades save 20+ hours per week through smart automation. Former electrician who understands the daily challenges of running a trade business.",
      expertise: ["Business Automation", "CRM Systems", "Process Optimization"],
      experience: "10+ years",
      education: "Bachelor of IT, QUT",
      certifications: ["Zapier Expert", "Monday.com Partner"],
      email: "james@unite-group.com.au",
      linkedin: "james-thompson-automation",
      image: "/team/james-thompson.jpg"
    },
    {
      name: "Emma Rodriguez",
      role: "Senior SEO Strategist",
      bio: "Emma has helped Queensland trades generate over $10M in revenue through organic search. Specializes in technical SEO and content optimization.",
      expertise: ["Technical SEO", "Content Marketing", "Link Building"],
      experience: "8+ years",
      education: "Bachelor of Communications, UQ",
      certifications: ["Moz SEO Certification", "Ahrefs Academy"],
      email: "emma@unite-group.com.au",
      linkedin: "emma-rodriguez-seo",
      image: "/team/emma-rodriguez.jpg"
    },
    {
      name: "David Park",
      role: "PPC Campaign Manager",
      bio: "David manages over $500K in monthly ad spend for trade clients, consistently achieving 300%+ ROI on Google and Facebook campaigns.",
      expertise: ["Google Ads", "Facebook Ads", "Conversion Optimization"],
      experience: "7+ years",
      education: "Bachelor of Business, QUT",
      certifications: ["Google Ads Advanced", "Facebook Blueprint"],
      email: "david@unite-group.com.au",
      linkedin: "david-park-ppc",
      image: "/team/david-park.jpg"
    },
    {
      name: "Lisa Zhang",
      role: "Client Success Manager",
      bio: "Lisa ensures every client achieves their growth targets. She's passionate about helping trades scale from owner-operator to thriving businesses.",
      expertise: ["Account Management", "Strategic Planning", "Client Relations"],
      experience: "9+ years",
      education: "Bachelor of Business Management, Griffith",
      certifications: ["Project Management Professional", "Customer Success Certified"],
      email: "lisa@unite-group.com.au",
      linkedin: "lisa-zhang-success",
      image: "/team/lisa-zhang.jpg"
    }
  ];

  const advisors = [
    {
      name: "Robert Williams",
      role: "Industry Advisor",
      bio: "Former owner of Williams Construction (sold for $15M). Provides strategic guidance on trade industry trends.",
      company: "Williams Advisory",
      expertise: "30+ years in construction"
    },
    {
      name: "Patricia Lee",
      role: "Digital Strategy Advisor",
      bio: "Former Google Australia executive. Helps shape our digital marketing strategies.",
      company: "Tech Advisory Partners",
      expertise: "Digital transformation expert"
    }
  ];

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TeamPage",
            "name": "Unite Group Agency Team",
            "description": "Meet the expert team behind Unite Group Agency - Brisbane's leading digital marketing specialists for trades",
            "url": "https://unite-group.com.au/team",
            "mainEntity": {
              "@type": "Organization",
              "name": "Unite Group Agency",
              "employee": teamMembers.map(member => ({
                "@type": "Person",
                "name": member.name,
                "jobTitle": member.role,
                "email": member.email,
                "alumniOf": {
                  "@type": "EducationalOrganization",
                  "name": member.education.split(',')[1]?.trim() || "University"
                },
                "knowsAbout": member.expertise,
                "sameAs": member.linkedin ? `https://linkedin.com/in/${member.linkedin}` : undefined
              }))
            }
          })
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl lg:text-6xl font-black mb-6">
                Meet the Team Behind Your
                <span className="block text-cyan-300">Trade Business Success</span>
              </h1>
              
              <p className="text-xl mb-8 text-blue-100">
                Former tradies, digital experts, and growth specialists united by one mission: 
                helping Queensland trades dominate their markets.
              </p>

              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-300">25+</div>
                  <div className="text-sm text-blue-200">Team Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-300">150+</div>
                  <div className="text-sm text-blue-200">Years Combined Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-300">500+</div>
                  <div className="text-sm text-blue-200">Clients Served</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4">
                Our <span className="text-blue-600">Leadership Team</span>
              </h2>
              <p className="text-xl text-gray-600">
                Industry experts dedicated to your growth
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                  {/* Profile Image Placeholder */}
                  <div className="h-64 bg-gradient-to-br from-blue-400 to-purple-600 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-6xl font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                    
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{member.experience} experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{member.education}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {member.expertise.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Certifications</p>
                      <div className="space-y-1">
                        {member.certifications.map((cert, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                            <Award className="h-3 w-3 text-gold-500" />
                            {cert}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 flex gap-3">
                      <a 
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Email</span>
                      </a>
                      <a 
                        href={`https://linkedin.com/in/${member.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="text-sm">LinkedIn</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advisory Board */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4">
                Advisory <span className="text-blue-600">Board</span>
              </h2>
              <p className="text-xl text-gray-600">
                Industry leaders guiding our strategic direction
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {advisors.map((advisor, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {advisor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1">{advisor.name}</h3>
                      <p className="text-blue-600 font-medium mb-2">{advisor.role}</p>
                      <p className="text-gray-600 text-sm mb-2">{advisor.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{advisor.company}</span>
                        <span>•</span>
                        <span>{advisor.expertise}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Our Team CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-6">
              Join Our Growing Team
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              We're always looking for talented individuals who share our passion for helping trades succeed
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/careers"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all duration-300 group"
              >
                View Open Positions
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a
                href="mailto:careers@unite-group.com.au"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all duration-300"
              >
                <Mail className="mr-2 h-5 w-5" />
                Send Your Resume
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
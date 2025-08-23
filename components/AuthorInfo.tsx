import React from 'react';
import { User, Calendar, Award, Linkedin, Mail } from 'lucide-react';

export interface Author {
  name: string;
  role: string;
  bio: string;
  image?: string;
  email?: string;
  linkedin?: string;
  expertise?: string[];
  experience?: string;
  certifications?: string[];
}

interface AuthorInfoProps {
  author: Author;
  showFull?: boolean;
  publishDate?: string;
  readTime?: string;
}

// Default authors for the agency
export const AUTHORS = {
  michaelChen: {
    name: "Michael Chen",
    role: "CEO & Founder",
    bio: "Former tradie turned digital marketing expert. Michael founded Unite Group after experiencing firsthand the challenges trades face with online marketing.",
    email: "michael@unite-group.com.au",
    linkedin: "michael-chen-unite",
    expertise: ["Trade Industry", "Digital Strategy", "Business Growth"],
    experience: "15+ years",
    certifications: ["Google Ads Certified", "HubSpot Inbound Marketing"]
  },
  sarahMitchell: {
    name: "Sarah Mitchell",
    role: "Head of Digital Marketing",
    bio: "Sarah specializes in helping trades dominate local search. She's helped over 200 Brisbane contractors achieve first-page Google rankings.",
    email: "sarah@unite-group.com.au",
    linkedin: "sarah-mitchell-marketing",
    expertise: ["Local SEO", "Google Ads", "Content Strategy"],
    experience: "12+ years",
    certifications: ["Google Analytics IQ", "SEMrush SEO Toolkit"]
  },
  jamesThompson: {
    name: "James Thompson",
    role: "Lead Automation Specialist",
    bio: "Former electrician who understands the daily challenges of running a trade business. James helps trades save 20+ hours per week through smart automation.",
    email: "james@unite-group.com.au",
    linkedin: "james-thompson-automation",
    expertise: ["Business Automation", "CRM Systems", "Process Optimization"],
    experience: "10+ years",
    certifications: ["Zapier Expert", "Monday.com Partner"]
  },
  emmRodriguez: {
    name: "Emma Rodriguez",
    role: "Senior SEO Strategist",
    bio: "Emma has helped Queensland trades generate over $10M in revenue through organic search. Specializes in technical SEO and content optimization.",
    email: "emma@unite-group.com.au",
    linkedin: "emma-rodriguez-seo",
    expertise: ["Technical SEO", "Content Marketing", "Link Building"],
    experience: "8+ years",
    certifications: ["Moz SEO Certification", "Ahrefs Academy"]
  },
  uniteTeam: {
    name: "Unite Group Team",
    role: "Digital Marketing Experts",
    bio: "Our team of former tradies and digital marketing specialists work together to help Brisbane trades grow online.",
    email: "team@unite-group.com.au",
    expertise: ["Digital Marketing", "Trade Industry", "Local Business Growth"],
    experience: "Combined 50+ years"
  }
};

export default function AuthorInfo({ author, showFull = false, publishDate, readTime }: AuthorInfoProps) {
  if (showFull) {
    // Full author profile display
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          {/* Author Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {author.name.split(' ').map(n => n[0]).join('')}
          </div>
          
          {/* Author Details */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{author.name}</h3>
              <p className="text-blue-600 font-medium">{author.role}</p>
              {author.experience && (
                <p className="text-sm text-gray-500 mt-1">{author.experience} experience</p>
              )}
            </div>
            
            <p className="text-gray-700 mb-4">{author.bio}</p>
            
            {author.expertise && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Areas of Expertise:</p>
                <div className="flex flex-wrap gap-2">
                  {author.expertise.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {author.certifications && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Certifications:</p>
                <div className="space-y-1">
                  {author.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4 text-yellow-500" />
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contact Links */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              {author.email && (
                <a 
                  href={`mailto:${author.email}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </a>
              )}
              {author.linkedin && (
                <a 
                  href={`https://linkedin.com/in/${author.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Compact author byline display
  return (
    <div className="flex items-center gap-4 py-4 border-y border-gray-200">
      {/* Author Avatar */}
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
        {author.name.split(' ').map(n => n[0]).join('')}
      </div>
      
      {/* Author Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">By {author.name}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{author.role}</span>
          {publishDate && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {publishDate}
              </span>
            </>
          )}
          {readTime && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{readTime} min read</span>
            </>
          )}
        </div>
        {author.expertise && (
          <div className="flex gap-2 mt-2">
            {author.expertise.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Contact Links (compact) */}
      <div className="flex gap-2">
        {author.email && (
          <a 
            href={`mailto:${author.email}`}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Email author"
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
        {author.linkedin && (
          <a 
            href={`https://linkedin.com/in/${author.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="LinkedIn profile"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// Schema.org Person structured data generator
export function generateAuthorSchema(author: Author) {
  return {
    "@type": "Person",
    "name": author.name,
    "jobTitle": author.role,
    "description": author.bio,
    ...(author.email && { "email": author.email }),
    ...(author.linkedin && { 
      "sameAs": `https://linkedin.com/in/${author.linkedin}` 
    }),
    ...(author.expertise && { 
      "knowsAbout": author.expertise 
    }),
    "worksFor": {
      "@type": "Organization",
      "name": "Unite Group Agency",
      "url": "https://unite-group.com.au"
    }
  };
}
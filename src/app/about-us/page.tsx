'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Target, Award, Lightbulb, ArrowRight, CheckCircle, 
  Building2, Calendar, Globe, Shield, Linkedin, Trophy,
  Star, TrendingUp, Zap, Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function AboutUsPage() {
  const milestones = [
    { year: "2014", title: "Founded", description: "Unite Group established in Brisbane" },
    { year: "2016", title: "First Major Client", description: "Secured enterprise partnership" },
    { year: "2018", title: "Global Expansion", description: "Opened offices in Sydney and Melbourne" },
    { year: "2020", title: "AI Integration", description: "Launched AI-powered solutions" },
    { year: "2022", title: "500+ Clients", description: "Reached milestone of 500 satisfied clients" },
    { year: "2024", title: "Industry Leader", description: "Recognized as Australia's premier business partner" }
  ];

  const certifications = [
    { name: "ISO 27001", icon: Shield, description: "Information Security Management" },
    { name: "SOC 2 Type II", icon: Shield, description: "Security & Compliance" },
    { name: "GDPR Compliant", icon: Shield, description: "Data Protection" },
    { name: "AWS Partner", icon: Globe, description: "Cloud Solutions" }
  ];

  const awards = [
    { year: "2024", title: "Best Consulting Firm", org: "Australian Business Awards" },
    { year: "2023", title: "Innovation Excellence", org: "Tech Council Australia" },
    { year: "2023", title: "Top SEO Agency", org: "Digital Marketing Institute" },
    { year: "2022", title: "Customer Service Excellence", org: "CX Awards" }
  ];

  const teamMembers = [
    {
      name: "Phill McGurk",
      role: "Co-Founder & CEO",
      image: "/images/team-phill-mcgurk.png",
      linkedin: "https://linkedin.com/in/phillmcgurk",
      bio: "20+ years in product development and business strategy. Passionate about driving innovation through technology.",
      expertise: ["Product Strategy", "Business Development", "Innovation Management"]
    },
    {
      name: "Claire Booth",
      role: "Co-Founder & CMO",
      image: "/images/team-claire-booth.png",
      linkedin: "https://linkedin.com/in/clairebooth",
      bio: "Digital marketing expert with 15+ years experience in growth strategies and brand development.",
      expertise: ["Digital Marketing", "Growth Strategy", "Brand Development"]
    },
    {
      name: "Yasir Sarfraz",
      role: "CTO & Team Leader",
      image: "/images/team-yasir-sarfraz.png",
      linkedin: "https://linkedin.com/in/yasirsarfraz",
      bio: "Full-stack architect with expertise in scalable enterprise solutions and DevOps practices.",
      expertise: ["Software Architecture", "Cloud Solutions", "DevOps"]
    },
    {
      name: "Afifa",
      role: "Lead Developer",
      image: "/images/team-afifa.png",
      linkedin: "https://linkedin.com/in/afifa",
      bio: "Skilled engineer specializing in modern web technologies and robust application development.",
      expertise: ["Full-Stack Development", "React/Next.js", "API Design"]
    },
    {
      name: "Amina",
      role: "Senior Full-Stack Developer",
      image: "/images/team-amina.png",
      linkedin: "https://linkedin.com/in/amina",
      bio: "Expert in modern web frameworks with a passion for creating intuitive user experiences and scalable applications.",
      expertise: ["Full-Stack Development", "UI/UX Design", "System Architecture"]
    },
    {
      name: "Ayesha",
      role: "Marketing Specialist",
      image: "/images/team-ayesha.png",
      linkedin: "https://linkedin.com/in/ayesha",
      bio: "Creative marketing professional with expertise in digital campaigns, content strategy, and brand development.",
      expertise: ["Digital Marketing", "Content Strategy", "Brand Management"]
    },
    {
      name: "Rana",
      role: "Senior Backend Developer",
      image: "/images/team-rana.png",
      linkedin: "https://linkedin.com/in/rana",
      bio: "Backend specialist with deep expertise in database optimization, API development, and cloud infrastructure.",
      expertise: ["Backend Development", "Database Design", "Cloud Architecture"]
    },
    {
      name: "Shahid",
      role: "DevOps Engineer",
      image: "/images/team-shahid.png",
      linkedin: "https://linkedin.com/in/shahid",
      bio: "DevOps expert focused on CI/CD pipelines, infrastructure automation, and ensuring reliable system deployments.",
      expertise: ["DevOps", "CI/CD", "Infrastructure Automation"]
    }
  ];

  const values = [
    {
      icon: <Lightbulb className="h-8 w-8 text-teal-400" />,
      title: "Innovation First",
      description: "We leverage cutting-edge technologies to deliver solutions that keep you ahead."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-400" />,
      title: "Client Partnership",
      description: "Your success is our success. We build lasting relationships beyond projects."
    },
    {
      icon: <Target className="h-8 w-8 text-blue-400" />,
      title: "Results Driven",
      description: "Every strategy, every line of code is focused on measurable business outcomes."
    },
    {
      icon: <Award className="h-8 w-8 text-green-400" />,
      title: "Excellence Standard",
      description: "We don't just meet expectations—we exceed them with every delivery."
    }
  ];

  const stats = [
    { value: "500+", label: "Happy Clients", icon: Users },
    { value: "1000+", label: "Projects Delivered", icon: CheckCircle },
    { value: "99.9%", label: "Client Satisfaction", icon: Star },
    { value: "24/7", label: "Support Available", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-teal-600 text-white">Est. 2014</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              We Are
              <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Unite Group
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Australia's premier business solutions partner, transforming enterprises through 
              innovative technology, strategic consulting, and unparalleled expertise.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-teal-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              From humble beginnings to industry leadership
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                A Decade of Innovation
              </h3>
              <p className="text-slate-300 mb-6">
                Founded in 2014 in Brisbane, Unite Group began with a simple mission: 
                to bridge the gap between business ambition and technological capability. 
                What started as a small team of passionate technologists has grown into 
                Australia's most trusted business solutions partner.
              </p>
              <p className="text-slate-300 mb-6">
                Over the years, we've helped hundreds of businesses transform their 
                operations, enhance their digital presence, and achieve unprecedented growth. 
                Our journey has been marked by continuous learning, innovation, and an 
                unwavering commitment to client success.
              </p>
              <p className="text-slate-300">
                Today, we stand as a testament to what's possible when expertise meets 
                dedication. With offices across Australia and a global client base, we 
                continue to push boundaries and set new standards in business consulting 
                and technology solutions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-1">
                <div className="bg-slate-800 rounded-2xl p-8">
                  <Building2 className="h-16 w-16 text-teal-400 mb-6" />
                  <h4 className="text-xl font-bold text-white mb-4">Our Headquarters</h4>
                  <p className="text-slate-300 mb-4">
                    Located in the heart of Brisbane, our state-of-the-art facility 
                    serves as the innovation hub for all our operations.
                  </p>
                  <div className="space-y-2">
                    <p className="text-slate-400">📍 Brisbane, Australia</p>
                    <p className="text-slate-400">🌏 Serving clients globally</p>
                    <p className="text-slate-400">👥 50+ expert professionals</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-teal-600 to-cyan-600" />
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex items-center mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className="flex-1" />
                <div className="relative z-10 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full p-4 mx-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <Card className="flex-1 bg-slate-800 border-slate-700">
                  <CardHeader>
                    <Badge className="w-fit mb-2">{milestone.year}</Badge>
                    <CardTitle className="text-white">{milestone.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300">{milestone.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              The principles that guide every decision and drive every success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-800 border-slate-700 hover:border-teal-600 transition-colors">
                  <CardHeader className="text-center">
                    <div className="mb-4">{value.icon}</div>
                    <CardTitle className="text-xl text-white">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-center">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Leadership Team</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Meet the visionaries driving innovation and excellence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-800 border-slate-700 hover:border-teal-600 transition-all hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-600 p-1">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                          {member.image ? (
                            <Image
                              src={member.image}
                              alt={member.name}
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl font-bold text-white">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Link 
                        href={member.linkedin}
                        className="absolute bottom-0 right-1/2 transform translate-x-12 bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4 text-white" />
                      </Link>
                    </div>
                    <h3 className="text-xl font-bold text-white text-center mb-1">{member.name}</h3>
                    <p className="text-teal-400 text-center mb-4">{member.role}</p>
                    <p className="text-slate-300 text-sm mb-4">{member.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Certifications */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Recognition & Trust</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Industry awards and certifications that validate our commitment to excellence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {awards.map((award, index) => (
              <motion.div
                key={`${award.year}-${award.title}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-r from-teal-600/10 to-cyan-600/10 border-teal-600/50">
                  <CardContent className="flex items-center p-6">
                    <Trophy className="h-12 w-12 text-teal-400 mr-4" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{award.title}</h3>
                      <p className="text-slate-300">{award.org}</p>
                      <p className="text-teal-400 text-sm">{award.year}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <cert.icon className="h-12 w-12 text-teal-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">{cert.name}</h3>
                  <p className="text-slate-400 text-sm">{cert.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of successful businesses that have partnered with Unite Group 
              to achieve their digital transformation goals.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
                <Link href="/book-consultation">
                  Book Free Consultation
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                <Link href="/contact">
                  Get In Touch
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

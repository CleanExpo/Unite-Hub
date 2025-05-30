import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Award, Lightbulb, ArrowRight, CheckCircle } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: <Lightbulb className="h-8 w-8 text-teal-400" />,
      title: "Innovation",
      description: "We leverage cutting-edge technologies and methodologies to deliver solutions that keep our clients ahead of the competition."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-400" />,
      title: "Collaboration",
      description: "We believe in building strong partnerships with our clients, working together to achieve exceptional results."
    },
    {
      icon: <Target className="h-8 w-8 text-blue-400" />,
      title: "Excellence",
      description: "We are committed to delivering the highest quality solutions that exceed expectations and drive measurable results."
    },
    {
      icon: <Award className="h-8 w-8 text-green-400" />,
      title: "Integrity",
      description: "We operate with transparency, honesty, and ethical practices in all our business relationships and projects."
    }
  ];

  const achievements = [
    "Years of combined expertise across diverse industries",
    "Successful projects delivered on time and within budget",
    "Long-term partnerships with satisfied clients",
    "Cutting-edge solutions using modern technologies",
    "Comprehensive training programs delivered",
    "Strategic SEO campaigns that drive results"
  ];

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
            <Link href="/about" className="text-white font-medium">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            About
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              UNITE Group
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            We are a team of passionate professionals dedicated to empowering businesses through expert education, 
            innovative software development, and strategic SEO services.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-slate-300 mb-6">
                At UNITE Group, we believe that every business has the potential to achieve extraordinary success. 
                Our mission is to unlock that potential through comprehensive consultation, expert education, 
                cutting-edge software development, and strategic SEO services.
              </p>
              <p className="text-lg text-slate-300 mb-8">
                We start every relationship with our signature $550 consultation, providing deep business analysis 
                and strategic roadmap development that sets the foundation for transformative growth.
              </p>
              <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                <Link href="/pricing">
                  Book Your Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <Card className="bg-slate-800 border-slate-700 p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="h-10 w-10 text-slate-900" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                  <p className="text-slate-300">
                    To be the trusted partner that businesses turn to when they need expert guidance, 
                    innovative solutions, and strategic growth acceleration.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              These principles guide everything we do and shape how we serve our clients.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="h-full bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
                <CardHeader className="text-center">
                  <div className="mb-4">{value.icon}</div>
                  <CardTitle className="text-xl text-white">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm text-center">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              What We Do
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              We provide comprehensive solutions that address every aspect of your business growth journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Strategic Consultation</CardTitle>
                <CardDescription className="text-slate-300">
                  Our signature $550 consultation provides comprehensive business analysis and strategic planning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span className="text-slate-300 text-sm">In-depth business assessment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span className="text-slate-300 text-sm">Technology needs analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span className="text-slate-300 text-sm">Strategic roadmap development</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Expert Education</CardTitle>
                <CardDescription className="text-slate-300">
                  Professional training and development programs to enhance your team&apos;s capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    <span className="text-slate-300 text-sm">Custom curriculum development</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    <span className="text-slate-300 text-sm">Expert-led training sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    <span className="text-slate-300 text-sm">Hands-on workshops</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Software Development</CardTitle>
                <CardDescription className="text-slate-300">
                  Cutting-edge software solutions built with modern technologies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Custom application development</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Modern tech stack implementation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Scalable architecture design</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Strategic SEO</CardTitle>
                <CardDescription className="text-slate-300">
                  Data-driven SEO strategies to improve your online visibility and drive growth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300 text-sm">Comprehensive SEO audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300 text-sm">Keyword research & strategy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300 text-sm">Technical SEO optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Track Record
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              We are proud of what we have accomplished and the relationships we have built.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 bg-slate-800 p-4 rounded-lg border border-slate-700">
                <CheckCircle className="h-5 w-5 text-teal-400 flex-shrink-0" />
                <span className="text-slate-300">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Our diverse team of experts brings together decades of experience in product development, marketing, software engineering, design, and leadership.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {/* Phill McGurk - Co-Owner */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 relative overflow-hidden rounded-full">
                  <Image
                    src="/placeholder-user.jpg"
                    alt="Phill McGurk - Co-Owner, Product Development"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Phill McGurk</h3>
                <p className="text-teal-400 font-semibold mb-3">Co-Owner</p>
                <p className="text-purple-400 font-medium mb-3">Product Development</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>Product Manager</div>
                  <div>Product Development Engineer</div>
                  <div>Product Owner</div>
                  <div>Product Analyst</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Expert in product strategy and development lifecycle management. Drives innovation through comprehensive product management and analytical insights.
                </p>
              </CardContent>
            </Card>

            {/* Claire Booth - Co-Owner */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">CB</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Claire Booth</h3>
                <p className="text-teal-400 font-semibold mb-3">Co-Owner</p>
                <p className="text-purple-400 font-medium mb-3">Marketing</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>Digital Marketing Manager</div>
                  <div>Marketing Technologist</div>
                  <div>Product Marketing Manager</div>
                  <div>SEO Specialist</div>
                  <div>Growth Hacker</div>
                  <div>Social Media Manager</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Digital marketing strategist specializing in growth acceleration and brand visibility through comprehensive marketing solutions.
                </p>
              </CardContent>
            </Card>

            {/* Yasir Sarfraz - Team Leader */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">YS</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Yasir Sarfraz</h3>
                <p className="text-emerald-400 font-semibold mb-3">Team Leader</p>
                <p className="text-blue-400 font-medium mb-3">Software Builder</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>Software Engineer</div>
                  <div>Software Developer</div>
                  <div>Programmer</div>
                  <div>Full Stack Developer</div>
                  <div>Backend/Frontend Developer</div>
                  <div>DevOps Engineer</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Technical leader with comprehensive expertise in full-stack development and DevOps practices for scalable solutions.
                </p>
              </CardContent>
            </Card>

            {/* Afifa - Software Builder */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">AF</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Afifa</h3>
                <p className="text-blue-400 font-medium mb-3">Software Builder</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>Software Engineer</div>
                  <div>Software Developer</div>
                  <div>Programmer</div>
                  <div>Full Stack Developer</div>
                  <div>Backend/Frontend Developer</div>
                  <div>DevOps Engineer</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Skilled software engineer proficient in full-stack development and modern programming practices for robust applications.
                </p>
              </CardContent>
            </Card>

            {/* Ayesha - Design */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">AY</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ayesha</h3>
                <p className="text-orange-400 font-medium mb-3">Design</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>UX Designer</div>
                  <div>UI Designer</div>
                  <div>Product Designer</div>
                  <div>Graphic Designer</div>
                  <div>Interaction Designer</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Creative design specialist focused on user experience and interface design to create intuitive digital experiences.
                </p>
              </CardContent>
            </Card>

            {/* Amina - Design */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">AM</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Amina</h3>
                <p className="text-orange-400 font-medium mb-3">Design</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>UX Designer</div>
                  <div>UI Designer</div>
                  <div>Product Designer</div>
                  <div>Graphic Designer</div>
                  <div>Interaction Designer</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Talented design professional specializing in user-centered design and visual communication for compelling solutions.
                </p>
              </CardContent>
            </Card>

            {/* Usman - Software Builder */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">US</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Usman</h3>
                <p className="text-blue-400 font-medium mb-3">Software Builder</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>Software Engineer</div>
                  <div>Software Developer</div>
                  <div>Programmer</div>
                  <div>Full Stack Developer</div>
                  <div>Backend/Frontend Developer</div>
                  <div>DevOps Engineer</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Dedicated software engineer with expertise in full-stack development and DevOps practices for comprehensive solutions.
                </p>
              </CardContent>
            </Card>

            {/* Shahid - Design */}
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">SH</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Shahid</h3>
                <p className="text-orange-400 font-medium mb-3">Design</p>
                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div>UX Designer</div>
                  <div>UI Designer</div>
                  <div>Product Designer</div>
                  <div>Graphic Designer</div>
                  <div>Interaction Designer</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Experienced design professional with expertise in user experience and visual design for engaging digital products.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Work Together?
          </h2>
          <p className="text-xl mb-8 text-teal-100">
            Start with our comprehensive $550 consultation and discover how UNITE Group can help transform your business.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/pricing">Book Consultation</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

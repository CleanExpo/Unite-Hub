import { Metadata } from 'next';
import { Briefcase, MapPin, Clock, DollarSign, Users, Zap, Heart, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Careers | Unite-Hub',
  description: 'Join the Unite-Hub team and help build the future of marketing automation',
};

// Mock job listings (replace with real data from your database)
const jobs = [
  {
    id: 1,
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$120k - $180k',
    description: 'Build the next generation of AI-powered marketing automation tools using Next.js, TypeScript, and Claude AI.',
  },
  {
    id: 2,
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    salary: '$90k - $140k',
    description: 'Craft beautiful, intuitive user experiences that make complex marketing workflows feel effortless.',
  },
  {
    id: 3,
    title: 'AI/ML Engineer',
    department: 'Engineering',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    salary: '$130k - $200k',
    description: 'Design and optimize AI models for contact intelligence, content generation, and predictive analytics.',
  },
  {
    id: 4,
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$70k - $100k',
    description: 'Help our customers succeed by providing exceptional support, training, and strategic guidance.',
  },
  {
    id: 5,
    title: 'Content Marketing Lead',
    department: 'Marketing',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    salary: '$80k - $120k',
    description: 'Create compelling content that educates, inspires, and converts prospects into Unite-Hub advocates.',
  },
];

export default function CareersPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Join Our Team</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're building the future of marketing automation. If you're passionate about AI, elegant UX,
            and solving real problems, we'd love to hear from you.
          </p>
        </div>

        {/* Why Join Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Unite-Hub?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Cutting-Edge Tech</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Work with the latest AI models (Claude), Next.js 16, React 19, and modern infrastructure
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Remote-First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Work from anywhere. We hire globally and provide stipends for home office setup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Health & Wellness</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comprehensive health insurance, unlimited PTO, and mental health support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Amazing Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Collaborate with talented, kind people who care about craft and customer impact
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16 bg-muted/50 border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Perks & Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Competitive Salary</h3>
                <p className="text-sm text-muted-foreground">Top-of-market compensation + equity</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Health Coverage</h3>
                <p className="text-sm text-muted-foreground">Medical, dental, vision for you & family</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Unlimited PTO</h3>
                <p className="text-sm text-muted-foreground">Take time off when you need it</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Home Office Stipend</h3>
                <p className="text-sm text-muted-foreground">$1,500 for equipment & setup</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Learning Budget</h3>
                <p className="text-sm text-muted-foreground">$2,000/year for courses & conferences</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Team Retreats</h3>
                <p className="text-sm text-muted-foreground">Bi-annual in-person meetups</p>
              </div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Open Positions ({jobs.length})</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <CardDescription>{job.description}</CardDescription>
                    </div>
                    <Button asChild>
                      <a href={`mailto:careers@unite-hub.com?subject=Application for ${job.title}`}>
                        Apply Now
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {job.department}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.type}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {job.salary}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Hiring Process</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Apply</h3>
              <p className="text-sm text-muted-foreground">
                Submit your resume and cover letter via email
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Initial Call</h3>
              <p className="text-sm text-muted-foreground">
                30-min intro call with our team (typically within 1 week)
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Skills Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Take-home project or technical interview
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="font-semibold mb-2">Team Fit</h3>
              <p className="text-sm text-muted-foreground">
                Meet the team and discuss collaboration
              </p>
            </div>
          </div>
        </div>

        {/* No Openings? */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Don't see a role that fits?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're always on the lookout for exceptional talent. Send us your resume and tell us what
            role you'd love to create at Unite-Hub.
          </p>
          <Button asChild>
            <a href="mailto:careers@unite-hub.com?subject=General Application">
              Send General Application
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

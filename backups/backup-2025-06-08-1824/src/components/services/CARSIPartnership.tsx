'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Award, Users, Trophy, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export function CARSIPartnership() {
  const benefits = [
    {
      icon: <Award className="h-6 w-6" />,
      title: 'IICRC Approved School',
      description: 'Official training partner for industry-leading certifications'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: '10,000+ Trained',
      description: 'Professionals across Australia and New Zealand'
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: '500+ Certifications',
      description: 'Issued to restoration and cleaning professionals'
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Comprehensive Programs',
      description: 'From technical skills to leadership development'
    }
  ];

  const certifications = [
    'Water Damage Restoration (WRT)',
    'Applied Structural Drying (ASD)',
    'Fire & Smoke Restoration (FSRT)',
    'Mold Remediation (AMRT)',
    'Carpet Cleaning (CCT)',
    'Odor Control (OCT)'
  ];

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-teal-600 text-white">Strategic Partnership</Badge>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Unite Group × CARSI Education
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Combining business consulting excellence with industry-leading education and certification programs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {benefits.map((benefit, index) => (
            <div key={benefit.title} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-lg flex items-center justify-center">
                  {benefit.icon}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Card className="border-teal-600 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Featured IICRC Certifications</CardTitle>
            <CardDescription>
              Industry-recognized certifications that advance careers and ensure compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{cert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="https://carsi.au" target="_blank" rel="noopener noreferrer">
              Explore Full Course Catalog
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services/expert-education">
              Learn About Our Training
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mini version for sidebars or smaller sections
export function CARSIPartnershipBadge() {
  return (
    <Link href="/services/expert-education" className="block">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-4 text-white hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-6 w-6" />
          <span className="font-bold">Powered by CARSI</span>
        </div>
        <p className="text-sm text-teal-100">
          Access industry-leading certifications and training programs through our education partner
        </p>
      </div>
    </Link>
  );
}

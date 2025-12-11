import Image from 'next/image';
import { VideoPlayer } from './_components/VideoPlayer'; // Assuming you create a separate component
import { CtaButton } from './_components/CtaButton'; // Import the new CTA button
import { SynthexVideoJsonLd } from './_components/SynthexJsonLd'; // For structured data
import {
  TrendingUp,
  MapPin,
  Share2,
  BarChart3,
  MessageSquareQuote,
  Building2,
  Check,
  ChevronDown,
} from 'lucide-react';

export default function SynthexPage() {
  return (
    <>
      {/* For SEO: Add JSON-LD structured data to the head */}
      <SynthexVideoJsonLd />

      <main className="bg-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src="/placeholders/synthex-hero.png"
            alt="Autonomous marketing dashboard with GBP map pack for Australian SMBs"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 gap-y-6">
            {/* You can add headline text over the image here */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold">
                Autonomous Marketing for Your Business
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto">
                Let Synthex handle your SEO, GBP, and social presence, so you can focus on what you do best.
              </p>
            </div>
            <CtaButton href="/free-trial" showArrow>
              Start Free Trial
            </CtaButton>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">See It In Action</h2>
            <VideoPlayer />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 bg-gray-800/50 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Features to Automate Your Growth
              </h2>
              <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
                Synthex provides a complete suite of autonomous tools designed to elevate your online presence without the manual effort.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
                  title: 'Autonomous SEO',
                  description: 'Let our AI handle on-page optimizations, keyword tracking, and backlink opportunities to climb the search rankings.',
                },
                {
                  icon: <MapPin className="h-8 w-8 text-orange-500" />,
                  title: 'GBP Management',
                  description: 'Automated posts, Q&A monitoring, and intelligent review responses to keep your Google Business Profile active and engaging.',
                },
                {
                  icon: <Share2 className="h-8 w-8 text-orange-500" />,
                  title: 'Social Media Automation',
                  description: 'Generate and schedule compelling content across your social platforms, tailored to your brand and audience.',
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-orange-500" />,
                  title: 'AI-Powered Analytics',
                  description: 'Get clear, actionable insights from your marketing data. Our AI surfaces what matters most, without the noise.',
                },
                {
                  icon: <MessageSquareQuote className="h-8 w-8 text-orange-500" />,
                  title: 'Review Auto-Response',
                  description: 'Instantly and intelligently respond to customer reviews on multiple platforms, building trust and saving you time.',
                },
                {
                  icon: <Building2 className="h-8 w-8 text-orange-500" />,
                  title: 'Citation Building',
                  description: 'Automatically build and manage your local citations across the web, ensuring consistency and boosting local SEO.',
                },
              ].map((feature, index) => (
                <div key={index} className="bg-gray-800 p-8 rounded-lg border border-gray-700 flex flex-col items-start transition-transform hover:-translate-y-1">
                  <div className="bg-gray-900 p-3 rounded-full mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
                Choose the right plan for your business. No hidden fees, cancel anytime.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {[
                {
                  name: 'Starter',
                  price: '$49',
                  frequency: '/ month',
                  description: 'For new businesses getting started with autonomous marketing.',
                  features: ['Autonomous SEO (Basic)', 'GBP Management (1 Location)', 'Social Media Automation (2 Profiles)', 'Basic Analytics', 'Email Support'],
                  cta: 'Get Started',
                  href: '/signup?plan=starter',
                  popular: false,
                },
                {
                  name: 'Pro',
                  price: '$149',
                  frequency: '/ month',
                  description: 'For growing businesses ready to scale their online presence.',
                  features: ['Everything in Starter, plus:', 'Autonomous SEO (Advanced)', 'GBP Management (3 Locations)', 'AI-Powered Analytics & Insights', 'Review Auto-Response', 'Priority Email & Chat Support'],
                  cta: 'Start Free Trial',
                  href: '/free-trial?plan=pro',
                  popular: true,
                },
                {
                  name: 'Enterprise',
                  price: 'Custom',
                  frequency: '',
                  description: 'For large organizations with custom needs and dedicated support.',
                  features: ['Everything in Pro, plus:', 'Unlimited Locations & Profiles', 'Citation Building & Management', 'API Access', 'Dedicated Account Manager', 'Custom Integrations'],
                  cta: 'Contact Sales',
                  href: '/contact-sales',
                  popular: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-gray-800 p-8 rounded-lg border ${plan.popular ? 'border-orange-500' : 'border-gray-700'} ${plan.popular ? 'lg:scale-105' : ''}`}
                >
                  {plan.popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</div>}
                  <h3 className="text-2xl font-semibold mb-4">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    {plan.frequency && <span className="ml-1 text-xl font-semibold text-gray-400">{plan.frequency}</span>}
                  </div>
                  <p className="text-gray-400 mb-6 h-12">{plan.description}</p>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <CtaButton href={plan.href} variant={plan.popular ? 'default' : 'outline'} className="w-full">
                    {plan.cta}
                  </C-taButton>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-20 bg-gray-800/50 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  question: 'What is autonomous marketing?',
                  answer: 'Autonomous marketing uses AI to perform marketing tasks like SEO, content creation, and social media management with minimal human intervention. Synthex automates these processes to save you time and improve results.',
                },
                {
                  question: 'Is Synthex suitable for my small business?',
                  answer: 'Absolutely. Synthex is designed specifically for Australian small and medium-sized businesses (SMBs) to help them compete online without needing a large marketing team or budget.',
                },
                {
                  question: 'Can I cancel my subscription at any time?',
                  answer: "Yes, you can cancel your subscription at any time. Our plans are flexible, and we don't believe in long-term contracts. You have full control over your subscription.",
                },
                {
                  question: 'What kind of support do you offer?',
                  answer: 'We offer email support on our Starter plan, and priority email and chat support on our Pro plan. Our Enterprise plan includes a dedicated account manager for personalized assistance.',
                },
                {
                  question: 'How long does it take to see results?',
                  answer: 'While some results like social media posts are immediate, SEO and GBP improvements can take a few weeks to a few months to become noticeable. Our platform is designed for long-term, sustainable growth.',
                },
              ].map((faq, index) => (
                <details key={index} className="group bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <summary className="flex justify-between items-center font-semibold cursor-pointer list-none">
                    <span>{faq.question}</span>
                    <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-300 group-open:-rotate-180" />
                  </summary>
                  <p className="text-gray-400 mt-4">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 
          Industries Collage Section (Optional) 
          Uncomment this section if you generate and decide to use the industries collage.
        */}
        {/*
        <section className="py-12 md:py-20 bg-gray-800 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Powering Australian Small Businesses
            </h2>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/placeholders/synthex-industries.png"
                alt="Grid of Australian small business scenes with location pins"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
        */}
      </main>
    </>
  );
}
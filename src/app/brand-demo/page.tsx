'use client';

import { Logo, LogoText, MembershipBadge } from '@/components/branding/Logo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BrandDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="lg" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-unite-blue">Unite-Hub</span>{' '}
            <span className="text-unite-orange">Brand System</span>
          </h1>
          <p className="text-lg text-unite-navy">Component Showcase & Usage Examples</p>
        </div>

        {/* Logo Sizes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-unite-blue">Logo Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-end justify-items-center">
              <div className="text-center">
                <Logo size="sm" />
                <p className="mt-2 text-sm text-muted-foreground">Small (80px)</p>
              </div>
              <div className="text-center">
                <Logo size="md" />
                <p className="mt-2 text-sm text-muted-foreground">Medium (120px)</p>
              </div>
              <div className="text-center">
                <Logo size="lg" />
                <p className="mt-2 text-sm text-muted-foreground">Large (160px)</p>
              </div>
              <div className="text-center">
                <Logo size="xl" />
                <p className="mt-2 text-sm text-muted-foreground">Extra Large (200px)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership Badges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-unite-blue">Membership Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-2 border-unite-teal rounded-lg p-6 text-center">
                <MembershipBadge tier="starter" size="lg" className="mx-auto mb-4" />
                <h3 className="font-bold text-lg text-unite-navy">Starter Member</h3>
                <p className="text-3xl font-bold text-unite-blue mt-2">$249</p>
                <p className="text-muted-foreground">per month + GST</p>
              </div>
              <div className="border-2 border-unite-orange rounded-lg p-6 text-center">
                <MembershipBadge tier="professional" size="lg" className="mx-auto mb-4" />
                <h3 className="font-bold text-lg text-unite-navy">Professional Member</h3>
                <p className="text-3xl font-bold text-unite-orange mt-2">$549</p>
                <p className="text-muted-foreground">per month + GST</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-unite-blue">Brand Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="h-24 bg-unite-teal rounded-lg mb-2"></div>
                <p className="text-sm font-semibold">Teal</p>
                <p className="text-xs text-muted-foreground">#3b9ba8</p>
              </div>
              <div>
                <div className="h-24 bg-unite-blue rounded-lg mb-2"></div>
                <p className="text-sm font-semibold">Blue</p>
                <p className="text-xs text-muted-foreground">#2563ab</p>
              </div>
              <div>
                <div className="h-24 bg-unite-orange rounded-lg mb-2"></div>
                <p className="text-sm font-semibold">Orange</p>
                <p className="text-xs text-muted-foreground">#f39c12</p>
              </div>
              <div>
                <div className="h-24 bg-unite-gold rounded-lg mb-2"></div>
                <p className="text-sm font-semibold">Gold</p>
                <p className="text-xs text-muted-foreground">#e67e22</p>
              </div>
              <div>
                <div className="h-24 bg-unite-navy rounded-lg mb-2"></div>
                <p className="text-sm font-semibold">Navy</p>
                <p className="text-xs text-muted-foreground">#1e3a5f</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-unite-blue">Branded Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-unite-teal hover:bg-unite-teal/90 text-white">
                Teal Primary
              </Button>
              <Button className="bg-unite-blue hover:bg-unite-blue/90 text-white">
                Blue Secondary
              </Button>
              <Button className="bg-unite-orange hover:bg-unite-orange/90 text-white">
                Orange Accent
              </Button>
              <Button variant="outline" className="border-unite-teal text-unite-teal hover:bg-unite-teal hover:text-white">
                Teal Outline
              </Button>
              <Button variant="outline" className="border-unite-orange text-unite-orange hover:bg-unite-orange hover:text-white">
                Orange Outline
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Typography Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-unite-blue">Typography with Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-unite-blue">
                H1 Heading - Unite Blue
              </h1>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-unite-navy">
                H2 Heading - Unite Navy
              </h2>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-unite-orange">
                H3 Heading - Unite Orange
              </h3>
            </div>
            <div>
              <p className="text-lg text-unite-navy">
                Body text uses navy color for excellent readability and professional appearance.
              </p>
            </div>
            <div>
              <span className="text-xl font-bold text-unite-orange">
                Accent text • Highlights • Special callouts
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Usage Example */}
        <Card className="border-unite-teal border-2">
          <CardHeader className="bg-gradient-to-r from-unite-teal to-unite-blue text-white">
            <CardTitle>Sample Dashboard Card</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-unite-blue">$45,231</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="text-2xl font-bold text-unite-orange">+12.5%</p>
              </div>
            </div>
            <Button className="w-full bg-unite-teal hover:bg-unite-teal/90 text-white">
              View Details
            </Button>
          </CardContent>
        </Card>

        {/* Logo Text Variant */}
        <div className="mt-12 text-center p-8 bg-white rounded-lg border-2 border-unite-teal">
          <h2 className="text-2xl font-bold mb-4 text-unite-navy">Logo Text Component</h2>
          <LogoText className="justify-center" />
          <p className="mt-4 text-sm text-muted-foreground">
            Use for navigation bars and compact spaces
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/services/blog";
import { useToast } from "@/components/ui/use-toast";

interface NewsletterSubscribeProps {
  variant?: 'card' | 'inline' | 'minimal';
  showCategories?: boolean;
}

const categories = [
  { id: 'industry-insights', label: 'Industry Insights' },
  { id: 'technical-tutorials', label: 'Technical Tutorials' },
  { id: 'business-strategy', label: 'Business Strategy' },
  { id: 'seo-best-practices', label: 'SEO Best Practices' },
  { id: 'case-studies', label: 'Case Studies' }
];

export function NewsletterSubscribe({ 
  variant = 'card', 
  showCategories = false 
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await subscribeToNewsletter(
        email, 
        name || undefined, 
        selectedCategories.length > 0 ? selectedCategories : undefined
      );
      
      setSuccess(true);
      setEmail('');
      setName('');
      setSelectedCategories([]);
      
      toast({
        title: "Successfully subscribed!",
        description: "Please check your email to verify your subscription.",
      });
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || success}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
        <Button
          type="submit"
          disabled={loading || success}
          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-teal-900/20 to-cyan-900/20 rounded-xl p-8 border border-teal-600/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Stay Updated</h3>
            <p className="text-slate-400">Get the latest insights delivered to your inbox</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
            <Button
              type="submit"
              disabled={loading || success}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Subscribe
                </>
              )}
            </Button>
          </div>

          {showCategories && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Select topics of interest:</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                      disabled={loading || success}
                    />
                    <span className="text-sm text-slate-300">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-900/20 border border-green-600 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-green-400">
              Success! Check your email to verify your subscription.
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full w-fit">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-white">
          Never Miss an Update
        </CardTitle>
        <CardDescription className="text-slate-400">
          Join our newsletter for the latest insights, tutorials, and business strategies
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              Name (optional)
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              required
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {showCategories && (
            <div className="space-y-2">
              <Label className="text-slate-300">Topics of Interest</Label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                      disabled={loading || success}
                    />
                    <span className="text-sm text-slate-400">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Subscribed!
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-900/20 border border-green-600 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Successfully subscribed!</p>
                <p className="text-green-400/80 text-sm mt-1">
                  Please check your email to verify your subscription.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

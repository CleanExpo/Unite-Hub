"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Target,
  Building2,
  Users,
  TrendingUp,
  Zap,
  Code,
  Search,
  BarChart3,
  Shield,
  GraduationCap,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    points: {
      consultation: number;
      development: number;
      seo: number;
      strategy: number;
      qa: number;
      education: number;
    };
  }[];
}

const questions: Question[] = [
  {
    id: "business-stage",
    question: "What stage is your business currently in?",
    options: [
      {
        value: "startup",
        label: "Early-stage startup (0-2 years)",
        points: { consultation: 10, development: 8, seo: 4, strategy: 8, qa: 3, education: 5 }
      },
      {
        value: "growth",
        label: "Growth phase (2-5 years)",
        points: { consultation: 6, development: 10, seo: 8, strategy: 7, qa: 7, education: 6 }
      },
      {
        value: "established",
        label: "Established business (5+ years)",
        points: { consultation: 4, development: 7, seo: 10, strategy: 10, qa: 9, education: 8 }
      },
      {
        value: "enterprise",
        label: "Enterprise organization",
        points: { consultation: 3, development: 9, seo: 6, strategy: 9, qa: 10, education: 10 }
      }
    ]
  },
  {
    id: "primary-challenge",
    question: "What's your primary business challenge right now?",
    options: [
      {
        value: "visibility",
        label: "Getting found by potential customers",
        points: { consultation: 5, development: 3, seo: 10, strategy: 6, qa: 2, education: 3 }
      },
      {
        value: "technology",
        label: "Outdated or inefficient technology",
        points: { consultation: 6, development: 10, seo: 2, strategy: 5, qa: 8, education: 4 }
      },
      {
        value: "growth",
        label: "Scaling and strategic growth",
        points: { consultation: 8, development: 6, seo: 7, strategy: 10, qa: 5, education: 6 }
      },
      {
        value: "quality",
        label: "Product quality and reliability",
        points: { consultation: 4, development: 7, seo: 2, strategy: 4, qa: 10, education: 5 }
      },
      {
        value: "skills",
        label: "Team capability and knowledge gaps",
        points: { consultation: 7, development: 4, seo: 3, strategy: 6, qa: 4, education: 10 }
      }
    ]
  },
  {
    id: "digital-presence",
    question: "How would you describe your current digital presence?",
    options: [
      {
        value: "none",
        label: "We need to build from scratch",
        points: { consultation: 10, development: 9, seo: 5, strategy: 8, qa: 3, education: 4 }
      },
      {
        value: "basic",
        label: "Basic website, minimal online activity",
        points: { consultation: 7, development: 8, seo: 9, strategy: 7, qa: 5, education: 5 }
      },
      {
        value: "moderate",
        label: "Active online but not optimized",
        points: { consultation: 5, development: 6, seo: 10, strategy: 8, qa: 7, education: 6 }
      },
      {
        value: "advanced",
        label: "Strong digital presence, looking to improve",
        points: { consultation: 3, development: 7, seo: 8, strategy: 10, qa: 9, education: 8 }
      }
    ]
  },
  {
    id: "budget-range",
    question: "What's your approximate budget for this project?",
    options: [
      {
        value: "starter",
        label: "< $10,000 - Testing the waters",
        points: { consultation: 10, development: 3, seo: 6, strategy: 5, qa: 4, education: 7 }
      },
      {
        value: "growth",
        label: "$10,000 - $50,000 - Ready to invest",
        points: { consultation: 5, development: 8, seo: 9, strategy: 7, qa: 7, education: 8 }
      },
      {
        value: "scale",
        label: "$50,000 - $100,000 - Serious transformation",
        points: { consultation: 3, development: 10, seo: 8, strategy: 9, qa: 9, education: 7 }
      },
      {
        value: "enterprise",
        label: "$100,000+ - Enterprise solution",
        points: { consultation: 2, development: 9, seo: 7, strategy: 10, qa: 10, education: 9 }
      }
    ]
  },
  {
    id: "timeline",
    question: "What's your ideal timeline for seeing results?",
    options: [
      {
        value: "immediate",
        label: "ASAP - Need quick wins",
        points: { consultation: 10, development: 4, seo: 7, strategy: 8, qa: 5, education: 6 }
      },
      {
        value: "quarter",
        label: "3-6 months - Steady progress",
        points: { consultation: 6, development: 8, seo: 10, strategy: 7, qa: 8, education: 7 }
      },
      {
        value: "year",
        label: "6-12 months - Long-term transformation",
        points: { consultation: 4, development: 10, seo: 8, strategy: 9, qa: 9, education: 8 }
      },
      {
        value: "ongoing",
        label: "Continuous improvement journey",
        points: { consultation: 3, development: 7, seo: 9, strategy: 10, qa: 10, education: 10 }
      }
    ]
  }
];

const serviceInfo = {
  consultation: {
    name: "Initial Consultation",
    icon: <MessageSquare className="h-8 w-8" />,
    description: "Start with a comprehensive assessment to map out your transformation journey",
    benefits: [
      "Personalized business analysis",
      "Clear action plan",
      "ROI projections",
      "Risk assessment"
    ],
    href: "/services/initial-consultation"
  },
  development: {
    name: "Software Development",
    icon: <Code className="h-8 w-8" />,
    description: "Build custom software solutions that give you a competitive edge",
    benefits: [
      "Scalable architecture",
      "Modern tech stack",
      "Agile development",
      "Ongoing support"
    ],
    href: "/services/software-development"
  },
  seo: {
    name: "Strategic SEO",
    icon: <Search className="h-8 w-8" />,
    description: "Dominate search results and attract your ideal customers",
    benefits: [
      "Keyword research",
      "Content strategy",
      "Technical optimization",
      "Monthly reporting"
    ],
    href: "/services/strategic-seo"
  },
  strategy: {
    name: "Business Strategy",
    icon: <BarChart3 className="h-8 w-8" />,
    description: "Data-driven strategies to accelerate your business growth",
    benefits: [
      "Market analysis",
      "Competitive positioning",
      "Growth roadmap",
      "KPI tracking"
    ],
    href: "/services/business-strategy"
  },
  qa: {
    name: "Quality Assurance",
    icon: <Shield className="h-8 w-8" />,
    description: "Ensure flawless performance and reliability",
    benefits: [
      "Automated testing",
      "Performance optimization",
      "Security audits",
      "Compliance checks"
    ],
    href: "/services/quality-assurance"
  },
  education: {
    name: "Expert Education",
    icon: <GraduationCap className="h-8 w-8" />,
    description: "Empower your team with cutting-edge skills and knowledge",
    benefits: [
      "Custom training programs",
      "Hands-on workshops",
      "Certification paths",
      "Ongoing mentorship"
    ],
    href: "/services/expert-education"
  }
};

export function ServiceRecommendationQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({
    consultation: 0,
    development: 0,
    seo: 0,
    strategy: 0,
    qa: 0,
    education: 0
  });

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const newScores = { consultation: 0, development: 0, seo: 0, strategy: 0, qa: 0, education: 0 };
    
    questions.forEach((question) => {
      const answer = answers[question.id];
      const option = question.options.find(o => o.value === answer);
      if (option) {
        Object.entries(option.points).forEach(([service, points]) => {
          newScores[service as keyof typeof newScores] += points;
        });
      }
    });

    setScores(newScores);
    setShowResults(true);
  };

  const getTopServices = () => {
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([service]) => service);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScores({ consultation: 0, development: 0, seo: 0, strategy: 0, qa: 0, education: 0 });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full">
            <Target className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-white">
          Find Your Perfect Service Match
        </CardTitle>
        <CardDescription className="text-lg">
          Answer a few questions to get personalized service recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-slate-400 mt-2">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  {questions[currentQuestion].question}
                </h3>
                
                <RadioGroup
                  value={answers[questions[currentQuestion].id] || ""}
                  onValueChange={handleAnswer}
                >
                  <div className="space-y-4">
                    {questions[currentQuestion].options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-4 rounded-lg border border-slate-700 hover:border-teal-600 cursor-pointer transition-colors"
                      >
                        <RadioGroupItem value={option.value} />
                        <Label className="cursor-pointer text-slate-300 font-normal">
                          {option.label}
                        </Label>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="border-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={!answers[questions[currentQuestion].id]}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                >
                  {currentQuestion === questions.length - 1 ? "Get Results" : "Next"}
                  {currentQuestion < questions.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
                  {currentQuestion === questions.length - 1 && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <Sparkles className="h-12 w-12 text-teal-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Your Personalized Recommendations
                </h3>
                <p className="text-slate-400">
                  Based on your responses, here are the services that best match your needs
                </p>
              </div>

              <div className="space-y-6">
                {getTopServices().map((service, index) => {
                  const info = serviceInfo[service as keyof typeof serviceInfo];
                  const scorePercentage = (scores[service as keyof typeof scores] / 50) * 100;
                  
                  return (
                    <motion.div
                      key={service}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 rounded-xl border ${
                        index === 0 
                          ? "bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border-teal-600" 
                          : "bg-slate-800/50 border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            index === 0 
                              ? "bg-gradient-to-br from-teal-600 to-cyan-600" 
                              : "bg-slate-700"
                          }`}>
                            <div className="text-white">{info.icon}</div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">
                              {info.name}
                            </h4>
                            {index === 0 && (
                              <Badge className="mt-1 bg-teal-600 text-white">
                                Best Match
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-teal-400">
                            {Math.round(scorePercentage)}%
                          </div>
                          <div className="text-sm text-slate-400">match</div>
                        </div>
                      </div>
                      
                      <p className="text-slate-300 mb-4">{info.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {info.benefits.map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2 text-sm text-slate-400">
                            <CheckCircle className="h-4 w-4 text-teal-500 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        asChild
                        className={
                          index === 0
                            ? "w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                            : "w-full bg-slate-700 hover:bg-slate-600"
                        }
                      >
                        <Link href={info.href}>
                          Learn More About {info.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={resetQuiz}
                  className="border-slate-700"
                >
                  Take Quiz Again
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                >
                  <Link href="/book-consultation">
                    Book Your $550 Consultation
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

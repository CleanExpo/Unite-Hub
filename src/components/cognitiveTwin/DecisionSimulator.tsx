/**
 * Decision Simulator - Cognitive Twin
 *
 * Decision scenario builder with AI-generated analysis,
 * pros/cons table per option, and decision recording.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Badge from "@/components/ui/badge";
import {
  Lightbulb,
  Plus,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  TrendingUp,
  TrendingDown,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionOption {
  id: string;
  title: string;
  description: string;
}

interface AIAnalysis {
  option_id: string;
  recommendation_score: number; // 0-100
  pros: string[];
  cons: string[];
  risks: string[];
  impact_assessment: {
    short_term: "positive" | "neutral" | "negative";
    long_term: "positive" | "neutral" | "negative";
    confidence: number;
  };
  key_considerations: string[];
}

interface DecisionSimulatorProps {
  onAnalyze?: (scenario: string, options: DecisionOption[]) => Promise<AIAnalysis[]>;
  onRecordDecision?: (
    scenario: string,
    selectedOption: string,
    rationale: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export default function DecisionSimulator({
  onAnalyze,
  onRecordDecision,
  isLoading = false,
}: DecisionSimulatorProps) {
  const [scenario, setScenario] = useState("");
  const [options, setOptions] = useState<DecisionOption[]>([
    { id: "1", title: "", description: "" },
    { id: "2", title: "", description: "" },
  ]);
  const [analysis, setAnalysis] = useState<AIAnalysis[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Add new option
  const addOption = () => {
    const newId = (options.length + 1).toString();
    setOptions([...options, { id: newId, title: "", description: "" }]);
  };

  // Remove option
  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  // Update option
  const updateOption = (id: string, field: "title" | "description", value: string) => {
    setOptions(options.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  // Validate form
  const isFormValid = () => {
    if (!scenario.trim()) return false;
    if (options.length < 2) return false;
    return options.every(opt => opt.title.trim() && opt.description.trim());
  };

  // Handle analyze
  const handleAnalyze = async () => {
    if (!isFormValid() || !onAnalyze) return;

    setAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await onAnalyze(scenario, options);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze decision");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle record decision
  const handleRecordDecision = async () => {
    if (!selectedOption || !rationale.trim() || !onRecordDecision) return;

    setRecording(true);
    setError(null);

    try {
      await onRecordDecision(scenario, selectedOption, rationale);
      setSuccess(true);
      // Reset form after 2 seconds
      setTimeout(() => {
        setScenario("");
        setOptions([
          { id: "1", title: "", description: "" },
          { id: "2", title: "", description: "" },
        ]);
        setAnalysis(null);
        setSelectedOption(null);
        setRationale("");
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setRecording(false);
    }
  };

  // Get impact icon
  const ImpactIcon = ({ impact }: { impact: "positive" | "neutral" | "negative" }) => {
    if (impact === "positive") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (impact === "negative") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Decision Scenario
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Scenario Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe the decision you need to make *
            </label>
            <Textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g., Should I switch to a new tech stack for our main product?"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Options to Consider *
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={options.length >= 5}
              >
                Add Option
              </Button>
            </div>

            <div className="space-y-4">
              {options.map((option, index) => (
                <Card key={option.id} variant="flat">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-3">
                        <Input
                          value={option.title}
                          onChange={(e) => updateOption(option.id, "title", e.target.value)}
                          placeholder="Option title"
                        />
                        <Textarea
                          value={option.description}
                          onChange={(e) => updateOption(option.id, "description", e.target.value)}
                          placeholder="Brief description of this option"
                          rows={2}
                          className="resize-none"
                        />
                      </div>

                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={!isFormValid() || analyzing}
            leftIcon={<Lightbulb className="w-4 h-4" />}
          >
            {analyzing ? "Analyzing..." : "Analyze Decision"}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && analysis.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">AI Analysis</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.map((opt) => {
              const option = options.find(o => o.id === opt.option_id);
              if (!option) return null;

              const isSelected = selectedOption === opt.option_id;

              return (
                <Card
                  key={opt.option_id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedOption(opt.option_id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            opt.recommendation_score >= 70 ? "success" :
                            opt.recommendation_score >= 40 ? "warning" : "danger"
                          }
                        >
                          {opt.recommendation_score}/100
                        </Badge>
                        {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Impact Assessment */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Impact Assessment</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <ImpactIcon impact={opt.impact_assessment.short_term} />
                          <div className="text-xs">
                            <div className="text-gray-500">Short-term</div>
                            <div className="font-medium capitalize">
                              {opt.impact_assessment.short_term}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ImpactIcon impact={opt.impact_assessment.long_term} />
                          <div className="text-xs">
                            <div className="text-gray-500">Long-term</div>
                            <div className="font-medium capitalize">
                              {opt.impact_assessment.long_term}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {opt.impact_assessment.confidence}%
                      </div>
                    </div>

                    {/* Pros */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Pros
                      </h4>
                      <ul className="space-y-1">
                        {opt.pros.map((pro, i) => (
                          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        Cons
                      </h4>
                      <ul className="space-y-1">
                        {opt.cons.map((con, i) => (
                          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    {opt.risks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="w-4 h-4" />
                          Risks
                        </h4>
                        <ul className="space-y-1">
                          {opt.risks.map((risk, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Considerations */}
                    {opt.key_considerations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key Considerations</h4>
                        <ul className="space-y-1">
                          {opt.key_considerations.map((consideration, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{consideration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Record Decision */}
          {selectedOption && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record Your Decision</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rationale for choosing this option *
                  </label>
                  <Textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explain why you chose this option and any additional context..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  variant="success"
                  fullWidth
                  onClick={handleRecordDecision}
                  loading={recording}
                  disabled={!rationale.trim() || recording || success}
                  leftIcon={success ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                >
                  {success ? "Decision Recorded!" : recording ? "Recording..." : "Record Decision"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

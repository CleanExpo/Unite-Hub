"use client";

/**
 * Operator Insights Dashboard - Phase 10 Week 5-6
 *
 * Dashboard for viewing operator performance metrics, accuracy history,
 * bias signals, and autonomy tuning recommendations.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Users,
  Lightbulb,
} from "lucide-react";

interface ReviewerScore {
  operator_id: string;
  accuracy_score: number;
  speed_score: number;
  consistency_score: number;
  impact_score: number;
  reliability_score: number;
  total_reviews: number;
  correct_decisions: number;
  overturned_decisions: number;
  avg_review_time_seconds: number | null;
  weighted_accuracy: number;
  last_review_at: string | null;
}

interface AccuracyRecord {
  id: string;
  decision: string;
  decision_at: string;
  outcome: string | null;
  review_time_seconds: number | null;
}

interface BiasSignal {
  id: string;
  operator_id: string;
  bias_type: string;
  severity: string;
  confidence: number;
  evidence: Record<string, unknown>;
  status: string;
  detected_at: string;
}

interface TuningRecommendation {
  id: string;
  domain: string;
  previous_level: string;
  new_level: string;
  reason: string;
  confidence: number;
  status: string;
}

interface OperatorInsightsDashboardProps {
  organizationId: string;
  currentUserId: string;
}

export function OperatorInsightsDashboard({
  organizationId,
  currentUserId,
}: OperatorInsightsDashboardProps) {
  const [selectedOperator, setSelectedOperator] = useState<string>(currentUserId);
  const [scores, setScores] = useState<ReviewerScore[]>([]);
  const [currentScore, setCurrentScore] = useState<ReviewerScore | null>(null);
  const [history, setHistory] = useState<AccuracyRecord[]>([]);
  const [biases, setBiases] = useState<BiasSignal[]>([]);
  const [recommendations, setRecommendations] = useState<TuningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAllData();
  }, [organizationId, selectedOperator]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchScores(),
        fetchHistory(),
        fetchBiases(),
        fetchRecommendations(),
      ]);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    // Fetch all org scores
    const allRes = await fetch(
      `/api/operator/insights?type=scores&operator_id=all&organization_id=${organizationId}`
    );
    const allData = await allRes.json();
    setScores(allData.scores || []);

    // Fetch selected operator score
    const res = await fetch(
      `/api/operator/insights?type=scores&operator_id=${selectedOperator}&organization_id=${organizationId}`
    );
    const data = await res.json();
    setCurrentScore(data.score);
  };

  const fetchHistory = async () => {
    const res = await fetch(
      `/api/operator/insights?type=history&operator_id=${selectedOperator}&organization_id=${organizationId}&limit=20`
    );
    const data = await res.json();
    setHistory(data.history || []);
  };

  const fetchBiases = async () => {
    const res = await fetch(
      `/api/operator/insights?type=biases&operator_id=all&organization_id=${organizationId}`
    );
    const data = await res.json();
    setBiases(data.biases || []);
  };

  const fetchRecommendations = async () => {
    const res = await fetch(
      `/api/operator/insights?type=recommendations&organization_id=${organizationId}`
    );
    const data = await res.json();
    setRecommendations(data.recommendations || []);
  };

  const handleDetectBiases = async () => {
    try {
      const res = await fetch("/api/operator/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "detect_biases",
          operator_id: selectedOperator,
          organization_id: organizationId,
        }),
      });
      const data = await res.json();
      if (data.biases) {
        await fetchBiases();
      }
    } catch (error) {
      console.error("Failed to detect biases:", error);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      const res = await fetch("/api/operator/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_recommendations",
          organization_id: organizationId,
        }),
      });
      await res.json();
      await fetchRecommendations();
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    }
  };

  const handleApplyRecommendation = async (id: string) => {
    try {
      await fetch("/api/operator/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_recommendation",
          recommendation_id: id,
        }),
      });
      await fetchRecommendations();
    } catch (error) {
      console.error("Failed to apply recommendation:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBiasTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DOMAIN_PREFERENCE: "Domain Preference",
      DOMAIN_AVERSION: "Domain Aversion",
      APPROVAL_BIAS: "Over-Approving",
      REJECTION_BIAS: "Over-Rejecting",
      SPEED_BIAS: "Rushing Reviews",
      AUTHORITY_DEFERENCE: "Authority Deference",
      INCONSISTENT_WEIGHTING: "Inconsistent Criteria",
      TIME_OF_DAY_BIAS: "Time-Based Variance",
      WORKLOAD_BIAS: "Volume Impact",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading insights...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Operator Insights
        </h2>
        <div className="flex items-center gap-4">
          <Select value={selectedOperator} onValueChange={setSelectedOperator}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentUserId}>Me</SelectItem>
              {scores
                .filter((s) => s.operator_id !== currentUserId)
                .map((s) => (
                  <SelectItem key={s.operator_id} value={s.operator_id}>
                    Operator {s.operator_id.slice(0, 8)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="biases">Biases</TabsTrigger>
          <TabsTrigger value="recommendations">Tuning</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {currentScore ? (
            <>
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Accuracy</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(currentScore.accuracy_score)}`}>
                      {currentScore.accuracy_score.toFixed(1)}%
                    </div>
                    <Progress value={currentScore.accuracy_score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Speed</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(currentScore.speed_score)}`}>
                      {currentScore.speed_score.toFixed(1)}
                    </div>
                    <Progress value={currentScore.speed_score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Consistency</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(currentScore.consistency_score)}`}>
                      {currentScore.consistency_score.toFixed(1)}
                    </div>
                    <Progress value={currentScore.consistency_score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Impact</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(currentScore.impact_score)}`}>
                      {currentScore.impact_score.toFixed(1)}
                    </div>
                    <Progress value={currentScore.impact_score} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Reliability Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Reliability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${getScoreColor(currentScore.reliability_score)}`}>
                      {currentScore.reliability_score.toFixed(1)}
                    </div>
                    <div className="flex-1">
                      <Progress value={currentScore.reliability_score} className="h-3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Reviews</span>
                      <div className="font-semibold">{currentScore.total_reviews}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Correct</span>
                      <div className="font-semibold text-green-600">
                        {currentScore.correct_decisions}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Overturned</span>
                      <div className="font-semibold text-red-600">
                        {currentScore.overturned_decisions}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scores
                      .sort((a, b) => b.reliability_score - a.reliability_score)
                      .slice(0, 5)
                      .map((score, index) => (
                        <div
                          key={score.operator_id}
                          className="flex items-center justify-between p-2 rounded bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">{index + 1}</span>
                            <span className="text-sm">
                              {score.operator_id === currentUserId
                                ? "You"
                                : `Operator ${score.operator_id.slice(0, 8)}`}
                            </span>
                          </div>
                          <div className={`font-semibold ${getScoreColor(score.reliability_score)}`}>
                            {score.reliability_score.toFixed(1)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No score data available for this operator yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Decision History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No review history available.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        {record.decision === "APPROVE" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : record.decision === "REJECT" ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <div className="font-medium">{record.decision}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(record.decision_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {record.review_time_seconds && (
                          <span className="text-sm text-muted-foreground">
                            {record.review_time_seconds}s
                          </span>
                        )}
                        {record.outcome && (
                          <Badge
                            variant={
                              record.outcome === "CORRECT"
                                ? "default"
                                : record.outcome === "OVERTURNED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {record.outcome}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Biases Tab */}
        <TabsContent value="biases" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleDetectBiases} variant="outline">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Run Bias Detection
            </Button>
          </div>

          {biases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                No active biases detected.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {biases.map((bias) => (
                <Card key={bias.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            bias.severity === "CRITICAL"
                              ? "text-red-500"
                              : bias.severity === "HIGH"
                              ? "text-orange-500"
                              : "text-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium">
                            {getBiasTypeLabel(bias.bias_type)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Confidence: {(bias.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Detected: {new Date(bias.detected_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(bias.severity)}>
                          {bias.severity}
                        </Badge>
                        <Badge variant="outline">{bias.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleGenerateRecommendations} variant="outline">
              <Lightbulb className="w-4 h-4 mr-2" />
              Generate Recommendations
            </Button>
          </div>

          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending recommendations.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {rec.domain}: {rec.previous_level} → {rec.new_level}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.reason}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          Confidence: {(rec.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyRecommendation(rec.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OperatorInsightsDashboard;

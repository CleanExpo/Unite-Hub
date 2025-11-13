"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";

interface SWOTAnalysisProps {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export default function SWOTAnalysis({ swot }: SWOTAnalysisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Strengths */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Strengths</h3>
            <p className="text-sm text-green-700">Your competitive advantages</p>
          </div>
        </div>
        <ul className="space-y-2">
          {swot.strengths.map((strength, idx) => (
            <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Weaknesses */}
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">Weaknesses</h3>
            <p className="text-sm text-red-700">Areas to improve</p>
          </div>
        </div>
        <ul className="space-y-2">
          {swot.weaknesses.map((weakness, idx) => (
            <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
              <span className="text-red-600 mt-1">•</span>
              <span>{weakness}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Opportunities */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Opportunities</h3>
            <p className="text-sm text-blue-700">Market opportunities</p>
          </div>
        </div>
        <ul className="space-y-2">
          {swot.opportunities.map((opportunity, idx) => (
            <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{opportunity}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Threats */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-900">Threats</h3>
            <p className="text-sm text-yellow-700">Competitive threats</p>
          </div>
        </div>
        <ul className="space-y-2">
          {swot.threats.map((threat, idx) => (
            <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>{threat}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Globe,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import CompetitorCard from "./CompetitorCard";
import AddCompetitorModal from "./AddCompetitorModal";

interface Competitor {
  _id: string;
  competitorName: string;
  website: string;
  description: string;
  category: "direct" | "indirect" | "potential";
  strengths: string[];
  weaknesses: string[];
  pricing?: {
    model: string;
    range: string;
  };
  targetAudience: string[];
  marketingChannels: string[];
  logoUrl?: string;
  lastAnalyzed: number;
  createdAt: number;
}

interface CompetitorsListProps {
  clientId: string;
  competitors: Competitor[];
  onRefresh: () => void;
}

export default function CompetitorsList({
  clientId,
  competitors,
  onRefresh,
}: CompetitorsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<Competitor | null>(null);

  // Filter competitors
  const filteredCompetitors = competitors.filter((comp) => {
    const matchesSearch =
      comp.competitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter
      ? comp.category === categoryFilter
      : true;

    return matchesSearch && matchesCategory;
  });

  // Category counts
  const categoryCounts = {
    all: competitors.length,
    direct: competitors.filter((c) => c.category === "direct").length,
    indirect: competitors.filter((c) => c.category === "indirect").length,
    potential: competitors.filter((c) => c.category === "potential").length,
  };

  const handleDelete = async (competitorId: string) => {
    if (!confirm("Are you sure you want to delete this competitor?")) return;

    try {
      const response = await fetch(`/api/competitors/${competitorId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete competitor");

      onRefresh();
    } catch (error) {
      console.error("Error deleting competitor:", error);
      alert("Failed to delete competitor");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "direct":
        return "bg-red-100 text-red-800";
      case "indirect":
        return "bg-yellow-100 text-yellow-800";
      case "potential":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competitors</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and analyze your competition
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search competitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={categoryFilter === null ? "default" : "outline"}
            onClick={() => setCategoryFilter(null)}
          >
            All ({categoryCounts.all})
          </Button>
          <Button
            variant={categoryFilter === "direct" ? "default" : "outline"}
            onClick={() => setCategoryFilter("direct")}
          >
            Direct ({categoryCounts.direct})
          </Button>
          <Button
            variant={categoryFilter === "indirect" ? "default" : "outline"}
            onClick={() => setCategoryFilter("indirect")}
          >
            Indirect ({categoryCounts.indirect})
          </Button>
          <Button
            variant={categoryFilter === "potential" ? "default" : "outline"}
            onClick={() => setCategoryFilter("potential")}
          >
            Potential ({categoryCounts.potential})
          </Button>
        </div>
      </div>

      {/* Competitors Grid */}
      {filteredCompetitors.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No competitors found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || categoryFilter
              ? "Try adjusting your filters"
              : "Add your first competitor to start analyzing the competition"}
          </p>
          {!searchQuery && !categoryFilter && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitors.map((competitor) => (
            <Card
              key={competitor._id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {competitor.logoUrl ? (
                    <img
                      src={competitor.logoUrl}
                      alt={competitor.competitorName}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {competitor.competitorName}
                    </h3>
                    <Badge className={getCategoryColor(competitor.category)}>
                      {competitor.category}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedCompetitor(competitor)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(competitor.website, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(competitor._id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {competitor.description}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Globe className="w-4 h-4" />
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 truncate"
                >
                  {competitor.website}
                </a>
              </div>

              <div className="space-y-2">
                {competitor.pricing && (
                  <div className="text-sm">
                    <span className="text-gray-500">Pricing:</span>{" "}
                    <span className="font-medium">
                      {competitor.pricing.model} - {competitor.pricing.range}
                    </span>
                  </div>
                )}

                {competitor.targetAudience.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Target:</span>{" "}
                    <span className="font-medium">
                      {competitor.targetAudience.slice(0, 2).join(", ")}
                      {competitor.targetAudience.length > 2 && "..."}
                    </span>
                  </div>
                )}

                {competitor.marketingChannels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {competitor.marketingChannels.slice(0, 3).map((channel) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                    {competitor.marketingChannels.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{competitor.marketingChannels.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                Last analyzed:{" "}
                {new Date(competitor.lastAnalyzed).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Competitor Modal */}
      {showAddModal && (
        <AddCompetitorModal
          clientId={clientId}
          competitor={selectedCompetitor}
          onClose={() => {
            setShowAddModal(false);
            setSelectedCompetitor(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedCompetitor(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

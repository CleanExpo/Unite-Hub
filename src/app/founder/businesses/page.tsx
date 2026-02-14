"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Plus, Search, Grid3x3, List, RefreshCw,
  Globe, MapPin, Calendar, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Business {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
  industry: string | null;
  region: string | null;
  primary_domain: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}

type ViewMode = "grid" | "list";

export default function BusinessesPage() {
  const { session } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchBusinesses = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/founder-os/businesses?includeInactive=true", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token) fetchBusinesses();
  }, [session?.access_token, fetchBusinesses]);

  // Client-side filtering
  const filtered = businesses.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
    inactive: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10",
    archived: "text-slate-400 border-slate-600 bg-slate-500/10",
  };

  const active = businesses.filter((b) => b.status === "active").length;
  const inactive = businesses.filter((b) => b.status === "inactive").length;

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Businesses</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your business portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchBusinesses} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href="/founder/businesses/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total", value: businesses.length, icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active", value: active, icon: Building2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Inactive", value: inactive, icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "active", "inactive", "archived"].map((v) => (
            <Button
              key={v}
              variant={statusFilter === v ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(v)}
              className={statusFilter === v ? "bg-slate-700 text-white" : "text-slate-400"}
            >
              {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex border border-slate-700 rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className={`rounded-none h-9 w-9 ${viewMode === "grid" ? "bg-slate-700 text-white" : "text-slate-400"}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className={`rounded-none h-9 w-9 ${viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-400"}`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-800/30 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700">
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No businesses found</h3>
            <p className="text-sm text-slate-400 mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Register your first business to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href="/founder/businesses/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Business
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <Link key={b.id} href={`/founder/businesses/${b.id}`}>
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer h-full">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-700 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{b.display_name}</h3>
                        <p className="text-xs text-slate-500 uppercase">{b.code}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[b.status] || "text-slate-400 border-slate-600"}`}>
                      {b.status}
                    </Badge>
                  </div>

                  {b.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{b.description}</p>
                  )}

                  <div className="space-y-1.5">
                    {b.industry && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="w-3 h-3" /> {b.industry}
                      </div>
                    )}
                    {b.region && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" /> {b.region}
                      </div>
                    )}
                    {b.primary_domain && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Globe className="w-3 h-3" /> {b.primary_domain}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Updated {new Date(b.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <Link key={b.id} href={`/founder/businesses/${b.id}`}>
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white truncate">{b.display_name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-500 uppercase">{b.code}</span>
                        {b.industry && <span className="text-[11px] text-slate-500">{b.industry}</span>}
                        {b.region && <span className="text-[11px] text-slate-500">{b.region}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {b.primary_domain && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {b.primary_domain}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] ${statusColors[b.status] || "text-slate-400 border-slate-600"}`}>
                      {b.status}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      {new Date(b.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

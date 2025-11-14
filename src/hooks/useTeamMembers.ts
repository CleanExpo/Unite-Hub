"use client";

import { useState, useEffect } from "react";
import type { TeamMember } from "@/types/database";

interface UseTeamMembersReturn {
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTeamMembers(orgId: string | null): UseTeamMembersReturn {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/team?orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.statusText}`);
      }

      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch team members");
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [orgId]);

  return {
    teamMembers,
    loading,
    error,
    refresh: fetchTeamMembers,
  };
}

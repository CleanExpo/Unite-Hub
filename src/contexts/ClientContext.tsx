"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  website?: string;
  status: string;
  tags?: string[];
  notes?: string;
  ai_score?: number;
  created_at: string;
  updated_at: string;
}

interface ClientContextValue {
  currentClient: Client | null;
  currentClientId: string | null;
  clients: Client[];
  isLoading: boolean;
  error: Error | null;
  selectClient: (clientId: string) => void;
  clearClient: () => void;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function ClientProvider({
  children,
  orgId
}: {
  children: React.ReactNode;
  orgId?: string;
}) {
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch clients from Supabase
  const fetchClients = useCallback(async () => {
    if (!orgId) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setClients([]);
        setIsLoading(false);
        return;
      }

      // Fetch contacts for this workspace
      const response = await fetch(`/api/contacts?workspaceId=${orgId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data = await response.json();
      setClients(data.contacts || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch clients"));
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Load saved client from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("unite_hub_current_client_id");
    if (saved) {
      setCurrentClientId(saved);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (currentClientId) {
      localStorage.setItem("unite_hub_current_client_id", currentClientId);
    } else {
      localStorage.removeItem("unite_hub_current_client_id");
    }
  }, [currentClientId]);

  // Fetch clients when orgId changes
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Find current client from clients list
  const currentClient = clients.find(c => c.id === currentClientId) || null;

  const selectClient = (clientId: string) => {
    setCurrentClientId(clientId);
  };

  const clearClient = () => {
    setCurrentClientId(null);
  };

  const refreshClients = async () => {
    await fetchClients();
  };

  return (
    <ClientContext.Provider value={{
      currentClient,
      currentClientId,
      clients,
      isLoading,
      error,
      selectClient,
      clearClient,
      refreshClients
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClientContext must be used within ClientProvider");
  }
  return context;
}

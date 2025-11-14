"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
// Temporarily disabled Convex - using Supabase now
// import { useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
type Id<T> = string; // Temporary type alias

interface Client {
  _id: Id<"clients">;
  orgId: Id<"organizations">;
  clientName: string;
  businessName: string;
  businessDescription: string;
  packageTier: "starter" | "professional";
  status: "active" | "onboarding" | "inactive";
  primaryEmail: string;
  websiteUrl?: string;
  portalUrl: string;
  phoneNumbers: string[];
  createdAt: number;
  updatedAt: number;
}

interface ClientContextValue {
  currentClient: Client | null;
  currentClientId: Id<"clients"> | null;
  clients: Client[];
  isLoading: boolean;
  error: Error | null;
  selectClient: (clientId: Id<"clients">) => void;
  clearClient: () => void;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function ClientProvider({
  children,
  orgId
}: {
  children: React.ReactNode;
  orgId?: Id<"organizations">;
}) {
  const [currentClientId, setCurrentClientId] = useState<Id<"clients"> | null>(null);

  // Load saved client from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("unite_hub_current_client_id");
    if (saved) {
      setCurrentClientId(saved as Id<"clients">);
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

  // Temporarily return empty data - Convex disabled
  const clients: Client[] = [];
  const currentClient: Client | null = null;

  const selectClient = (clientId: Id<"clients">) => {
    setCurrentClientId(clientId);
  };

  const clearClient = () => {
    setCurrentClientId(null);
  };

  const isLoading = !currentClient && !!currentClientId;

  return (
    <ClientContext.Provider value={{
      currentClient,
      currentClientId,
      clients,
      isLoading,
      error: null,
      selectClient,
      clearClient
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

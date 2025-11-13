"use client";

import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import CreateClientModal from "./CreateClientModal";

export default function ClientSelector() {
  const { currentClient, clients, selectClient, currentClientId } = useClientContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentClientId || undefined}
          onValueChange={(value) => selectClient(value as any)}
        >
          <SelectTrigger className="w-[240px] bg-slate-800 border-slate-700 text-white">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <SelectValue placeholder="Select client">
                {currentClient ? currentClient.businessName : "Select client"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {clients.map((client) => (
              <SelectItem
                key={client._id}
                value={client._id}
                className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700"
              >
                {client.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateModalOpen(true)}
          className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
          title="Add new client"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CreateClientModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}

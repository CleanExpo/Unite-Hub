"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  workspaceId: string;
  onContactDeleted?: () => void;
}

export function DeleteContactModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  workspaceId,
  onContactDeleted,
}: DeleteContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Delete contact from database
      const { error: deleteError } = await supabaseBrowser
        .from("contacts")
        .delete()
        .eq("id", contactId)
        .eq("workspace_id", workspaceId); // Additional security check

      if (deleteError) {
        console.error("Error deleting contact:", deleteError);
        setError(deleteError.message);
        setLoading(false);
        return;
      }

      // Success! Close modal and notify parent
      setLoading(false);

      if (onContactDeleted) {
        onContactDeleted();
      }

      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-white">
              Delete Contact
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-400 text-base">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{contactName}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Warning</p>
              <p className="text-yellow-400/80 text-sm mt-1">
                This will permanently delete:
              </p>
              <ul className="text-yellow-400/80 text-sm mt-2 space-y-1 list-disc list-inside">
                <li>Contact information and profile</li>
                <li>All email history with this contact</li>
                <li>Campaign enrollments</li>
                <li>Interaction records</li>
                <li>AI scoring data</li>
              </ul>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            disabled={loading}
            className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            {loading ? "Deleting..." : "Delete Contact"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

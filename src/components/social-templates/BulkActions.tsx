"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, Star, Trash2, CheckSquare, Loader2 } from "lucide-react";
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

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkFavorite: (favorite: boolean) => Promise<void>;
  onExport: (format: "json" | "csv") => Promise<void>;
}

export function BulkActions({
  selectedIds,
  onClearSelection,
  onBulkDelete,
  onBulkFavorite,
  onExport,
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      onClearSelection();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await handleAction(onBulkDelete);
    setShowDeleteDialog(false);
  };

  if (selectedIds.length === 0) {
return null;
}

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <CheckSquare className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {selectedIds.length} template{selectedIds.length !== 1 ? "s" : ""}{" "}
          selected
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onBulkFavorite(true))}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Favorite
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAction(() => onExport("json"))}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => onExport("csv"))}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} templates?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected templates will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

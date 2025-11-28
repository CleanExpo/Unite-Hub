"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Key,
  CreditCard,
  FileText,
  Database,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  Loader2,
  Clock,
} from "lucide-react";

interface VaultSecretItemProps {
  id: string;
  name: string;
  type: "api_key" | "password" | "token" | "credential";
  lastAccessed?: Date;
  createdAt: Date;
  tags?: string[];
  onReveal?: (id: string) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  className?: string;
}

export function VaultSecretItem({
  id,
  name,
  type,
  lastAccessed,
  createdAt,
  tags = [],
  onReveal,
  onDelete,
  className = "",
}: VaultSecretItemProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "api_key":
        return Key;
      case "password":
        return Database;
      case "token":
        return FileText;
      case "credential":
        return CreditCard;
      default:
        return Key;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "api_key":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "password":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "token":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "credential":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleReveal = async () => {
    if (!onReveal) return;

    setError(null);
    setIsRevealing(true);

    try {
      const value = await onReveal(id);
      setRevealedValue(value);
      setIsRevealed(true);

      // Auto-hide after 30 seconds for security
      setTimeout(() => {
        setIsRevealed(false);
        setRevealedValue("");
      }, 30000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal secret");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleHide = () => {
    setIsRevealed(false);
    setRevealedValue("");
    setIsCopied(false);
  };

  const handleCopy = async () => {
    if (!revealedValue) return;

    try {
      await navigator.clipboard.writeText(revealedValue);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setError(null);
    setIsDeleting(true);

    try {
      await onDelete(id);
      setShowDeleteDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete secret");
    } finally {
      setIsDeleting(false);
    }
  };

  const TypeIcon = getTypeIcon(type);

  return (
    <>
      <Card className={`hover:shadow-md transition-all duration-200 ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <TypeIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className={getTypeColor(type)}>
                      {type.replace("_", " ")}
                    </Badge>
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Revealed Value */}
            {isRevealed && revealedValue && (
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono break-all">{revealedValue}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Will auto-hide in 30 seconds for security
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-xs rounded-lg p-2">
                {error}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created {formatDate(createdAt)}
              </div>
              {lastAccessed && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Accessed {formatDate(lastAccessed)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isRevealed ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleHide}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleReveal}
                  disabled={isRevealing || !onReveal}
                >
                  {isRevealing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Revealing...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Secret?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone
              and the secret will be permanently removed from the vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Secret"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

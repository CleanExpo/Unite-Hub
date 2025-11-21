"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ApprovalModal({
  content,
  isOpen,
  onClose,
  onApprove,
}: {
  content: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (contentId: string) => void;
}) {
  const [editedText, setEditedText] = useState(content?.generatedText || "");
  const [isEditing, setIsEditing] = useState(false);

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Review Content</DialogTitle>
          <DialogDescription>Review and approve before sending</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="bg-slate-700 rounded p-6 border border-slate-600 min-h-96">
              <div className="prose prose-invert max-w-none">
                <p className="text-white whitespace-pre-wrap font-serif text-base leading-relaxed">
                  {editedText}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded p-4 border border-slate-600">
                <Label className="text-slate-400 text-xs">Content Type</Label>
                <p className="text-white font-semibold mt-2">{content.contentType}</p>
              </div>
              <div className="bg-slate-700 rounded p-4 border border-slate-600">
                <Label className="text-slate-400 text-xs">AI Model</Label>
                <p className="text-white font-semibold mt-2">{content.aiModel}</p>
              </div>
              <div className="bg-slate-700 rounded p-4 border border-slate-600">
                <Label className="text-slate-400 text-xs">Status</Label>
                <Badge className="mt-2 bg-amber-600">{content.status}</Badge>
              </div>
              <div className="bg-slate-700 rounded p-4 border border-slate-600">
                <Label className="text-slate-400 text-xs">Created</Label>
                <p className="text-white font-semibold mt-2 text-sm">
                  {new Date(content.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <Label className="text-slate-400 text-xs">Original Prompt</Label>
              <p className="text-slate-300 text-sm mt-2">{content.originalPrompt}</p>
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">
                Edit Content
              </Label>
              <Textarea
                id="content"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-64 bg-slate-700 border-slate-600 text-white"
                placeholder="Edit your content here..."
              />
              <p className="text-xs text-slate-400">
                {editedText.length} characters
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Reject
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isEditing ? "Done Editing" : "Edit"}
          </Button>
          <Button
            onClick={() => {
              onApprove(content._id);
              onClose();
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            ✅ Approve & Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";

interface RecordOutcomeFormProps {
  decisionId: string;
  options: string[];
}

export function RecordOutcomeForm({ decisionId, options }: RecordOutcomeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [outcome, setOutcome] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption || !outcome) {
      toast({
        title: "Missing Information",
        description: "Please select an option and describe the outcome.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/founder/memory/decisions/${decisionId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chosenOption: selectedOption,
          outcome,
          lessonsLearned: lessonsLearned || undefined,
          success,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record outcome");
      }

      toast({
        title: "Outcome Recorded",
        description: "Your decision outcome has been saved.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error recording outcome:", error);
      toast({
        title: "Error",
        description: "Failed to record outcome. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Option Selection */}
      <div className="space-y-2">
        <Label htmlFor="selectedOption">Which option did you choose?</Label>
        <Select value={selectedOption} onValueChange={setSelectedOption}>
          <SelectTrigger>
            <SelectValue placeholder="Select the option you chose" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Success/Failure Toggle */}
      <div className="space-y-2">
        <Label>Was the outcome successful?</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={success === true ? "default" : "outline"}
            size="sm"
            onClick={() => setSuccess(true)}
            className={success === true ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Yes
          </Button>
          <Button
            type="button"
            variant={success === false ? "default" : "outline"}
            size="sm"
            onClick={() => setSuccess(false)}
            className={success === false ? "bg-red-600 hover:bg-red-700" : ""}
          >
            No
          </Button>
          <Button
            type="button"
            variant={success === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setSuccess(undefined)}
          >
            Not Sure Yet
          </Button>
        </div>
      </div>

      {/* Outcome Description */}
      <div className="space-y-2">
        <Label htmlFor="outcome">Describe the outcome</Label>
        <Textarea
          id="outcome"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="What happened after you made this decision? What were the results?"
          rows={4}
          required
        />
      </div>

      {/* Lessons Learned */}
      <div className="space-y-2">
        <Label htmlFor="lessonsLearned">Lessons learned (optional)</Label>
        <Textarea
          id="lessonsLearned"
          value={lessonsLearned}
          onChange={(e) => setLessonsLearned(e.target.value)}
          placeholder="What would you do differently? What insights did you gain?"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Record Outcome"
        )}
      </Button>
    </form>
  );
}

export default RecordOutcomeForm;

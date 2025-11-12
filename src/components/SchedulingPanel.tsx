"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function SchedulingPanel({
  drafts,
  onSchedule,
}: {
  drafts: any[];
  onSchedule: (config: any) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState("immediate");
  const [sendTime, setSendTime] = useState("09:00");
  const [frequency, setFrequency] = useState("once");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(drafts.map((d) => d._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter((s) => s !== id));
    }
  };

  const handleSchedule = () => {
    onSchedule({
      contentIds: selected,
      scheduleType,
      sendTime,
      frequency,
    });
  };

  return (
    <div className="space-y-6">
      {/* Content Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Select Content to Send</CardTitle>
          <CardDescription>Choose which drafts to schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-600">
            <Checkbox
              id="select-all"
              checked={selected.length === drafts.length && drafts.length > 0}
              onCheckedChange={handleSelectAll}
              className="border-slate-600"
            />
            <Label htmlFor="select-all" className="text-white cursor-pointer">
              Select All ({selected.length}/{drafts.length})
            </Label>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {drafts.map((draft) => (
              <div
                key={draft._id}
                className="flex items-start space-x-3 p-3 bg-slate-700 rounded border border-slate-600 hover:border-blue-500 transition"
              >
                <Checkbox
                  id={draft._id}
                  checked={selected.includes(draft._id)}
                  onCheckedChange={(checked) => handleSelect(draft._id, checked as boolean)}
                  className="border-slate-600 mt-1"
                />
                <Label htmlFor={draft._id} className="flex-1 cursor-pointer">
                  <div className="font-semibold text-white">{draft.title}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {draft.generatedText}
                  </div>
                  <Badge className="mt-2 bg-purple-600">{draft.contentType}</Badge>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Options */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Schedule Settings</CardTitle>
          <CardDescription>Configure when and how to send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Type */}
          <div className="space-y-3">
            <Label className="text-white font-semibold">Send Schedule</Label>
            <RadioGroup value={scheduleType} onValueChange={setScheduleType}>
              <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded border border-slate-600 hover:border-blue-500 cursor-pointer transition">
                <RadioGroupItem value="immediate" id="immediate" className="border-slate-400" />
                <Label htmlFor="immediate" className="text-white cursor-pointer flex-1">
                  Send Immediately
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded border border-slate-600 hover:border-blue-500 cursor-pointer transition">
                <RadioGroupItem value="scheduled" id="scheduled" className="border-slate-400" />
                <Label htmlFor="scheduled" className="text-white cursor-pointer flex-1">
                  Schedule for Later
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded border border-slate-600 hover:border-blue-500 cursor-pointer transition">
                <RadioGroupItem value="sequence" id="sequence" className="border-slate-400" />
                <Label htmlFor="sequence" className="text-white cursor-pointer flex-1">
                  Drip Campaign (Sequence)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Send Time */}
          {(scheduleType === "scheduled" || scheduleType === "sequence") && (
            <div className="space-y-3">
              <Label htmlFor="send-time" className="text-white font-semibold">
                Send Time
              </Label>
              <input
                id="send-time"
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
              <p className="text-xs text-slate-400">
                Emails will be sent at {sendTime} in your timezone
              </p>
            </div>
          )}

          {/* Frequency */}
          {scheduleType === "sequence" && (
            <div className="space-y-3">
              <Label htmlFor="frequency" className="text-white font-semibold">
                Frequency
              </Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="every-2-days">Every 2 Days</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Emails will be sent {frequency} to each contact
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded p-4">
            <p className="text-sm text-white">
              <span className="font-semibold">📊 Summary:</span> You're about to send{" "}
              <span className="font-bold text-blue-400">{selected.length}</span> email(s) to{" "}
              <span className="font-bold text-blue-400">5 prospects</span> (
              {scheduleType === "immediate"
                ? "immediately"
                : `${scheduleType} at ${sendTime}`}
              )
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSchedule}
          disabled={selected.length === 0}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✅ Schedule {selected.length} Email{selected.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}

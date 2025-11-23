/**
 * Voice Navigation Button Component
 * Phase 44: Voice-First Navigation Layer
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  recognizeIntent,
  getCommandSuggestions,
  type UserRole,
} from "@/lib/services/voiceNavigationService";

interface VoiceNavButtonProps {
  userRole: UserRole;
  onResult?: (result: { success: boolean; message: string }) => void;
}

export function VoiceNavButton({ userRole, onResult }: VoiceNavButtonProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-AU";
      setRecognition(recognitionInstance);
    }
  }, []);

  const handleVoiceCommand = useCallback(
    async (transcript: string) => {
      setIsProcessing(true);
      const startTime = Date.now();

      try {
        const result = recognizeIntent(transcript, userRole);
        const processingTime = Date.now() - startTime;

        // Log event to API
        await fetch("/api/voice/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandText: transcript,
            result,
            processingTimeMs: processingTime,
            userRole,
          }),
        });

        if (result.success && result.route) {
          if (result.route === "BACK") {
            router.back();
            onResult?.({ success: true, message: "Going back" });
          } else if (result.route === "REFRESH") {
            router.refresh();
            onResult?.({ success: true, message: "Refreshing page" });
          } else {
            router.push(result.route);
            onResult?.({ success: true, message: `Navigating to ${result.intent}` });
          }
        } else {
          onResult?.({
            success: false,
            message: result.error || "Command not recognized",
          });
        }
      } catch (error) {
        console.error("Voice command error:", error);
        onResult?.({ success: false, message: "Failed to process command" });
      } finally {
        setIsProcessing(false);
      }
    },
    [userRole, router, onResult]
  );

  const startListening = useCallback(() => {
    if (!recognition) {
      onResult?.({ success: false, message: "Speech recognition not supported" });
      return;
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      onResult?.({ success: false, message: `Error: ${event.error}` });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [recognition, handleVoiceCommand, onResult]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const suggestions = getCommandSuggestions(userRole);

  if (!recognition) {
    return null; // Hide button if not supported
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        onMouseEnter={() => setShowHints(true)}
        onMouseLeave={() => setShowHints(false)}
        disabled={isProcessing}
        className={`
          p-3 rounded-full transition-all
          ${isListening
            ? "bg-red-500 text-white animate-pulse"
            : isProcessing
            ? "bg-gray-300 text-gray-500"
            : "bg-teal-500 text-white hover:bg-teal-600"
          }
        `}
        aria-label={isListening ? "Stop listening" : "Start voice navigation"}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Hints dropdown */}
      {showHints && !isListening && !isProcessing && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <p className="text-xs font-medium text-gray-500 mb-2">Try saying:</p>
          <ul className="space-y-1">
            {suggestions.slice(0, 5).map((suggestion, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
          Listening...
        </div>
      )}
    </div>
  );
}

// Add type declaration for webkit speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default VoiceNavButton;

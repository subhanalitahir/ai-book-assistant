"use client";

import { Messages } from "@/types";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import { useRef, useEffect } from "react";

interface TranscriptProps {
  messages: Messages[];
  currentMessage?: string;
  currentUserMessage?: string;
}

export default function Transcript({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty =
    messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-96 gap-4">
        <Mic className="w-16 h-16 text-[#212a3b] opacity-40" />
        <p className="text-2xl font-bold text-[#212a3b]">No conversation yet</p>
        <p className="text-sm text-[#3d485e]">
          Start talking to begin your conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {messages.map((msg, index) => {
        const isAssistant = msg.role.toLowerCase() === "assistant";

        return (
          <div
            key={`${msg.role}-${index}-${msg.content}`}
            className={cn(
              "flex",
              isAssistant ? "justify-start" : "justify-end",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] px-4 py-3 rounded-lg",
                isAssistant
                  ? "bg-[#f3e4c7] text-[#212a3b] rounded-bl-none"
                  : "bg-[#663820] text-white rounded-br-none",
              )}
            >
              <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
                {msg.content}
              </p>
            </div>
          </div>
        );
      })}

      {currentUserMessage && (
        <div className="flex justify-end">
          <div className="max-w-[80%] px-4 py-3 rounded-lg bg-[#663820] text-white rounded-br-none">
            <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
              {currentUserMessage}
              <span className="animate-blink">|</span>
            </p>
          </div>
        </div>
      )}

      {currentMessage && (
        <div className="flex justify-start">
          <div className="max-w-[80%] px-4 py-3 rounded-lg bg-[#f3e4c7] text-[#212a3b] rounded-bl-none">
            <p className="text-sm md:text-base whitespace-pre-wrap wrap-break-word">
              {currentMessage}
              <span className="animate-blink">|</span>
            </p>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}

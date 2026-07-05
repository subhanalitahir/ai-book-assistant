"use client";
import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff, AlertCircle, Loader } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { formatDuration } from "@/lib/utils";

const VapiControls = ({ book }: { book: IBook }) => {
  const {
    status,
    isActive,
    message,
    currentMessage,
    currentUserMessages,
    duration,
    limitError,
    start,
    stop,
    clearErrors,
  } = useVapi(book);

  const displayedDuration = useMemo(() => formatDuration(duration), [duration]);

  const isAiActive =
    isActive && (status === "speaking" || status === "thinking");
  const isLoading = status === "connecting" || status === "starting";
  const hasError = status === "error" || limitError !== null;

  const getStatusBadgeColor = () => {
    switch (status) {
      case "listening":
        return "bg-green-100 text-green-800";
      case "speaking":
        return "bg-blue-100 text-blue-800";
      case "thinking":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "idle":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "listening":
        return "Listening...";
      case "speaking":
        return "Speaking...";
      case "thinking":
        return "Thinking...";
      case "starting":
        return "Starting...";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <>
      {/* Header Card */}
      <div className="vapi-header-card mb-8 w-full">
        {/* Book Cover with Mic Button */}
        <div className="vapi-cover-wrapper">
          <Image
            src={book.coverURL || "/assets/default-book-cover.png"}
            alt={`${book.title} cover`}
            width={120}
            height={180}
            className="vapi-cover-image"
            priority
          />
          {/* Overlapping Mic Button */}
          <div className="vapi-mic-wrapper relative">
            {isAiActive && <span className="vapi-mic-pulse-ring animate-pin" />}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-[#212a3b]" />
              </div>
            )}
            <button
              className="vapi-mic-btn disabled:opacity-60"
              aria-label={isActive ? "Stop voice chat" : "Start voice chat"}
              type="button"
              onClick={isActive ? stop : start}
              disabled={isLoading}
            >
              {isActive ? (
                <Mic className="w-6 h-6 text-[#212a3b]" />
              ) : (
                <MicOff className="w-6 h-6 text-[#212a3b]" />
              )}
            </button>
          </div>
        </div>

        {/* Book Info Section */}
        <div className="flex-1">
          {/* Title and Author */}
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#212a3b] mb-2">
            {book.title}
          </h1>
          <p className="text-base md:text-lg text-[#3d485e] mb-4">
            by {book.author}
          </p>

          {/* Status Badges Row */}
          <div className="flex flex-wrap gap-3">
            {/* Status Badge */}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor()}`}
            >
              {getStatusLabel()}
            </div>

            {/* Voice Badge */}
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              Voice: {book.persona || "Default"}
            </div>

            {/* Timer Badge */}
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
              {displayedDuration}/15:00
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && limitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{limitError}</p>
            <button
              onClick={clearErrors}
              className="text-red-600 hover:text-red-800 text-sm mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Transcript Area */}
      <div className="transcript-container w-full min-h-150 bg-slate-50 rounded-lg p-4 border border-slate-200">
        {currentUserMessages.length === 0 && !message && !currentMessage ? (
          <div className="transcript-empty text-center py-12">
            <Mic className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="transcript-empty-text text-slate-600 font-medium">
              No conversation yet
            </p>
            <p className="transcript-empty-hint text-slate-500">
              Click the mic button above to start talking
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Current user message being spoken */}
            {currentMessage && (
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                  <p className="text-sm italic text-blue-100">You:</p>
                  <p className="text-sm">{currentMessage}</p>
                </div>
              </div>
            )}

            {/* Assistant response */}
            {message && (
              <div className="flex justify-start">
                <div className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg max-w-xs">
                  <p className="text-sm font-medium text-slate-700">
                    Assistant:
                  </p>
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            )}

            {/* Previous messages */}
            {currentUserMessages.map((msg, idx) => (
              <div key={idx} className="flex justify-end">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                  <p className="text-sm">{msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Indicator Bar */}
      <div className="mt-4 text-center">
        {isLoading && (
          <p className="text-sm text-slate-600">
            {status === "connecting" && "Connecting to Vapi..."}
            {status === "starting" && "Starting conversation..."}
          </p>
        )}
        {isActive && status === "listening" && (
          <p className="text-sm text-green-600 font-medium">
            🎤 Listening... speak now
          </p>
        )}
        {isActive && status === "thinking" && (
          <p className="text-sm text-yellow-600 font-medium">
            ⏳ Processing your message...
          </p>
        )}
        {isActive && status === "speaking" && (
          <p className="text-sm text-blue-600 font-medium">
            🔊 Assistant is speaking...
          </p>
        )}
      </div>
    </>
  );
};

export default VapiControls;

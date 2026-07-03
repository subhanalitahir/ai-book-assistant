"use client";
import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";
const VapiControls = ({ book }: { book: IBook }) => {
  const {
    status,
    isActive,
    message,
    currentMessage,
    currentUserMessages,
    duration,
    start,
    stop,
    clearErrors,
  } = useVapi(book);
  const isAiActive = isActive && (status === "speaking" || status === "thinking");
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
            <button
              className="vapi-mic-btn"
              aria-label="Start voice chat"
              type="button"
              onClick={isActive ? stop : start}
              disabled={status === "connecting" || status === "starting"}
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
            <div className="vapi-status-indicator">
              <span className="vapi-status-dot vapi-status-dot-ready"></span>
              <span className="vapi-status-text">Ready</span>
            </div>

            {/* Voice Badge */}
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">
                Voice: {book.persona || "Default"}
              </span>
            </div>

            {/* Timer Badge */}
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">0:00/15:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Area */}
      <div className="transcript-container w-full min-h-150">
        <div className="transcript-empty">
          <Mic className="w-12 h-12 text-[#3d485e] mx-auto mb-4" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </div>
    </>
  );
};

export default VapiControls;

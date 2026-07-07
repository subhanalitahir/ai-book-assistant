import {
  startVoiceSession,
  endVoiceSession,
} from "@/lib/actions/session.actions";
import { DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/utils";

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

const useLatestRef = <T,>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

type TranscriptType = "partial" | "final";
type TranscriptRole = Messages["role"];

type VapiMessageEvent = {
  type?: string;
  role?: string;
  transcriptType?: string;
  transcript?: string;
  transcription?: string;
  message?: string;
  content?: string;
  text?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getMessageContent = (event: VapiMessageEvent) => {
  const candidates = [
    event.transcript,
    event.transcription,
    event.message,
    event.content,
    event.text,
  ];

  const content = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0,
  );

  return content?.trim() ?? "";
};

const getTranscriptType = (event: VapiMessageEvent): TranscriptType | null => {
  if (event.transcriptType === "partial" || event.transcriptType === "final") {
    return event.transcriptType;
  }

  if (
    event.type === "user-transcription" ||
    event.type === "assistant-message"
  ) {
    return "final";
  }

  return null;
};

const getTranscriptRole = (event: VapiMessageEvent): TranscriptRole | null => {
  if (event.role === "user" || event.role === "assistant") {
    return event.role;
  }

  if (event.type === "user-transcription") {
    return "user";
  }

  if (event.type === "assistant-message") {
    return "assistant";
  }

  return null;
};

/**
 * Factory to create isolated Vapi instances per hook.
 * Prevents conflicts between concurrent sessions.
 */
function createVapiInstance(): InstanceType<typeof Vapi> {
  const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_KEY;
  if (!VAPI_API_KEY) {
    throw new Error("VAPI_API_KEY is not defined");
  }
  return new Vapi(VAPI_API_KEY);
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();
  const resolvedUserId = userId || "guest-local";

  // State management
  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentUserMessage, setCurrentUserMessage] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Refs for lifecycle management
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
  const timeRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const listenerCleanupRef = useRef<(() => void)[]>([]);

  // Keep latest values for event handlers
  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);

  const voice = book.persona || DEFAULT_VOICE;
  const isActive =
    status === "listening" ||
    status === "speaking" ||
    status === "thinking" ||
    status === "starting";
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID || "";
  const memoizedAssistantId = ASSISTANT_ID;

  const appendFinalMessage = useCallback(
    (role: TranscriptRole, content: string) => {
      const nextContent = content.trim();

      if (!nextContent) {
        return;
      }

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];

        if (
          lastMessage &&
          lastMessage.role === role &&
          lastMessage.content === nextContent
        ) {
          return prev;
        }

        return [...prev, { role, content: nextContent }];
      });
    },
    [],
  );

  /**
   * Register an event listener and track it for cleanup
   */
  const registerListener = useCallback(
    (
      vapi: InstanceType<typeof Vapi>,
      event: string,
      handler: (data?: Record<string, unknown> | undefined) => void,
    ) => {
      (
        vapi.on as (
          event: string,
          handler: (data?: Record<string, unknown>) => void,
        ) => void
      )(event, handler);
      listenerCleanupRef.current.push(() => {
        (
          vapi.off as (
            event: string,
            handler: (data?: Record<string, unknown>) => void,
          ) => void
        )(event, handler);
      });
    },
    [],
  );

  /**
   * Stop the timer and clear the interval
   */
  const stopTimer = useCallback(() => {
    if (timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = null;
    }
  }, []);

  const clearStartTimeout = useCallback(() => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start the duration timer
   */
  const startTimer = useCallback(() => {
    stopTimer();
    timeRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  /**
   * End the voice session and save to database
   */
  const finishSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    stopTimer();
    try {
      await endVoiceSession(sessionIdRef.current, durationRef.current);
    } catch (e) {
      console.error("Error ending voice session:", e);
    }
    sessionIdRef.current = null;
  }, [stopTimer, durationRef]);

  /**
   * Cleanup all Vapi listeners and resources
   */
  const cleanupVapi = useCallback(() => {
    // Remove all registered listeners
    listenerCleanupRef.current.forEach((cleanup) => cleanup());
    listenerCleanupRef.current = [];

    // Stop the conversation
    if (vapiRef.current) {
      try {
        vapiRef.current.stop().catch(() => {
          // Already stopped or error, ignore
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    stopTimer();
    setStatus("idle");
    setDuration(0);
  }, [stopTimer]);

  /**
   * Setup Vapi event listeners
   */
  const setupVapiListeners = useCallback(
    (vapi: InstanceType<typeof Vapi>) => {
      // Clear any previous listeners
      listenerCleanupRef.current.forEach((cleanup) => cleanup());
      listenerCleanupRef.current = [];

      // Message event: user speech recognized
      registerListener(vapi, "message", (messageData) => {
        if (!isRecord(messageData)) return;

        const event = messageData as VapiMessageEvent;
        const role = getTranscriptRole(event);
        const transcriptType = getTranscriptType(event);
        const content = getMessageContent(event);

        if (!role || !transcriptType || !content) {
          return;
        }

        if (role === "user" && transcriptType === "partial") {
          setCurrentUserMessage(content);
          return;
        }

        if (role === "assistant" && transcriptType === "partial") {
          setCurrentMessage(content);
          return;
        }

        if (role === "user" && transcriptType === "final") {
          setCurrentUserMessage("");
          setStatus("thinking");
          appendFinalMessage(role, content);
          return;
        }

        if (role === "assistant" && transcriptType === "final") {
          setCurrentMessage("");
          setStatus("listening");
          appendFinalMessage(role, content);
        }
      });

      // Speech started by user
      registerListener(vapi, "speech-start", () => {
        setStatus("listening");
      });

      // Speech ended, now processing
      registerListener(vapi, "speech-end", () => {
        setStatus("thinking");
      });

      // Assistant is speaking
      registerListener(vapi, "assistant-start", () => {
        setStatus("speaking");
      });

      // Assistant finished speaking
      registerListener(vapi, "assistant-end", () => {
        setStatus("listening");
      });

      // Call ended (either by user or timeout)
      registerListener(vapi, "call-end", () => {
        clearStartTimeout();
        finishSession();
        setStatus("idle");
      });

      // Error occurred
      registerListener(vapi, "error", (errorData) => {
        clearStartTimeout();
        console.error("Vapi Error:", errorData);
        const errorObj = errorData as Record<string, unknown>;
        const errorMessage = String(
          errorObj?.message || "An error occurred during the conversation",
        );

        // Parse specific error types for better UX
        if (errorMessage.includes("Microphone")) {
          setLimitError(
            "Microphone access was denied. Please check your browser permissions.",
          );
        } else if (errorMessage.includes("Network")) {
          setLimitError(
            "Network connection failed. Please check your internet.",
          );
        } else if (errorMessage.includes("Auth")) {
          setLimitError("Authentication failed. Please refresh and try again.");
        } else {
          setLimitError(errorMessage);
        }

        setStatus("error");
        stopTimer();
      });

      // Call started successfully
      registerListener(vapi, "call-start", () => {
        clearStartTimeout();
        setStatus("listening");
        startTimer();
      });
    },
    [registerListener, finishSession, stopTimer, startTimer, clearStartTimeout],
  );

  /**
   * Start a new voice session
   */
  const start = useCallback(async () => {
    // Prevent multiple starts
    if (status !== "idle") return;

    if (!resolvedUserId) {
      setLimitError(
        "Unable to initialize a conversation identity. Please refresh and try again.",
      );
      return;
    }

    if (!bookRef.current._id) {
      setLimitError("Book context is missing. Please open a valid book page.");
      return;
    }

    setLimitError(null);
    setStatus("connecting");
    setDuration(0);
    setMessages([]);
    setCurrentMessage("");
    setCurrentUserMessage("");

    try {
      // Create isolated Vapi instance for this session
      const vapiInstance = createVapiInstance();
      vapiRef.current = vapiInstance;

      // Setup listeners before starting
      setupVapiListeners(vapiInstance);

      // Best-effort server-side session persistence. The AI conversation should still start
      // even if this database write fails.
      try {
        const result = await startVoiceSession(
          resolvedUserId,
          bookRef.current._id,
        );
        if (result.success) {
          sessionIdRef.current = result.sessionId;
        } else {
          setLimitError(
            result.error ||
              "Unable to initialize a conversation session. Please try again.",
          );
        }
      } catch (error) {
        console.error("Error creating voice session record:", error);
      }

      const firstMessage = `Hey, good to meet you. Quick question, before we dive in, have you actually read ${bookRef.current.title} yet?`;

      // Start the Vapi conversation
      setStatus("starting");
      clearStartTimeout();
      startTimeoutRef.current = setTimeout(() => {
        setLimitError(
          "Voice connection timed out. Please check your mic/network and try again.",
        );
        setStatus("idle");
        cleanupVapi();
      }, 15000);

      await vapiInstance.start(memoizedAssistantId, {
        firstMessage,
        variableValues: {
          title: bookRef.current.title,
          author: bookRef.current.author,
          bookId: bookRef.current._id,
        },
        voice: {
          provider: "11labs",
          voiceId: getVoice(voice).id,
          model: "eleven_turbo_v2" as const,
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      });
    } catch (error) {
      clearStartTimeout();
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Error starting VAPI session:", err);

      // Provide specific error messages
      if (err.message?.includes("Microphone")) {
        setLimitError(
          "Microphone access was denied. Please enable microphone access in your browser settings.",
        );
      } else if (err.message?.includes("Permission")) {
        setLimitError(
          "Permission denied. Please allow microphone access when prompted.",
        );
      } else {
        setLimitError("Failed to start session. Please try again.");
      }

      setStatus("idle");
      cleanupVapi();
    }
  }, [
    status,
    resolvedUserId,
    bookRef,
    setupVapiListeners,
    cleanupVapi,
    voice,
    memoizedAssistantId,
    clearStartTimeout,
  ]);

  /**
   * Stop the current voice session
   */
  const stop = useCallback(async () => {
    if (isStoppingRef.current) return;

    isStoppingRef.current = true;
    try {
      if (vapiRef.current) {
        await vapiRef.current.stop();
      }
      await finishSession();
      cleanupVapi();
    } catch (error) {
      console.error("Error stopping VAPI session:", error);
    } finally {
      isStoppingRef.current = false;
    }
  }, [finishSession, cleanupVapi]);

  /**
   * Clear error messages
   */
  const clearErrors = useCallback(() => {
    setLimitError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearStartTimeout();
      cleanupVapi();
      isStoppingRef.current = false;
    };
  }, [cleanupVapi, clearStartTimeout]);

  return {
    status,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    limitError,
    isActive,
    start,
    stop,
    clearErrors,
  };
};

export default useVapi;

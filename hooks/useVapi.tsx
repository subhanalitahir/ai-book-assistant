import { startVoiceSession } from "@/lib/actions/session.actions";
import { DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/utils";
export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";
const useLatestRef = <T,>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

let vapi: InstanceType<typeof Vapi> | null = null;
const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_KEY;
function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI_API_KEY is not defined");
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();
  // TODO: Implement limits
  const [status, setStatus] = useState<CallStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentUserMessages, setCurrentUserMessages] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timeRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);
  const voice = book.persona || DEFAULT_VOICE;
  const isActive =
    status === "listening" ||
    status === "speaking" ||
    status === "thinking" ||
    status === "starting";
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID || "";

  // Limits
  //   const maxDurationRef = useLatestRef(limits.maxSessionMinutes*60);
  // const maxDuratoinSeconds
  // const remainingSeconds
  // const slowTimeWarning

  const start = async () => {
    if (!userId) return setLimitError("Please login to start a conversation.");

    setLimitError(null);
    setStatus("connecting");
    try {
      const result = await startVoiceSession(userId, bookRef.current._id);
      if (!result.success) {
        setStatus("idle");
        setLimitError(result.error);
        return;
      }
      sessionIdRef.current = result.sessionId;
      const firstMessage = `Hey, good to meet you. Quick question, before we dive in, have you actually read ${book.title}? yet? Or are we starting fresh?`;

      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
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
    } catch (e) {
      console.error("Error starting VAPI session:", e);
      setStatus("idle");
      setLimitError("Failed to start session. Please try again.");
    }
  };
  const stop = async () => {
    isStoppingRef.current = true;
    await getVapi().stop();
    isStoppingRef.current = false;
  };
  const clearErrors = async () => {};
  return {
    status,
    message,
    currentMessage,
    currentUserMessages,
    duration,
    limitError,
    isActive,
    start,
    stop,
    clearErrors,
  };
};

export default useVapi;

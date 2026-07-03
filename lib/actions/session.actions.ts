"use server";
import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voiceSession.model";
import { getCurrentBillingPeriodStart } from "../subscription-constants";

type StartSessionResult =
  | { success: true; sessionId: string }
  | { success: false; error: string };

type EndSessionResult = { success: true } | { success: false; error: string };

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    await connectToDatabase();
    // limits to see whether a session is allowed or not
    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      //maxDurationMinutes
    };
  } catch (e) {
    console.error("Error starting voice session:", e);
    return { success: false, error: "Failed to start voice session." };
  }
};

export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number,
): Promise<EndSessionResult> => {
  try {
    await connectToDatabase();
    const result = await VoiceSession.findByIdAndUpdate(
      sessionId,
      {
        endedAt: new Date(),
        durationSeconds,
      },
      { new: true },
    );

    if (!result) {
      return { success: false, error: "Voice session not found." };
    }
    return { success: true };
  } catch (e) {
    console.error("Error ending voice session:", e);
    return { success: false, error: "Failed to end voice session." };
  }
};

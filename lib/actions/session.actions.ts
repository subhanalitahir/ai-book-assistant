"use server";
import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voiceSession.model";
import {
  getCurrentBillingPeriodRange,
  getCurrentBillingPeriodStart,
} from "../subscription-constants";
import { getCurrentSubscriptionAccess } from "../subscription-access.server";

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
    const { userId, plan, limits } = await getCurrentSubscriptionAccess();

    if (!userId || userId !== clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const { start, end } = getCurrentBillingPeriodRange();
    const monthlySessionCount = await VoiceSession.countDocuments({
      clerkId,
      billingPeriodStart: {
        $gte: start,
        $lt: end,
      },
    });

    if (monthlySessionCount >= limits.maxSessionsPerMonth) {
      return {
        success: false,
        error: `Your ${plan} plan allows ${limits.maxSessionsPerMonth} session${
          limits.maxSessionsPerMonth === 1 ? "" : "s"
        } per month. Upgrade your subscription to start another session.`,
      };
    }

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

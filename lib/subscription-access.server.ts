import { auth } from "@clerk/nextjs/server";
import { getSubscriptionAccess } from "./subscription-access";

export const getCurrentSubscriptionAccess = async () => {
  const { userId, has } = await auth();
  const access = getSubscriptionAccess(has);

  if (!userId) {
    return {
      userId: null,
      ...access,
      plan: "free" as const,
      limits: access.limits,
      hasSessionHistory: false,
      hasStandardAccess: false,
      hasProAccess: false,
    };
  }

  return {
    userId,
    ...access,
  };
};

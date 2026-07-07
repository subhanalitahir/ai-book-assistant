import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const clerkProxy = clerkMiddleware();

export default async function proxy(req: NextRequest, evt: NextFetchEvent) {
  // Keep Clerk active by default so server components can resolve auth() on local routes.
  // Opt out only when the local dev-browser workaround is explicitly needed.
  if (
    process.env.NODE_ENV === "development" &&
    process.env.CLERK_SKIP_PROXY_IN_DEV === "true"
  ) {
    return NextResponse.next();
  }

  return clerkProxy(req, evt);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};

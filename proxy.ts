import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const clerkProxy = clerkMiddleware();

export default async function proxy(req: NextRequest, evt: NextFetchEvent) {
  // Clerk dev-browser handshake can rewrite requests and fail in local/headless flows.
  // Skip middleware in development so app routes remain reachable.
  if (process.env.NODE_ENV === "development") {
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

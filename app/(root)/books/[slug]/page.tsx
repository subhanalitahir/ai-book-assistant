import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getBookBySlug } from "@/lib/actions/book.actions";
import { ChevronLeft } from "lucide-react";
import VapiControls from "@/components/VapiControls";

interface BookDetailsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookDetailsPage({
  params,
}: BookDetailsPageProps) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  // Resolve params
  const { slug } = await params;

  // Fetch book
  const bookResult = await getBookBySlug(slug);
  if (!bookResult.success || !bookResult.data) {
    redirect("/");
  }

  const book = bookResult.data;

  return (
    <main className="back-page-container py-20">
      {/* Floating Back Button */}
      <Link
        href="/"
        className="back-btn-floating"
        aria-label="Go back to library"
      >
        <ChevronLeft className="w-6 h-6 text-[#212a3b]" />
      </Link>

      {/* Main Content Container */}
      <div className="vapi-main-container">
        {/* Header Card - Beige with book info */}

        {/* Transcript Area */}
        <VapiControls book={book} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import Book from "@/database/models/book.model";
import { connectToDatabase } from "@/database/mongoose";
import { serializeData } from "@/lib/utils";
import VapiControls from "@/components/VapiControls";

async function getServerSession() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return { user: { id: userId } };
}

export default async function BookDetailsPage({ params }) {
  const session = await getServerSession();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    notFound();
  }

  const { bookId } = await params;

  if (!mongoose.isValidObjectId(bookId)) {
    notFound();
  }

  await connectToDatabase();

  const book = await Book.findOne({ _id: bookId, clerkId: currentUserId })
    .lean()
    .exec();

  if (!book) {
    notFound();
  }

  const safeBook = serializeData(book);

  return (
    <main className="back-page-container py-20">
      <Link
        href="/"
        className="back-btn-floating"
        aria-label="Go back to library"
      >
        <ChevronLeft className="h-6 w-6 text-[#212a3b]" />
      </Link>

      <div className="vapi-main-container">
        <VapiControls book={safeBook} />
      </div>
    </main>
  );
}

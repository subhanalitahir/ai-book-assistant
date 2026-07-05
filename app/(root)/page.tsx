import React from "react";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { BookOpen } from "lucide-react";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";

const Home = async () => {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    userId = null;
  }

  const booksResult = userId
    ? await getAllBooks(userId)
    : { success: false, error: "No authenticated user" };

  const books =
    booksResult.success && Array.isArray(booksResult.data)
      ? booksResult.data
      : [];

  return (
    <main className="wrapper container pt-[110px]">
      <section className="library-hero-card mb-10">
        <div className="library-hero-content">
          <div className="library-hero-text">
            <h1 className="library-hero-title">Your Library</h1>
            <p className="library-hero-description">
              Convert your books into interactive AI conversations. Listen,
              learn, and discuss your favorite reads from one elegant library.
            </p>
            <button className="library-cta-primary cursor-pointer">
              + Add new book
            </button>
          </div>

          <div className="library-hero-illustration-desktop">
            <Image
              src="/assets/hero-illustration.png"
              alt="Vintage books and globe illustration"
              width={420}
              height={320}
              priority
            />
          </div>

          <aside className="library-steps-card">
            <div className="library-step-item">
              <span className="library-step-number">1</span>
              <div>
                <p className="library-step-title">Upload PDF</p>
                <p className="library-step-description">Add your book file.</p>
              </div>
            </div>
            <div className="library-step-item mt-4">
              <span className="library-step-number">2</span>
              <div>
                <p className="library-step-title">AI Processing</p>
                <p className="library-step-description">
                  We analyze the content.
                </p>
              </div>
            </div>
            <div className="library-step-item mt-4">
              <span className="library-step-number">3</span>
              <div>
                <p className="library-step-title">Voice Chat</p>
                <p className="library-step-description">Discuss with AI.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      {books.length > 0 ? (
        <div className="library-books-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL}
              slug={book.slug}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-[rgba(33,42,59,0.16)] bg-[rgba(255,255,255,0.7)] px-6 py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent-warm)]">
            <BookOpen className="h-10 w-10" aria-hidden="true" />
          </div>
          <p className="max-w-md text-lg font-medium text-[var(--text-primary)]">
            No book added please add a book
          </p>
        </div>
      )}
    </main>
  );
};

export default Home;

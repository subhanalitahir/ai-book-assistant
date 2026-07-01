import React from "react";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { sampleBooks } from "@/lib/constants";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";

const Home = async () => {
  const { userId } = await auth();
  const booksResult = userId
    ? await getAllBooks(userId)
    : { success: false, error: "No authenticated user" };

  const books =
    booksResult.success && Array.isArray(booksResult.data)
      ? booksResult.data
      : sampleBooks;

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
    </main>
  );
};

export default Home;

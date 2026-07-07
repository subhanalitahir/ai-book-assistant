"use server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import {
  buildBookSegments,
  generateSlug,
  sanitizeTextForStorage,
  serializeData,
} from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/bookSegment.model";
import { put } from "@vercel/blob";

export const getAllBooks = async (clerkId: string) => {
  try {
    await connectToDatabase();
    const books = await Book.find({ clerkId }).sort({ createdAt: -1 }).lean();
    return { success: true, data: serializeData(books) };
  } catch (error) {
    console.error("Error fetching books:", error);
    return { success: false, error: "Failed to fetch books" };
  }
};

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();
    const slug = generateSlug(title);
    const existingBook = await Book.findOne({ slug }).lean();
    if (existingBook) {
      return { exists: true, book: serializeData(existingBook) };
    }
    return { exists: false, book: null };
  } catch (error) {
    console.log("Error checking book existence:", error);
    return { exists: false, error: error };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();
    const book = await Book.findOne({ slug }).lean();
    if (!book) {
      return { success: false, data: null };
    }
    return { success: true, data: serializeData(book) };
  } catch (error) {
    console.error("Error fetching book by slug:", error);
    return { success: false, data: null };
  }
};
export const createBook = async (data: CreateBook) => {
  try {
    await connectToDatabase();
    const slug = generateSlug(data.title);
    const existingBook = await Book.findOne({ slug }).lean();
    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }
    // Check Subscription limit before creating a new book
    const book = await Book.create({ ...data, slug, totalSegments: 0 });
    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.log("Error creating book:", error);
    return { success: false, error: "Failed to create book" };
  }
};

export const createBookWithSegments = async (
  data: CreateBook,
  segments: TextSegment[],
) => {
  try {
    await connectToDatabase();

    if (!Array.isArray(segments) || segments.length === 0) {
      return {
        success: false,
        error: "Segments array is required and must not be empty.",
      };
    }

    const slug = generateSlug(data.title);
    const existingBook = await Book.findOne({ slug }).lean();
    if (existingBook) {
      return {
        success: true,
        data: {
          book: serializeData(existingBook),
          segments: [],
        },
        alreadyExists: true,
      };
    }

    const session = await mongoose.startSession();
    let createdBook: typeof Book | null = null;
    let createdSegments: Array<Record<string, unknown>> = [];

    try {
      await session.withTransaction(async () => {
        const book = new Book({ ...data, slug, totalSegments: 0 });
        await book.save({ session });

        const sanitizedSegments = buildBookSegments({
          clerkId: data.clerkId,
          bookId: book._id.toString(),
          segments,
        });

        if (sanitizedSegments.length === 0) {
          book.totalSegments = 0;
          await book.save({ session });
          createdBook = book;
          return;
        }

        createdSegments = await BookSegment.insertMany(sanitizedSegments, {
          session,
          ordered: true,
        });

        book.totalSegments = createdSegments.length;
        await book.save({ session });
        createdBook = book;
      });

      return {
        success: true,
        data: {
          book: serializeData(createdBook),
          segments: serializeData(createdSegments),
        },
      };
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error creating book with segments:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create book and segments",
    };
  }
};

export const uploadBookAsset = async (
  fileName: string,
  file: Blob | File,
  options?: { access?: "public" | "private"; contentType?: string },
) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error(
        "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to your environment variables.",
      );
    }

    const blob = await put(fileName, file, {
      access: options?.access ?? "public",
      contentType: options?.contentType,
      token,
    });

    return { success: true, data: blob };
  } catch (error) {
    console.error("Error uploading blob:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload file to Vercel Blob.",
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  clerkId: string,
  segments: TextSegment[],
) => {
  try {
    await connectToDatabase();
    console.log("Saving book segments:", segments.length);
    const sanitizedSegments = segments
      .map((segment, index) => {
        const content = sanitizeTextForStorage(segment.text || "");
        const segmentIndex =
          typeof segment.segmentIndex === "number"
            ? segment.segmentIndex
            : index;
        const pageNumber =
          typeof segment.pageNumber === "number" ? segment.pageNumber : index;

        return {
          clerkId,
          bookId,
          content,
          segmentIndex,
          pageNumber,
          wordCount: content ? content.trim().split(/\s+/).length : 0,
        };
      })
      .filter((segment) => segment.content.length > 0);

    if (sanitizedSegments.length === 0) {
      await Book.findByIdAndUpdate(bookId, { totalSegments: 0 });
      return { success: true, data: { segmentsCreated: 0 } };
    }

    await BookSegment.insertMany(sanitizedSegments, { ordered: true });
    await Book.findByIdAndUpdate(bookId, {
      totalSegments: sanitizedSegments.length,
    });
    console.log("Book segments saved successfully.");
    return {
      success: true,
      data: { segmentsCreated: sanitizedSegments.length },
    };
  } catch (error) {
    console.error("Error saving book segments:", error);
    await BookSegment.deleteMany({ clerkId, bookId });
    await Book.findByIdAndDelete(bookId);
    console.log("Deleted book and segments due to error.");
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save book segments",
    };
  }
};

type SearchBookSegmentsResult =
  | { success: true; result: string }
  | { success: false; error: string };

export const searchBookSegments = async (
  bookId: string,
  query: string,
  segmentCount = 5,
): Promise<SearchBookSegmentsResult> => {
  const normalizedBookId = bookId.trim();
  const normalizedQuery = query.trim();
  const normalizedSegmentCount = Number.isFinite(segmentCount)
    ? Math.min(Math.max(Math.trunc(segmentCount), 1), 10)
    : 5;

  if (!mongoose.isValidObjectId(normalizedBookId) || !normalizedQuery) {
    return {
      success: true,
      result: "no information found about this topic",
    };
  }

  try {
    await connectToDatabase();

    const segments = await BookSegment.find(
      {
        bookId: normalizedBookId,
        $text: { $search: normalizedQuery },
      },
      {
        content: 1,
        segmentIndex: 1,
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" }, segmentIndex: 1 })
      .limit(normalizedSegmentCount)
      .lean<Array<{ content: string; segmentIndex: number }>>();

    if (!segments.length) {
      return {
        success: true,
        result: "no information found about this topic",
      };
    }

    return {
      success: true,
      result: segments
        .map(
          (segment) =>
            `Segment ${segment.segmentIndex + 1}: ${segment.content}`,
        )
        .join("\n"),
    };
  } catch (error) {
    console.error("Error searching book segments:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to search book segments",
    };
  }
};

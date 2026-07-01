"use server";
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, sanitizeTextForStorage, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/bookSegment.model";
import { put } from "@vercel/blob";
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
      .map((segment) => {
        const content = sanitizeTextForStorage(segment.text);
        return {
          clerkId,
          bookId,
          content,
          segmentIndex: segment.segmentIndex,
          pageNumber: segment.pageNumber,
          wordCount: content ? content.split(/\s+/).length : 0,
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

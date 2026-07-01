import { IBookSegment } from "@/types";
import mongoose, { Schema } from "mongoose";

const BookSegmentSchema = new Schema<IBookSegment>(
  {
    clerkId: { type: String, required: true },
    bookId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Book",
      index: true,
    },
    content: { type: String, required: true },
    segmentIndex: { type: Number, required: true, index: true },
    pageNumber: { type: Number },
    wordCount: { type: Number, required: true },
  },
  { timestamps: true },
);
BookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });
BookSegmentSchema.index(
  { bookId: 1, pageNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { pageNumber: { $type: "number" } },
  },
);
BookSegmentSchema.index({ bookId: 1, content: "text" });

const BookSegmentModel =
  mongoose.models.BookSegment ||
  mongoose.model<IBookSegment>("BookSegment", BookSegmentSchema);

export default BookSegmentModel;

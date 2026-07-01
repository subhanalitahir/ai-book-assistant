// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import { buildBookSegments, sanitizeTextForStorage } from "../lib/utils.ts";

test("sanitizeTextForStorage removes null bytes and control characters", () => {
  const input = "Hello\u0000world\u0001\nnext\tline";

  assert.equal(sanitizeTextForStorage(input), "Hello world next line");
});

test("buildBookSegments assigns a bookId and sequential indexes", () => {
  const segments = buildBookSegments({
    clerkId: "clerk_123",
    bookId: "507f1f77bcf86cd799439011",
    segments: [
      { text: "First segment", segmentIndex: 99, wordCount: 2 },
      { text: "Second segment", segmentIndex: 100, wordCount: 2 },
      { text: "", segmentIndex: 101, wordCount: 0 },
    ],
  });

  assert.equal(segments.length, 2);
  assert.deepEqual(segments[0], {
    clerkId: "clerk_123",
    bookId: "507f1f77bcf86cd799439011",
    content: "First segment",
    segmentIndex: 0,
    pageNumber: 0,
    wordCount: 2,
  });
  assert.deepEqual(segments[1], {
    clerkId: "clerk_123",
    bookId: "507f1f77bcf86cd799439011",
    content: "Second segment",
    segmentIndex: 1,
    pageNumber: 1,
    wordCount: 2,
  });
});

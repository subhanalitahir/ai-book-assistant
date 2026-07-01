// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeTextForStorage } from "../lib/utils.ts";

test("sanitizeTextForStorage removes null bytes and control characters", () => {
  const input = "Hello\u0000world\u0001\nnext\tline";

  assert.equal(sanitizeTextForStorage(input), "Hello world next line");
});

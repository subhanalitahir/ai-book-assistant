import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: "user_123" }) }));
jest.mock("@/lib/actions/book.actions", () => ({
  checkBookExists: jest.fn(),
  uploadBookAsset: jest.fn(),
  createBookWithSegments: jest.fn(),
}));
jest.mock("@/lib/utils", () => ({ parsePDFFile: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const {
  checkBookExists,
  uploadBookAsset,
  createBookWithSegments,
} = require("@/lib/actions/book.actions");
const { parsePDFFile } = require("@/lib/utils");

import UploadForm from "@/components/UploadForm";

describe("UploadForm edge cases", () => {
  beforeEach(() => jest.clearAllMocks());

  it("handles drag-and-drop file selection", async () => {
    render(<UploadForm />);

    const dropzone = document.querySelector(".upload-dropzone") as HTMLElement;
    const file = new File(["a"], "dragged.pdf", { type: "application/pdf" });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    dropzone.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      } as any),
    );

    await waitFor(() =>
      expect(screen.getByText(/dragged.pdf/i)).toBeInTheDocument(),
    );
  });

  it("shows error when parsed PDF has no content (empty file)", async () => {
    (parsePDFFile as jest.Mock).mockResolvedValue({ content: [], cover: "" });
    render(<UploadForm />);

    const pdfInput = document.querySelector(
      'input[accept*="application/pdf"]',
    ) as HTMLInputElement;
    const file = new File([""], "empty.pdf", {
      type: "application/pdf",
      size: 0,
    });
    await userEvent.upload(pdfInput, file);

    const submit = screen.getByRole("button", { name: /Begin Synthesis/i });
    await userEvent.click(submit);

    await waitFor(() =>
      expect(require("sonner").toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to parse PDF"),
      ),
    );
  });

  it("handles network failure mid-upload (uploadBookAsset throws)", async () => {
    (checkBookExists as jest.Mock).mockResolvedValue({ exists: false });
    (parsePDFFile as jest.Mock).mockResolvedValue({
      content: ["p1"],
      cover: "https://example.com/cover.png",
    });
    (uploadBookAsset as jest.Mock).mockRejectedValueOnce(
      new Error("Network error during upload"),
    );

    render(<UploadForm />);

    const pdfInput = document.querySelector(
      'input[accept*="application/pdf"]',
    ) as HTMLInputElement;
    const titleInput = screen.getByPlaceholderText(/ex: Rich Dad Poor Dad/i);
    const authorInput = screen.getByPlaceholderText(/ex: Robert Kiyosaki/i);
    const file = new File(["d"], "sample.pdf", {
      type: "application/pdf",
      size: 1024,
    });
    await userEvent.upload(pdfInput, file);

    await userEvent.type(titleInput, "Failing Upload");
    await userEvent.type(authorInput, "Author");

    const submit = screen.getByRole("button", { name: /Begin Synthesis/i });
    await userEvent.click(submit);

    await waitFor(() =>
      expect(require("sonner").toast.error).toHaveBeenCalled(),
    );
  });
});

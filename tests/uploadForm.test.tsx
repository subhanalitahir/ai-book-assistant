import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadForm from "@/components/UploadForm";

jest.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: "user_123" }) }));
jest.mock("@/lib/actions/book.actions", () => ({
  checkBookExists: jest.fn(),
  uploadBookAsset: jest.fn(),
  createBookWithSegments: jest.fn(),
}));
jest.mock("@/lib/utils", () => ({
  parsePDFFile: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const {
  checkBookExists,
  uploadBookAsset,
  createBookWithSegments,
} = require("@/lib/actions/book.actions");
const { parsePDFFile } = require("@/lib/utils");

describe("UploadForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state and accepts a PDF file", async () => {
    render(<UploadForm />);
    expect(screen.getByText(/Click to upload PDF/i)).toBeInTheDocument();

    const file = new File(["dummy content"], "sample.pdf", {
      type: "application/pdf",
      size: 1024,
    });
    const input =
      screen.getByLabelText(/Upload PDF \*/i, { selector: "input" }) ||
      document.querySelector("input[type=file]");

    // find the hidden input by role (file inputs don't always expose role), fallback to query
    const pdfInput = document.querySelector(
      'input[accept*="application/pdf"]',
    ) as HTMLInputElement;
    expect(pdfInput).toBeTruthy();

    await userEvent.upload(pdfInput, file);

    expect(pdfInput.files?.[0]).toBe(file);
    expect(screen.getByText(/sample.pdf/)).toBeInTheDocument();
  });

  it("validates invalid file types and large files", async () => {
    render(<UploadForm />);
    const pdfInput = document.querySelector(
      'input[accept*="application/pdf"]',
    ) as HTMLInputElement;

    const exeFile = new File(["exe"], "malicious.exe", {
      type: "application/x-msdownload",
      size: 100,
    });
    await userEvent.upload(pdfInput, exeFile);

    // Trigger form submission to run validation
    const submit = screen.getByRole("button", { name: /Begin Synthesis/i });
    await userEvent.click(submit);

    // Zod validation runs asynchronously — expect an error message about PDF
    await waitFor(() => {
      expect(
        screen.getByText(/Only PDF files are accepted/i),
      ).toBeInTheDocument();
    });

    // Large file
    const bigFile = new File([new ArrayBuffer(60 * 1024 * 1024)], "big.pdf", {
      type: "application/pdf",
      size: 60 * 1024 * 1024,
    });
    await userEvent.upload(pdfInput, bigFile);
    await userEvent.click(submit);
    await waitFor(() => {
      expect(
        screen.getByText(/PDF file must be less than/i),
      ).toBeInTheDocument();
    });
  });

  it("handles a successful upload flow", async () => {
    checkBookExists.mockResolvedValue({ exists: false });
    parsePDFFile.mockResolvedValue({
      content: ["page1"],
      cover: "https://example.com/cover.png",
    });
    uploadBookAsset.mockResolvedValue({
      success: true,
      data: { url: "https://cdn/sample.pdf", pathname: "/sample.pdf" },
    });
    // Second call for cover
    uploadBookAsset
      .mockResolvedValueOnce({
        success: true,
        data: { url: "https://cdn/sample.pdf", pathname: "/sample.pdf" },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { url: "https://cdn/cover.png", pathname: "/cover.png" },
      });
    createBookWithSegments.mockResolvedValue({
      success: true,
      data: { book: { slug: "test-book" } },
    });

    // mock fetch used for parsedPDF.cover
    global.fetch = jest
      .fn()
      .mockResolvedValue({ blob: async () => new Blob(["img"]) });

    render(<UploadForm />);

    const pdfInput = document.querySelector(
      'input[accept*="application/pdf"]',
    ) as HTMLInputElement;
    const titleInput = screen.getByPlaceholderText(/ex: Rich Dad Poor Dad/i);
    const authorInput = screen.getByPlaceholderText(/ex: Robert Kiyosaki/i);
    const submit = screen.getByRole("button", { name: /Begin Synthesis/i });

    const file = new File(["dummy"], "sample.pdf", {
      type: "application/pdf",
      size: 1024,
    });
    await userEvent.upload(pdfInput, file);

    await userEvent.type(titleInput, "My Test Book");
    await userEvent.type(authorInput, "Some Author");

    // select a voice radio
    const radio =
      screen.getByLabelText(/Dave/i) ||
      document.querySelector('input[value="dave"]');
    if (radio) userEvent.click(radio as Element);

    await userEvent.click(submit);

    await waitFor(() => {
      expect(checkBookExists).toHaveBeenCalledWith("My Test Book");
      expect(parsePDFFile).toHaveBeenCalled();
      expect(uploadBookAsset).toHaveBeenCalled();
      expect(createBookWithSegments).toHaveBeenCalled();
    });
  });
});

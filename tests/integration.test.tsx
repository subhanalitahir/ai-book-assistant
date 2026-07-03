import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: "user_123" }) }));

const mockStart = jest.fn();
const mockStop = jest.fn();
jest.mock("@vapi-ai/web", () =>
  jest.fn().mockImplementation(() => ({ start: mockStart, stop: mockStop })),
);

jest.mock("@/lib/actions/session.actions", () => ({
  startVoiceSession: jest.fn(),
}));
import { startVoiceSession } from "@/lib/actions/session.actions";

import VapiControls from "@/components/VapiControls";

describe("Integration: Book context + Voice session", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not start Vapi when book has no _id", async () => {
    const incompleteBook = { title: "No ID Book", author: "Author" } as any;
    render(<VapiControls book={incompleteBook} />);

    const micBtn = screen.getByRole("button", { name: /Start voice chat/i });
    await userEvent.click(micBtn);

    await waitFor(() => {
      expect(startVoiceSession).not.toHaveBeenCalled();
      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  it("starts Vapi when book context exists and book._id provided", async () => {
    startVoiceSession.mockResolvedValue({ success: true, sessionId: "s1" });
    const fullBook = {
      _id: "book_99",
      title: "Uploaded Book",
      author: "Author",
      coverURL: "",
    } as any;
    render(<VapiControls book={fullBook} />);

    const micBtn = screen.getByRole("button", { name: /Start voice chat/i });
    await userEvent.click(micBtn);

    await waitFor(() => {
      expect(startVoiceSession).toHaveBeenCalledWith("user_123", "book_99");
      expect(mockStart).toHaveBeenCalled();
    });
  });
});

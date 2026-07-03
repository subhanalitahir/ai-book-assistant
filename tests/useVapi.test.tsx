import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mocks
jest.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: "user_123" }) }));

const mockStart = jest.fn();
const mockStop = jest.fn();

jest.mock("@vapi-ai/web", () => {
  return jest.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
  }));
});

jest.mock("@/lib/actions/session.actions", () => ({
  startVoiceSession: jest.fn(),
}));

import { startVoiceSession } from "@/lib/actions/session.actions";
import useVapi from "@/hooks/useVapi";

const SampleBook = {
  _id: "book_1",
  title: "Test Book",
  author: "Author",
  persona: "dave",
} as any;

function TestComponent({ book }: { book: any }) {
  const { status, limitError, isActive, start, stop } = useVapi(book);
  return (
    <div>
      <div>status: {status}</div>
      <div>error: {limitError}</div>
      <div>active: {String(isActive)}</div>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
    </div>
  );
}

describe("useVapi hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts a session successfully (happy path)", async () => {
    (startVoiceSession as jest.Mock).mockResolvedValue({
      success: true,
      sessionId: "sess_1",
    });

    render(<TestComponent book={SampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(startVoiceSession).toHaveBeenCalledWith("user_123", "book_1");
      expect(mockStart).toHaveBeenCalled();
    });
  });

  it("handles startVoiceSession returning failure", async () => {
    (startVoiceSession as jest.Mock).mockResolvedValue({
      success: false,
      error: "no-capacity",
    });
    render(<TestComponent book={SampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(startVoiceSession).toHaveBeenCalled();
      expect(screen.getByText(/error:/i)).toHaveTextContent("no-capacity");
    });
  });

  it("handles Vapi.start throwing (microphone permission denied)", async () => {
    (startVoiceSession as jest.Mock).mockResolvedValue({
      success: true,
      sessionId: "sess_2",
    });
    mockStart.mockImplementationOnce(() => {
      throw new Error("Microphone permission denied");
    });

    render(<TestComponent book={SampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
      expect(screen.getByText(/error:/i)).toHaveTextContent(
        "Failed to start session. Please try again.",
      );
    });
  });

  it("stop() calls vapi.stop()", async () => {
    (startVoiceSession as jest.Mock).mockResolvedValue({
      success: true,
      sessionId: "sess_3",
    });
    render(<TestComponent book={SampleBook} />);

    await userEvent.click(screen.getByText("start"));
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    await userEvent.click(screen.getByText("stop"));
    await waitFor(() => expect(mockStop).toHaveBeenCalled());
  });
});
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useVapi } from "@/hooks/useVapi";

jest.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: "user_123" }) }));

// Mock the Vapi SDK
const startMock = jest.fn();
const stopMock = jest.fn();

jest.mock("@vapi-ai/web", () => {
  return jest
    .fn()
    .mockImplementation(() => ({ start: startMock, stop: stopMock }));
});

jest.mock("@/lib/actions/session.actions", () => ({
  startVoiceSession: jest
    .fn()
    .mockResolvedValue({ success: true, sessionId: "sess_1" }),
}));

describe("useVapi hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPI_KEY = "test-key";
    process.env.NEXT_PUBLIC_ASSISTANT_ID = "assistant_1";
  });

  it("starts a call and calls Vapi.start with book context", async () => {
    const book = {
      _id: "book_1",
      title: "Title",
      author: "Author",
      persona: "dave",
    } as any;
    const { result, waitForNextUpdate } = renderHook(() => useVapi(book));

    await act(async () => {
      await result.current.start();
    });

    expect(startMock).toHaveBeenCalled();
  });

  it("handles SDK errors (microphone permission denied)", async () => {
    const { startVoiceSession } = require("@/lib/actions/session.actions");
    startVoiceSession.mockResolvedValue({ success: true, sessionId: "sess_2" });
    startMock.mockRejectedValueOnce(new Error("Microphone permission denied"));

    const book = {
      _id: "book_2",
      title: "T",
      author: "A",
      persona: "dave",
    } as any;
    const { result } = renderHook(() => useVapi(book));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.limitError).toMatch(
      /Failed to start session|Microphone permission denied/i,
    );
  });

  it("does not start if user not logged in", async () => {
    jest
      .mocked(require("@clerk/nextjs").useAuth)
      .mockImplementation(() => ({ userId: null }));
    const book = {
      _id: "book_3",
      title: "T",
      author: "A",
      persona: "dave",
    } as any;
    const { result } = renderHook(() => useVapi(book));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.limitError).toBeTruthy();
  });
});

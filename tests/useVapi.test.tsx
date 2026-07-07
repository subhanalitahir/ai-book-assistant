import React from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseAuth = jest.fn(() => ({ userId: "user_123" }));

jest.mock("@clerk/nextjs", () => ({ useAuth: mockUseAuth }));

const startMock = jest.fn();
const stopMock = jest.fn();
const listeners = new Map<string, Array<(payload?: unknown) => void>>();

const onMock = jest.fn((event: string, handler: (payload?: unknown) => void) => {
  const handlers = listeners.get(event) ?? [];
  handlers.push(handler);
  listeners.set(event, handlers);
});

const offMock = jest.fn((event: string, handler: (payload?: unknown) => void) => {
  const handlers = listeners.get(event) ?? [];
  listeners.set(
    event,
    handlers.filter((registeredHandler) => registeredHandler !== handler),
  );
});

const emitVapiEvent = (event: string, payload?: unknown) => {
  for (const handler of listeners.get(event) ?? []) {
    handler(payload);
  }
};

jest.mock("@vapi-ai/web", () => {
  return jest.fn().mockImplementation(() => ({
    start: startMock,
    stop: stopMock,
    on: onMock,
    off: offMock,
  }));
});

jest.mock("@/lib/actions/session.actions", () => ({
  startVoiceSession: jest.fn(),
  endVoiceSession: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  getVoice: () => ({ id: "voice_1" }),
}));

import { startVoiceSession } from "@/lib/actions/session.actions";
import useVapi from "@/hooks/useVapi";

const sampleBook = {
  _id: "book_1",
  title: "Test Book",
  author: "Author",
  persona: "dave",
} as any;

function TestComponent({ book }: { book: any }) {
  const {
    status,
    limitError,
    isActive,
    start,
    stop,
    messages,
    currentMessage,
    currentUserMessage,
  } = useVapi(book);

  return (
    <div>
      <div>status: {status}</div>
      <div>error: {limitError}</div>
      <div>active: {String(isActive)}</div>
      <div>
        messages: {messages.map((message) => `${message.role}:${message.content}`).join("|")}
      </div>
      <div>current-assistant: {currentMessage}</div>
      <div>current-user: {currentUserMessage}</div>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
    </div>
  );
}

describe("useVapi hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    process.env.NEXT_PUBLIC_VAPI_KEY = "test-key";
    process.env.NEXT_PUBLIC_ASSISTANT_ID = "assistant_1";
    mockUseAuth.mockReturnValue({ userId: "user_123" });
    (startVoiceSession as jest.Mock).mockResolvedValue({
      success: true,
      sessionId: "sess_1",
    });
  });

  it("starts a session successfully (happy path)", async () => {
    render(<TestComponent book={sampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(startVoiceSession).toHaveBeenCalledWith("user_123", "book_1");
      expect(startMock).toHaveBeenCalled();
    });
  });

  it("continues starting the conversation when session persistence fails", async () => {
    (startVoiceSession as jest.Mock).mockRejectedValueOnce(
      new Error("MongoDB unavailable"),
    );

    render(<TestComponent book={sampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(startMock).toHaveBeenCalled();
      expect(screen.getByText(/status: starting/i)).toBeInTheDocument();
    });
  });

  it("handles startVoiceSession returning failure", async () => {
    (startVoiceSession as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "no-capacity",
    });

    render(<TestComponent book={sampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(startVoiceSession).toHaveBeenCalled();
      expect(screen.getByText(/error:/i)).toHaveTextContent("no-capacity");
      expect(startMock).toHaveBeenCalled();
    });
  });

  it("handles Vapi.start throwing (microphone permission denied)", async () => {
    startMock.mockImplementationOnce(() => {
      throw new Error("Microphone permission denied");
    });

    render(<TestComponent book={sampleBook} />);

    await userEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(startMock).toHaveBeenCalled();
      expect(screen.getByText(/error:/i)).toHaveTextContent(
        "Microphone access was denied. Please enable microphone access in your browser settings.",
      );
    });
  });

  it("stop() calls vapi.stop()", async () => {
    render(<TestComponent book={sampleBook} />);

    await userEvent.click(screen.getByText("start"));
    await waitFor(() => expect(startMock).toHaveBeenCalled());

    await userEvent.click(screen.getByText("stop"));
    await waitFor(() => expect(stopMock).toHaveBeenCalled());
  });

  it("tracks partial and final transcript events without duplicating finals", async () => {
    render(<TestComponent book={sampleBook} />);

    await userEvent.click(screen.getByText("start"));
    await waitFor(() => expect(startMock).toHaveBeenCalled());

    act(() => {
      emitVapiEvent("message", {
        type: "transcript",
        role: "user",
        transcriptType: "partial",
        transcript: "I started",
      });
    });

    expect(screen.getByText(/current-user: I started/i)).toBeInTheDocument();

    act(() => {
      emitVapiEvent("message", {
        type: "transcript",
        role: "user",
        transcriptType: "final",
        transcript: "I started",
      });
    });

    expect(screen.getByText(/current-user:/i)).toHaveTextContent("current-user:");
    expect(screen.getByText(/status: thinking/i)).toBeInTheDocument();
    expect(screen.getByText(/messages: user:I started/i)).toBeInTheDocument();

    act(() => {
      emitVapiEvent("message", {
        type: "transcript",
        role: "assistant",
        transcriptType: "partial",
        transcript: "Working on it",
      });
    });

    expect(screen.getByText(/current-assistant: Working on it/i)).toBeInTheDocument();

    act(() => {
      emitVapiEvent("message", {
        type: "transcript",
        role: "assistant",
        transcriptType: "final",
        transcript: "Working on it",
      });
    });

    expect(screen.getByText(/current-assistant:/i)).toHaveTextContent(
      "current-assistant:",
    );
    expect(
      screen.getByText(/messages: user:I started\|assistant:Working on it/i),
    ).toBeInTheDocument();

    act(() => {
      emitVapiEvent("message", {
        type: "transcript",
        role: "assistant",
        transcriptType: "final",
        transcript: "Working on it",
      });
    });

    expect(
      screen.getByText(/messages: user:I started\|assistant:Working on it/i),
    ).toBeInTheDocument();
  });

  it("uses a local fallback identity when Clerk auth is unavailable", async () => {
    mockUseAuth.mockReturnValue({ userId: null });

    const { result } = renderHook(() => useVapi(sampleBook));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.limitError).toBeNull();
    expect(startMock).toHaveBeenCalled();
  });
});
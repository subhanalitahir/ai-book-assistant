import { NextResponse } from "next/server";
import { searchBookSegments } from "@/lib/actions/book.actions";

export const runtime = "nodejs";

const NO_INFORMATION = "no information found about this topic";

type SearchBookCall = {
  name?: string;
  parameters?: unknown;
  args?: unknown;
  data?: unknown;
  functionCall?: {
    name?: string;
    arguments?: unknown;
    parameters?: unknown;
  };
  toolCall?: {
    name?: string;
    arguments?: unknown;
    parameters?: unknown;
  };
};

type SearchBookParameters = {
  bookId?: string;
  query?: string;
  segmentCount?: number;
  segments?: number;
  limit?: number;
  count?: number;
};

const parseObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseObject(parsed);
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
};

const getCalls = (body: unknown): SearchBookCall[] => {
  if (Array.isArray(body)) {
    return body as SearchBookCall[];
  }

  const payload = parseObject(body);

  if (Array.isArray(payload.calls)) {
    return payload.calls as SearchBookCall[];
  }

  if (Array.isArray(payload.toolCalls)) {
    return payload.toolCalls as SearchBookCall[];
  }

  return [payload as SearchBookCall];
};

const getParameters = (call: SearchBookCall): SearchBookParameters => {
  return {
    ...parseObject(call.parameters),
    ...parseObject(call.args),
    ...parseObject(call.data),
    ...parseObject(call.functionCall?.arguments),
    ...parseObject(call.functionCall?.parameters),
    ...parseObject(call.toolCall?.arguments),
    ...parseObject(call.toolCall?.parameters),
  } as SearchBookParameters;
};

const getCallName = (call: SearchBookCall) =>
  call.name ?? call.functionCall?.name ?? call.toolCall?.name ?? "";

const resolveSegmentCount = (parameters: SearchBookParameters) => {
  const rawCount =
    parameters.segmentCount ??
    parameters.segments ??
    parameters.limit ??
    parameters.count ??
    5;

  const parsedCount = Number(rawCount);

  return Number.isFinite(parsedCount) ? parsedCount : 5;
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ result: NO_INFORMATION });
  }

  const calls = getCalls(body);
  const searchCalls = calls.filter((call) => getCallName(call) === "searchBook");

  if (searchCalls.length === 0) {
    return NextResponse.json({ result: NO_INFORMATION });
  }

  const results = await Promise.all(
    searchCalls.map(async (call) => {
      const parameters = getParameters(call);
      const bookId = typeof parameters.bookId === "string" ? parameters.bookId : "";
      const query = typeof parameters.query === "string" ? parameters.query : "";
      const segmentCount = resolveSegmentCount(parameters);

      const searchResult = await searchBookSegments(bookId, query, segmentCount);

      return {
        name: "searchBook",
        ...(searchResult.success
          ? { result: searchResult.result }
          : { result: NO_INFORMATION, error: searchResult.error }),
      };
    }),
  );

  if (results.length === 1) {
    return NextResponse.json({ result: results[0].result });
  }

  return NextResponse.json({ results });
}
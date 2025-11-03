export interface SseEvent {
  event: string;
  data: string;
  raw: string;
}

/**
 * Async generator that yields parsed SSE events from a ReadableStream.
 * Supports arbitrary chunking and normalises CRLF/CR separators.
 */
export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let eventLines: string[] = [];

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        const trimmedLine = line.endsWith("\r") ? line.slice(0, -1) : line;

        if (trimmedLine === "") {
          const parsed = buildEvent(eventLines);
          eventLines = [];
          if (parsed) {
            yield parsed;
          }
        } else if (!trimmedLine.startsWith(":")) {
          eventLines.push(trimmedLine);
        }
      }
    }

    buffer += decoder.decode();
    if (buffer.length > 0) {
      eventLines.push(buffer.replace(/\r$/, ""));
    }
    const trailingEvent = buildEvent(eventLines);
    if (trailingEvent) {
      yield trailingEvent;
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseEventData<T = unknown>(event: SseEvent): T | null {
  if (!event.data) {
    return null;
  }

  try {
    return JSON.parse(event.data) as T;
  } catch (error) {
    console.warn("Не удалось распарсить JSON из SSE:", error, event);
    return null;
  }
}

function buildEvent(lines: string[]): SseEvent | null {
  if (lines.length === 0) {
    return null;
  }

  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim() || eventName;
      continue;
    }

    if (line.startsWith("data:")) {
      const rawValue = line.slice(5);
      const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
      dataLines.push(value);
    }
  }

  return {
    event: eventName,
    data: dataLines.join("\n"),
    raw: lines.join("\n"),
  };
}

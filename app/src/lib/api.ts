import type { Credentials } from "./auth";
import { buildBasicAuthHeader } from "./auth";
import { REQUEST_ENDPOINT } from "./config";
import { parseEventData, parseSseStream } from "./sse";

export interface RequestParams {
  message: string;
  conversationId?: string | null;
}

export interface JsonResponse {
  conversationId: string;
  content: string;
}

export interface StreamHandle {
  conversationId: string;
  stream: AsyncGenerator<string>;
}

interface RequestOptions extends RequestParams {
  credentials: Credentials;
}

export async function sendJsonRequest(params: RequestOptions): Promise<JsonResponse> {
  let response: Response;
  try {
    response = await fetch(REQUEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: buildBasicAuthHeader(params.credentials),
      },
      body: JSON.stringify({
        message: params.message,
        conversation_id: params.conversationId,
        stream: false,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Не удалось связаться с сервером. Проверьте соединение.",
    );
  }

  if (response.status === 401) {
    throw new Error("Неверные логин или пароль");
  }

  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку: ${response.status}`);
  }

  const payload = (await response.json()) as { content: string; conversation_id: string };

  return {
    content: payload.content,
    conversationId: payload.conversation_id,
  };
}

export async function startStreamRequest(params: RequestOptions): Promise<StreamHandle> {
  const controller = new AbortController();

  let response: Response;
  try {
    response = await fetch(REQUEST_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Authorization: buildBasicAuthHeader(params.credentials),
      },
      body: JSON.stringify({
        message: params.message,
        conversation_id: params.conversationId,
        stream: true,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Не удалось связаться с сервером. Проверьте соединение.",
    );
  }

  if (response.status === 401) {
    controller.abort();
    throw new Error("Неверные логин или пароль");
  }

  if (!response.ok) {
    controller.abort();
    throw new Error(`Сервер вернул ошибку: ${response.status}`);
  }

  if (!response.body) {
    controller.abort();
    throw new Error("Сервер не открыл поток данных");
  }

  const conversationId =
    response.headers.get("Conversation-Id") ?? params.conversationId ?? "";

  async function* generator(): AsyncGenerator<string> {
    try {
      for await (const event of parseSseStream(response.body!)) {
        const eventName = event.event ?? "message";
        const data = event.data ?? "";
        const trimmed = data.trim();

        if (eventName === "done" || trimmed === "[DONE]") {
          break;
        }

        if (eventName === "error") {
          throw new Error(trimmed || "Поток завершился с ошибкой");
        }

        if (eventName === "content") {
          yield data.length > 0 ? data : "\n";
          continue;
        }

        if (!trimmed) {
          continue;
        }

        const parsed = parseEventData<{ content?: string; error?: string }>(event);
        if (parsed?.error) {
          throw new Error(parsed.error);
        }

        if (parsed && typeof parsed.content === "string") {
          yield parsed.content;
        }
      }
    } finally {
      controller.abort();
    }
  }

  return {
    conversationId,
    stream: generator(),
  };
}

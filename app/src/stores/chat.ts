import { createMemo, createSignal } from "solid-js";

type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

type ConversationMap = Map<string, Conversation>;

const [conversationMap, setConversationMap] = createSignal<ConversationMap>(new Map());
const [conversationOrder, setConversationOrder] = createSignal<string[]>([]);
const [activeConversationId, setActiveConversationId] = createSignal<string | null>(null);
const [isStreaming, setIsStreaming] = createSignal(false);

let messageCounter = 0;

const conversationList = createMemo(() =>
  conversationOrder().map((id) => {
    const conversation = conversationMap().get(id);
    if (!conversation) {
      return { id, title: "", updatedAt: 0, messageCount: 0 };
    }
    return {
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
    };
  }),
);

function createConversation(id: string, title?: string): Conversation {
  const now = Date.now();
  return {
    id,
    title: title ?? "Новый диалог",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function upsertConversation(
  conversationId: string,
  updater: (conversation: Conversation) => Conversation,
): void {
  setConversationMap((current) => {
    const next = new Map(current);
    const existing = next.get(conversationId) ?? createConversation(conversationId);
    const updated = updater(existing);
    next.set(conversationId, updated);
    return next;
  });
}

function ensureConversation(conversationId: string, title?: string): Conversation {
  let result: Conversation | undefined;
  let isNew = false;

  setConversationMap((current) => {
    const next = new Map(current);
    const existing = next.get(conversationId);
    if (!existing) {
      const created = createConversation(conversationId, title);
      next.set(conversationId, created);
      result = created;
      isNew = true;
    } else {
      const resolvedTitle = title && existing.title === "Новый диалог" ? title : existing.title;
      const updated = { ...existing, title: resolvedTitle };
      next.set(conversationId, updated);
      result = updated;
    }
    return next;
  });

  if (isNew) {
    setConversationOrder((order) => [conversationId, ...order.filter((id) => id !== conversationId)]);
  }

  return result ?? createConversation(conversationId, title);
}

function touchConversation(conversationId: string): void {
  setConversationOrder((order) => [conversationId, ...order.filter((id) => id !== conversationId)]);
}

function appendMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  options?: { title?: string; replaceAssistant?: boolean; messageId?: string },
): string {
  let resolvedId = options?.messageId ?? `m_${Date.now()}_${messageCounter++}`;
  const now = Date.now();

  upsertConversation(conversationId, (conversation) => {
    const title = options?.title && conversation.title === "Новый диалог"
      ? options.title
      : conversation.title;

    let messages = conversation.messages;
    if (options?.replaceAssistant && options.messageId) {
      messages = messages.map((message) =>
        message.id === options.messageId ? { ...message, content, createdAt: now } : message,
      );
    } else {
      const message: ChatMessage = {
        id: resolvedId,
        role,
        content,
        createdAt: now,
      };
      messages = [...messages, message];
    }

    return {
      ...conversation,
      title,
      updatedAt: now,
      messages,
    };
  });

  touchConversation(conversationId);

  return resolvedId;
}

function clearConversations(): void {
  setConversationMap(new Map());
  setConversationOrder([]);
  setActiveConversationId(null);
}

function replaceConversationId(oldId: string, newId: string): void {
  if (oldId === newId) {
    return;
  }

  let didReplace = false;
  setConversationMap((current) => {
    const next = new Map(current);
    const conversation = next.get(oldId);
    if (!conversation) {
      return next;
    }

    const updatedConversation: Conversation = {
      ...conversation,
      id: newId,
    };

    next.delete(oldId);
    next.set(newId, updatedConversation);
    didReplace = true;
    return next;
  });

  if (!didReplace) {
    return;
  }

  setConversationOrder((order) => [newId, ...order.filter((id) => id !== oldId && id !== newId)]);

  if (activeConversationId() === oldId) {
    setActiveConversationId(newId);
  }
}

export const chatStore = {
  conversations: conversationMap,
  conversationList,
  activeConversationId,
  isStreaming,
  setActiveConversationId,
  setIsStreaming,
  ensureConversation,
  touchConversation,
  appendUserMessage: (conversationId: string, content: string, title?: string) =>
    appendMessage(conversationId, "user", content, { title }),
  appendAssistantMessage: (conversationId: string, content: string) =>
    appendMessage(conversationId, "assistant", content),
  replaceAssistantMessage: (conversationId: string, messageId: string, content: string) =>
    appendMessage(conversationId, "assistant", content, {
      replaceAssistant: true,
      messageId,
    }),
  clearConversations,
  replaceConversationId,
};

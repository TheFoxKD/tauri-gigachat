import { Component, Show, createMemo, For } from "solid-js";
import { chatStore } from "../stores/chat";
import { pluralizeMessages, renderMarkdown } from "../lib/format";
import { ChatComposer } from "./ChatComposer";
import gigaMark from "../assets/giga-mark.svg";

interface ChatViewProps {
  isSubmitting?: boolean;
  streamEnabled: boolean;
  onSubmitMessage: (text: string) => Promise<void>;
  onStreamModeChange: (enabled: boolean) => void;
}

export const ChatView: Component<ChatViewProps> = (props) => {
  const activeConversation = createMemo(() => {
    const id = chatStore.activeConversationId();
    return id ? chatStore.conversations().get(id) : undefined;
  });

  return (
    <div class="chat-view">
      <Show
        when={activeConversation()}
        fallback={
          <div class="chat-view__empty">
            <img class="chat-view__placeholder-icon" src={gigaMark} alt="" aria-hidden="true" />
            <h2>Начните диалог</h2>
            <ChatComposer
              variant="center"
              placeholder="Напишите вопрос или сообщение..."
              autoFocus
              isSubmitting={props.isSubmitting}
              streamEnabled={props.streamEnabled}
              onStreamModeChange={props.onStreamModeChange}
              onSubmit={props.onSubmitMessage}
            />
          </div>
        }
      >
        {(conversation) => (
          <div class="chat-view__conversation">
            <header class="chat-view__header">
              <div>
                <h2>{conversation().title || "Диалог"}</h2>
                <p>{pluralizeMessages(conversation().messages.length)}</p>
              </div>
            </header>

            <div class="chat-view__messages">
              <For each={conversation().messages}>
                {(message) => (
                  <article class={`chat-message chat-message--${message.role}`}>
                    <div
                      class="chat-message__bubble"
                      innerHTML={renderMarkdown(message.content || "")}
                    />
                  </article>
                )}
              </For>
            </div>
            <ChatComposer
              placeholder="Введите сообщение"
              isSubmitting={props.isSubmitting}
              streamEnabled={props.streamEnabled}
              onStreamModeChange={props.onStreamModeChange}
              onSubmit={props.onSubmitMessage}
            />
          </div>
        )}
      </Show>
    </div>
  );
};

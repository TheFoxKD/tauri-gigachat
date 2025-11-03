import { Component, For, Show, createMemo } from "solid-js";
import { chatStore } from "../stores/chat";
import { pluralizeMessages } from "../lib/format";

export const ConversationsList: Component = () => {
  const conversations = () => chatStore.conversationList();
  const activeId = () => chatStore.activeConversationId();

  const empty = createMemo(() => conversations().length === 0);

  return (
    <section class="conversations">
      <Show
        when={!empty()}
        fallback={<p class="conversations__empty">Создайте первый чат, чтобы начать.</p>}
      >
        <ul class="conversations__list">
          <For each={conversations()}>
            {(item) => (
              <li>
                <button
                  type="button"
                  class={`conversations__item${item.id === activeId() ? " conversations__item--active" : ""}`}
                  onClick={() => chatStore.setActiveConversationId(item.id)}
                >
                  <div class="conversations__item-body">
                    <span class="conversations__title">{item.title || "Без названия"}</span>
                    <span class="conversations__count">
                      {pluralizeMessages(item.messageCount)}
                    </span>
                  </div>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
};

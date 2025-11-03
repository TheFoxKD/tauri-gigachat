import { Component, createSignal, Show } from "solid-js";
import { ConversationsList } from "./ConversationsList";
import { ChatView } from "./ChatView";
import { SettingsModal } from "./SettingsModal";
import { StatusBanner, BannerType } from "./StatusBanner";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSettings,
} from "./icons";

interface AppShellProps {
  username: string;
  onLogout: () => void;
  onStartNewChat: () => void;
  onSubmitMessage: (text: string) => Promise<void>;
  isSubmitting?: boolean;
  streamEnabled: boolean;
  onStreamModeChange: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => Promise<void> | void;
  onRequestNotificationsPermission?: () => Promise<void> | void;
  banner?: { type: BannerType; message: string } | null;
  onDismissBanner?: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar?: () => void;
}

export const AppShell: Component<AppShellProps> = (props) => {
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

  return (
    <div class="shell">
      <aside
        class={`shell__sidebar${props.isSidebarCollapsed ? " shell__sidebar--collapsed" : ""}`}
      >
        <header class="shell__sidebar-header">
          <button
            class="shell__icon-button"
            type="button"
            aria-label={props.isSidebarCollapsed ? "Показать панель" : "Скрыть панель"}
            onClick={() => props.onToggleSidebar?.()}
          >
            {props.isSidebarCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          </button>
          <span class="shell__username" title={props.username}>
            {props.username}
          </span>
          <div class="shell__sidebar-controls">
            <button
              class="shell__icon-button"
              type="button"
              aria-label="Новый чат"
              onClick={props.onStartNewChat}
            >
              <IconPlus size={18} />
            </button>
            <button
              class="shell__icon-button"
              type="button"
              aria-label="Настройки"
              onClick={() => setIsSettingsOpen(true)}
            >
              <IconSettings size={18} />
            </button>
          </div>
        </header>

        <Show when={!props.isSidebarCollapsed}>
          <ConversationsList />

          <button class="shell__logout" type="button" onClick={props.onLogout}>
            Выйти
          </button>
        </Show>
      </aside>

      <main class="shell__main">
        <Show when={props.banner}>
          {(banner) => (
            <StatusBanner
              type={banner().type}
              message={banner().message}
              onClose={props.onDismissBanner}
            />
          )}
        </Show>
        <ChatView
          isSubmitting={props.isSubmitting}
          streamEnabled={props.streamEnabled}
          onSubmitMessage={props.onSubmitMessage}
          onStreamModeChange={props.onStreamModeChange}
        />
      </main>

      <Show when={isSettingsOpen()}>
        <SettingsModal
          username={props.username}
          notificationsEnabled={props.notificationsEnabled}
          onToggleNotifications={props.onToggleNotifications}
          onRequestNotificationsPermission={props.onRequestNotificationsPermission}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={() => {
            setIsSettingsOpen(false);
            props.onLogout();
          }}
        />
      </Show>
    </div>
  );
};

import { createEffect, createSignal, Show, onCleanup, onMount } from "solid-js";
import "./App.css";
import { Login } from "./components/Login";
import type { Credentials } from "./lib/auth";
import { sendJsonRequest, startStreamRequest } from "./lib/api";
import {
  ensureNotificationPermission,
  notifyAssistantReply,
} from "./lib/notifications";
import { authStore } from "./stores/auth";
import { AppShell } from "./components/AppShell";
import { chatStore } from "./stores/chat";
import type { BannerType } from "./components/StatusBanner";

function App() {
  const [isAuthenticating, setIsAuthenticating] = createSignal(false);
  const [loginError, setLoginError] = createSignal<string | undefined>();
  const [isSending, setIsSending] = createSignal(false);
  const [streamEnabled, setStreamEnabled] = createSignal(true);
  const [notificationsEnabled, setNotificationsEnabled] = createSignal(true);
  const [banner, setBanner] = createSignal<{ type: BannerType; message: string } | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  let bannerTimeout: number | undefined;
  const UNAUTHORIZED_MESSAGE = "Неверные логин или пароль";
  const [autoCollapsed, setAutoCollapsed] = createSignal(false);

  const showBanner = (type: BannerType, message: string) => {
    setBanner({ type, message });
    if (bannerTimeout) {
      window.clearTimeout(bannerTimeout);
    }
    bannerTimeout = window.setTimeout(() => setBanner(null), 5000);
  };

  const dismissBanner = () => {
    if (bannerTimeout) {
      window.clearTimeout(bannerTimeout);
      bannerTimeout = undefined;
    }
    setBanner(null);
  };

  const handleLogin = async (submitted: Credentials) => {
    setLoginError(undefined);
    setIsAuthenticating(true);
    authStore.setCredentials(submitted);
    if (notificationsEnabled()) {
      await ensureNotificationPermission().catch(() => undefined);
    }
    setIsAuthenticating(false);
  };

  const handleLogout = (reason?: string) => {
    authStore.clearCredentials();
    chatStore.clearConversations();
    if (reason) {
      setLoginError(reason);
    }
  };

  const handleStartNewChat = () => {
    chatStore.setActiveConversationId(null);
  };

  const handleSubmitMessage = async (text: string) => {
    if (isSending()) {
      return;
    }

    const credentials = authStore.credentials();
    if (!credentials) {
      handleLogout();
      return;
    }

    setIsSending(true);
    try {
      let conversationId = chatStore.activeConversationId();
      const firstLine = text.split("\n")[0];
      const trimmedTitle = firstLine.trim();
      const title = trimmedTitle.length > 60 ? `${trimmedTitle.slice(0, 57)}…` : trimmedTitle;

      const generateConversationId = () =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Date.now().toString(36);

      if (!conversationId) {
        conversationId = `draft_${generateConversationId()}`;
        chatStore.ensureConversation(conversationId, title || "Новый диалог");
        chatStore.setActiveConversationId(conversationId);
      }

      const isDraft = conversationId.startsWith("draft_");

      chatStore.appendUserMessage(conversationId, text, title || undefined);
      chatStore.touchConversation(conversationId);

      const useStream = streamEnabled();
      let finalAssistantText = "";

      if (useStream) {
        chatStore.setIsStreaming(true);
        const assistantMessageId = chatStore.appendAssistantMessage(conversationId, "");
        let accumulated = "";

        try {
          const streamHandle = await startStreamRequest({
            message: text,
            conversationId: isDraft ? undefined : conversationId,
            credentials,
          });

          if (
            isDraft &&
            streamHandle.conversationId &&
            streamHandle.conversationId !== conversationId
          ) {
            chatStore.replaceConversationId(conversationId, streamHandle.conversationId);
            conversationId = streamHandle.conversationId;
          }

          for await (const chunk of streamHandle.stream) {
            accumulated += chunk;
            chatStore.replaceAssistantMessage(conversationId, assistantMessageId, accumulated);
          }

          if (!accumulated.trim()) {
            chatStore.replaceAssistantMessage(
              conversationId,
              assistantMessageId,
              "Ответ не содержит текста.",
            );
          }

          finalAssistantText = accumulated.trim();
        } catch (error) {
          try {
            const fallback = await sendJsonRequest({
              message: text,
              conversationId: isDraft ? undefined : conversationId,
              credentials,
            });

            if (
              isDraft &&
              fallback.conversationId &&
              fallback.conversationId !== conversationId
            ) {
              chatStore.replaceConversationId(conversationId, fallback.conversationId);
              conversationId = fallback.conversationId;
            }

            finalAssistantText = fallback.content.trim();
            chatStore.replaceAssistantMessage(conversationId, assistantMessageId, fallback.content);
          } catch (jsonError) {
            const message =
              jsonError instanceof Error ? jsonError.message : "Не удалось получить ответ.";
            chatStore.replaceAssistantMessage(
              conversationId,
              assistantMessageId,
              accumulated
                ? `${accumulated}

(Ошибка продолжения: ${message})`
                : `Ошибка: ${message}`,
            );

            showBanner("error", message);

            if (message.includes("Неверные логин")) {
              handleLogout(UNAUTHORIZED_MESSAGE);
            }
          }
        } finally {
          chatStore.setIsStreaming(false);
        }
      } else {
        const assistantMessageId = chatStore.appendAssistantMessage(conversationId, "");
        try {
          const response = await sendJsonRequest({
            message: text,
            conversationId: isDraft ? undefined : conversationId,
            credentials,
          });

          if (
            isDraft &&
            response.conversationId &&
            response.conversationId !== conversationId
          ) {
            chatStore.replaceConversationId(conversationId, response.conversationId);
            conversationId = response.conversationId;
          }

          finalAssistantText = response.content.trim();
          const resolvedText = finalAssistantText || "Ответ не содержит текста.";
          chatStore.replaceAssistantMessage(conversationId, assistantMessageId, resolvedText);
          finalAssistantText = resolvedText;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось получить ответ.";
          chatStore.replaceAssistantMessage(
            conversationId,
            assistantMessageId,
            `Ошибка: ${message}`,
          );
          showBanner("error", message);

          if (message.includes("Неверные логин")) {
            handleLogout(UNAUTHORIZED_MESSAGE);
          }
        }
      }

      if (finalAssistantText && notificationsEnabled()) {
        const conversation = chatStore.conversations().get(conversationId);
        const notificationTitle = conversation?.title?.trim().length
          ? conversation!.title
          : "Новый диалог";
        const preview =
          finalAssistantText.length > 120
            ? `${finalAssistantText.slice(0, 117)}…`
            : finalAssistantText;

        await notifyAssistantReply({ title: notificationTitle, body: preview }).catch(
          () => undefined,
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled) {
      await ensureNotificationPermission().catch(() => undefined);
    }
  };

  const handleRequestNotificationsPermission = () => {
    return ensureNotificationPermission();
  };

  const handleStreamModeChange = (enabled: boolean) => {
    setStreamEnabled(enabled);
  };

  const handleToggleSidebar = () => {
    setAutoCollapsed(false);
    setSidebarCollapsed((current) => !current);
  };

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!authStore.isAuthenticated()) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.metaKey && !event.shiftKey && key === "n") {
        event.preventDefault();
        handleStartNewChat();
      }

      if (event.metaKey && !event.shiftKey && key === "b") {
        event.preventDefault();
        handleToggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  createEffect(() => {
    const hasChats = chatStore.conversationList().length > 0;
    if (!hasChats) {
      if (!isSidebarCollapsed()) {
        setSidebarCollapsed(true);
      }
      setAutoCollapsed(true);
    } else if (autoCollapsed()) {
      setSidebarCollapsed(false);
      setAutoCollapsed(false);
    }
  });

  return (
    <div class="app">
      <Show
        when={authStore.isAuthenticated()}
        fallback={
          <Login
            onSubmit={handleLogin}
            isSubmitting={isAuthenticating()}
            error={loginError()}
          />
        }
      >
        <AppShell
          username={authStore.credentials()?.username ?? "Пользователь"}
          onLogout={handleLogout}
          onStartNewChat={handleStartNewChat}
          onSubmitMessage={handleSubmitMessage}
          isSubmitting={isSending()}
          streamEnabled={streamEnabled()}
          onStreamModeChange={handleStreamModeChange}
          notificationsEnabled={notificationsEnabled()}
          onToggleNotifications={handleToggleNotifications}
          onRequestNotificationsPermission={handleRequestNotificationsPermission}
          banner={banner()}
          onDismissBanner={dismissBanner}
          isSidebarCollapsed={isSidebarCollapsed()}
          onToggleSidebar={handleToggleSidebar}
        />
      </Show>
    </div>
  );
}

export default App;

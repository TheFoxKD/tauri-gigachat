import { Component, createSignal } from "solid-js";
import { IconSend } from "./icons";

interface ChatComposerProps {
  placeholder?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  variant?: "inline" | "center";
  streamEnabled?: boolean;
  onStreamModeChange?: (enabled: boolean) => void;
  onSubmit: (text: string) => Promise<void> | void;
}

export const ChatComposer: Component<ChatComposerProps> = (props) => {
  const [value, setValue] = createSignal("");

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (props.isSubmitting) {
      return;
    }

    const text = value().trim();
    if (!text) {
      return;
    }

    setValue("");
    await props.onSubmit(text);
  };

  const handleStreamToggle = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    props.onStreamModeChange?.(target.checked);
  };

  const streamEnabled = () => props.streamEnabled ?? true;

  const handleKeyDown = async (
    event: KeyboardEvent & { currentTarget: HTMLTextAreaElement },
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (props.isSubmitting) {
        return;
      }

      const text = value().trim();
      if (!text) {
        return;
      }

      setValue("");
      await props.onSubmit(text);
    }
  };

  return (
    <form
      class={`composer composer--${props.variant ?? "inline"}`}
      onSubmit={handleSubmit}
    >
      <textarea
        class="composer__input"
        rows={props.variant === "center" ? 4 : 3}
        placeholder={props.placeholder ?? "Введите сообщение"}
        value={value()}
        onInput={(event) => setValue(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        autofocus={props.autoFocus}
        disabled={props.isSubmitting}
      />
      <div class="composer__actions">
        <label class="composer__stream-toggle">
          <input
            type="checkbox"
            checked={streamEnabled()}
            onInput={handleStreamToggle}
            disabled={props.isSubmitting}
          />
          <span>Стримить</span>
        </label>
        <button
          class="composer__submit"
          type="submit"
          disabled={props.isSubmitting || !value().trim()}
          aria-label="Отправить"
        >
          <IconSend size={20} />
        </button>
      </div>
    </form>
  );
};

import { Component, Show } from "solid-js";

export type BannerType = "error" | "info";

export interface StatusBannerProps {
  type: BannerType;
  message: string;
  onClose?: () => void;
}

export const StatusBanner: Component<StatusBannerProps> = (props) => {
  return (
    <div class={`banner banner--${props.type}`} role="status">
      <span class="banner__message">{props.message}</span>
      <Show when={props.onClose}>
        <button class="banner__close" type="button" onClick={props.onClose}>
          Закрыть
        </button>
      </Show>
    </div>
  );
};

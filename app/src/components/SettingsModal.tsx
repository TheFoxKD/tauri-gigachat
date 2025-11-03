import { Component } from "solid-js";

interface SettingsModalProps {
  username: string;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onRequestNotificationsPermission?: () => Promise<void> | void;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  return (
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal__backdrop" onClick={props.onClose} aria-hidden="true" />
      <div class="modal__content">
        <header class="modal__header">
          <div>
            <h2>Настройки</h2>
            <p>Пользователь: {props.username}</p>
          </div>
          <button class="modal__close" type="button" onClick={props.onClose}>
            Закрыть
          </button>
        </header>

        <section class="modal__section">
          <h3>Уведомления</h3>
          <label class="switch">
            <input
              type="checkbox"
              checked={props.notificationsEnabled}
              onInput={async (event) => {
                const enabled = event.currentTarget.checked;
                props.onToggleNotifications(enabled);
                if (enabled && props.onRequestNotificationsPermission) {
                  await props.onRequestNotificationsPermission();
                }
              }}
            />
            <span class="switch__slider" />
          </label>
        </section>

        <section class="modal__section modal__section--danger">
          <button class="modal__logout" type="button" onClick={props.onLogout}>
            Выйти из аккаунта
          </button>
        </section>
      </div>
    </div>
  );
};

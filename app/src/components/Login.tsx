import { Component, createSignal, Show } from "solid-js";
import type { Credentials } from "../lib/auth";

interface LoginProps {
  onSubmit: (credentials: Credentials) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
}

export const Login: Component<LoginProps> = (props) => {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const errorMessage = () => props.error?.trim();

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (props.isSubmitting) {
      return;
    }

    await props.onSubmit({ username: username().trim(), password: password() });
  };

  return (
    <div class="login">
      <div class="login__card">
        <h1 class="login__title">Вход в Giga Chat</h1>
        <form class="login__form" onSubmit={handleSubmit}>
          <label class="login__label">
            <span>Логин</span>
            <input
              class="login__input"
              type="text"
              autocomplete="username"
              required
              value={username()}
              onInput={(event) => setUsername(event.currentTarget.value)}
              placeholder="giga"
            />
          </label>

          <label class="login__label">
            <span>Пароль</span>
            <input
              class="login__input"
              type="password"
              autocomplete="current-password"
              required
              value={password()}
              onInput={(event) => setPassword(event.currentTarget.value)}
              placeholder="top"
            />
          </label>

          <Show when={errorMessage()}>
            <p class="login__error">{errorMessage()}</p>
          </Show>

          <button class="login__submit" type="submit" disabled={props.isSubmitting}>
            {props.isSubmitting ? "Проверяем..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
};

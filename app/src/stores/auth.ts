import { createMemo, createSignal } from "solid-js";
import type { Credentials } from "../lib/auth";
import { authStorage, hasCredentials } from "../lib/auth";

const [credentials, setCredentialsSignal] = createSignal<Credentials | null>(
  authStorage.getCredentials(),
);

const isAuthenticated = createMemo(() => hasCredentials(credentials()));

function setCredentials(credentialsValue: Credentials): void {
  authStorage.setCredentials(credentialsValue);
  setCredentialsSignal({ ...credentialsValue });
}

function clearCredentials(): void {
  authStorage.clear();
  setCredentialsSignal(null);
}

export const authStore = {
  credentials,
  isAuthenticated,
  setCredentials,
  clearCredentials,
};

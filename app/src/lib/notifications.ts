import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

let cachedPermission = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (cachedPermission) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const alreadyGranted = await isPermissionGranted();
  if (alreadyGranted) {
    cachedPermission = true;
    return true;
  }

  const permission = await requestPermission();
  cachedPermission = permission === "granted";
  return cachedPermission;
}

interface AssistantNotificationPayload {
  title: string;
  body: string;
}

export async function notifyAssistantReply(
  payload: AssistantNotificationPayload,
): Promise<void> {
  if (!(await ensureNotificationPermission())) {
    return;
  }

  await sendNotification({
    title: payload.title,
    body: payload.body,
  });
}

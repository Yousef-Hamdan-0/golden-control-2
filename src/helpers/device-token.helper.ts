export const DEVICE_TOKEN_STORAGE_KEY = "golden-control:fcm-device-token";

/** Called later by the FCM setup after Firebase returns a real device token. */
export function saveDeviceToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
}

export function getDeviceToken() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEFAULT_DEVICE_TOKEN ?? "fcm-token-xyz-123";
  }

  return (
    window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY) ??
    process.env.NEXT_PUBLIC_DEFAULT_DEVICE_TOKEN ??
    "fcm-token-xyz-123"
  );
}

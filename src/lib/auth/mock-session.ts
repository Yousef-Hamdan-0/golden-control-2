export const MOCK_SESSION_KEY = "golden-control:mock-session";

export type MockSession = {
  email: string;
  name: string;
  role: "Admin";
  signedInAt: string;
};

export function createMockSession(email: string): MockSession {
  return {
    email,
    name: email.split("@")[0] || "مدير النظام",
    role: "Admin",
    signedInAt: new Date().toISOString(),
  };
}

export function readMockSession(): MockSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored =
    window.localStorage.getItem(MOCK_SESSION_KEY) ??
    window.sessionStorage.getItem(MOCK_SESSION_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as MockSession;
  } catch {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
    window.sessionStorage.removeItem(MOCK_SESSION_KEY);
    return null;
  }
}

export function writeMockSession(session: MockSession, remember: boolean) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(MOCK_SESSION_KEY);
  storage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
}

export function clearMockSession() {
  window.localStorage.removeItem(MOCK_SESSION_KEY);
  window.sessionStorage.removeItem(MOCK_SESSION_KEY);
}

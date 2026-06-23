"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/lib/icons";

type ToastTone = "success" | "error";

interface ToastMessage {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLES: Record<
  ToastTone,
  { border: string; iconWrap: string; icon: IconName }
> = {
  success: {
    border: "border-success/30",
    iconWrap: "bg-success-soft text-success",
    icon: "users",
  },
  error: {
    border: "border-danger/30",
    iconWrap: "bg-danger-soft text-danger",
    icon: "alert",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (tone: ToastTone, title: string, message: string) => {
      const id = ++nextId.current;
      setMessages((current) => [...current, { id, tone, title, message }]);
      const timer = window.setTimeout(() => dismiss(id), 5_000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const success = useCallback(
    (title: string, message: string) => show("success", title, message),
    [show],
  );
  const error = useCallback(
    (title: string, message: string) => show("error", title, message),
    [show],
  );
  const api = useMemo<ToastApi>(() => ({ success, error }), [success, error]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        dir="rtl"
        className="pointer-events-none fixed bottom-5 left-5 z-[200] flex w-[min(92vw,420px)] flex-col gap-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((toast) => {
          const styles = TONE_STYLES[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-3 rounded-md border ${styles.border} bg-surface p-4 text-right shadow-[0_14px_40px_rgba(15,23,42,0.16)]`}
            >
              <span className={`shrink-0 rounded-md p-2 ${styles.iconWrap}`}>
                <Icon name={styles.icon} size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-bold text-content">
                  {toast.title}
                </span>
                <span className="mt-1 block whitespace-pre-line text-xs leading-6 text-content-muted">
                  {toast.message}
                </span>
              </span>
              <button
                type="button"
                aria-label="إغلاق الإشعار"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-sm p-1 text-content-muted transition hover:bg-surface-2 hover:text-content"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

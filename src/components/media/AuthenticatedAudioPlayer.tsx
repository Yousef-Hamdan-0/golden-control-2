"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/config/api-endpoints";
import { requestAuthenticatedBlob } from "@/helpers/authenticated-api.helper";

function canUseDirectly(url: string) {
  return /^(?:data:|blob:)/i.test(url);
}

function shouldUseBackendProxy(url: string) {
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("/")) return true;

  try {
    return new URL(url).origin === new URL(API_BASE_URL).origin;
  } catch {
    return false;
  }
}

function proxiedAudioUrl(url: string) {
  return `/api/request/records/media?${new URLSearchParams({ url })}`;
}

export function AuthenticatedAudioPlayer({ url }: { url: string }) {
  const normalizedUrl = useMemo(() => url.trim(), [url]);
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    normalizedUrl ? "loading" : "error",
  );

  useEffect(() => {
    if (!normalizedUrl) {
      setAudioUrl("");
      setStatus("error");
      return;
    }

    if (canUseDirectly(normalizedUrl) || !shouldUseBackendProxy(normalizedUrl)) {
      setAudioUrl(normalizedUrl);
      setStatus("ready");
      return;
    }

    let objectUrl = "";
    let cancelled = false;

    setStatus("loading");
    setAudioUrl("");

    requestAuthenticatedBlob(proxiedAudioUrl(normalizedUrl), {
      method: "GET",
      headers: { Accept: "audio/*" },
    })
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [normalizedUrl]);

  if (status === "loading") {
    return <div className="text-sm text-content-muted">جاري تجهيز التسجيل الصوتي...</div>;
  }

  if (status === "error" || !audioUrl) {
    return <div className="text-sm text-danger">تعذر تشغيل التسجيل الصوتي.</div>;
  }

  return <audio controls preload="none" src={audioUrl} className="h-10 w-full" />;
}

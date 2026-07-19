"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/config/api-endpoints";
import { requestAuthenticatedBlob } from "@/helpers/authenticated-api.helper";

/**
 * `.m4a` files are MPEG-4 audio and are sometimes served as `audio/x-m4a`,
 * which several browsers refuse to play. For those we hint `audio/mp4`. For
 * everything else (e.g. `.mp3`) we leave the `<source>` without a type so the
 * browser detects it from the file's Content-Type instead of a possibly wrong
 * hint from the API.
 */
function sourceType(mimeType: string | undefined, url: string): string | undefined {
  const lowered = (mimeType ?? "").toLowerCase();
  if (lowered.includes("m4a") || /\.m4a(?:$|\?)/i.test(url)) return "audio/mp4";
  return undefined;
}

function canUseDirectly(url: string) {
  return /^(?:data:|blob:)/i.test(url);
}

/** Backend-hosted files need the Bearer token, so they go through the authenticated proxy. */
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

export function AuthenticatedAudioPlayer({
  url,
  mimeType,
}: {
  url: string;
  mimeType?: string;
}) {
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

  const type = sourceType(mimeType, normalizedUrl);

  return (
    <audio key={audioUrl} controls preload="metadata" className="h-10 w-full">
      <source src={audioUrl} type={type} />
    </audio>
  );
}

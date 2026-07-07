"use client";

import { useMemo, useState } from "react";

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

export function AuthenticatedAudioPlayer({
  url,
  mimeType,
}: {
  url: string;
  mimeType?: string;
}) {
  const src = useMemo(() => url.trim(), [url]);
  const type = useMemo(() => sourceType(mimeType, src), [mimeType, src]);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="text-sm text-danger">تعذر تشغيل التسجيل الصوتي.</div>;
  }

  // Native controls give play/pause and a progress bar; `preload="metadata"`
  // loads the duration. The file is served directly from the backend domain.
  return (
    <audio
      key={src}
      controls
      preload="metadata"
      className="h-10 w-full"
      onError={() => setFailed(true)}
    >
      <source src={src} type={type} />
    </audio>
  );
}

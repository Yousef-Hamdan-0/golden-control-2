"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { API_BASE_URL } from "@/config/api-endpoints";

const FALLBACK_LOGO = "/brand/al-khubara-logo-transparent.png";

// Resolved once per session so the logo isn't re-fetched on every mount
// (this component renders in the sidebar on every page).
let cachedLogoUrl: string | null = null;

function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

function settingsLogoUrl(payload: unknown) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return undefined;
  }
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const record =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : root;
  return typeof record.logoPath === "string" ? mediaUrl(record.logoPath) : undefined;
}

export function BackendLogo({
  alt = "AL-KHUBARA COMPANY",
  className,
}: {
  alt?: string;
  className?: string;
}) {
  const [src, setSrc] = useState(cachedLogoUrl ?? FALLBACK_LOGO);

  useEffect(() => {
    // Already resolved earlier in this session — skip the network round-trip.
    if (cachedLogoUrl) return;

    let active = true;

    fetch(`${API_BASE_URL}/api/settings`, {
      headers: { Accept: "application/json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const logoUrl = settingsLogoUrl(payload);
        if (logoUrl) {
          cachedLogoUrl = logoUrl;
          if (active) setSrc(logoUrl);
        }
      })
      .catch(() => {
        if (active) setSrc(FALLBACK_LOGO);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Image
      src={src}
      alt={alt}
      width={240}
      height={160}
      unoptimized
      className={className}
      onError={() => setSrc(FALLBACK_LOGO)}
    />
  );
}

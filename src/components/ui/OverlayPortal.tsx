"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface OverlayPortalProps {
  children: ReactNode;
  lockScroll?: boolean;
}

export function OverlayPortal({ children, lockScroll = true }: OverlayPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !lockScroll) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lockScroll, mounted]);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

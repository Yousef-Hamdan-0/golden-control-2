"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OverlayPortal } from "@/components/ui/OverlayPortal";

interface ModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  widthClassName?: string;
}

export function Modal({
  title,
  description,
  children,
  onClose,
  widthClassName = "max-w-3xl",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <OverlayPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-[100] flex h-dvh min-h-dvh w-dvw items-center justify-center overflow-y-auto overscroll-contain bg-black/60 px-4 py-6"
      >
        <Card className={`max-h-[calc(100dvh-3rem)] w-full overflow-y-auto ${widthClassName}`}>
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="text-right">
              <h2 id="modal-title" className="font-heading text-xl font-bold text-content">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm text-content-muted">{description}</p>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          </div>
          {children}
        </Card>
      </div>
    </OverlayPortal>
  );
}

import Image from "next/image";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

const SIZE_STYLES = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-24 w-24",
} as const;

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string;
  size?: keyof typeof SIZE_STYLES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-gold-soft text-gold",
        SIZE_STYLES[size],
        className,
      )}
      aria-label={`صورة ${name}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`صورة ${name}`}
          fill
          sizes={size === "lg" ? "96px" : size === "md" ? "56px" : "36px"}
          className="object-cover"
          unoptimized
        />
      ) : (
        <Icon name="user" size={size === "lg" ? 34 : size === "md" ? 23 : 17} />
      )}
    </span>
  );
}

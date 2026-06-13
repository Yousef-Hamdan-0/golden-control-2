import type { SVGProps } from "react";

export type IconName =
  | "shield"
  | "user"
  | "users"
  | "wrench"
  | "clipboard"
  | "box"
  | "file"
  | "wallet"
  | "chart"
  | "gear"
  | "logout"
  | "moon"
  | "sun"
  | "plus"
  | "pencil"
  | "trash"
  | "eye"
  | "eye-off"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "calendar"
  | "clock"
  | "phone"
  | "home"
  | "alert"
  | "arrow-left"
  | "menu"
  | "x";

const PATHS: Record<IconName, string> = {
  shield: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  users:
    "M16 14a4 4 0 10-8 0M12 7a3 3 0 100 6 3 3 0 000-6zM20 14a3 3 0 00-3-3M4 14a3 3 0 013-3",
  wrench:
    "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z",
  clipboard:
    "M9 4h6v2H9zM8 4H6v16h12V4h-2M9 11h6M9 15h6",
  box: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10",
  file: "M7 3h7l5 5v13H7zM14 3v5h5",
  wallet: "M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H4a1 1 0 01-1-1V7zM16 12h3",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  gear: "M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-1-3-2 .5a7 7 0 00-1.5-1.5L18 5l-3-1-1 2a7 7 0 00-2 0L11 4 8 5l.5 2A7 7 0 007 8.5L5 8 4 11l2 1a7 7 0 000 2l-2 1 1 3 2-.5A7 7 0 008.5 21L8 23l3 1 1-2a7 7 0 002 0l1 2 3-1-.5-2a7 7 0 001.5-1.5l2 .5 1-3-2-1a7 7 0 000-2z",
  logout: "M14 8V6a2 2 0 00-2-2H5v16h7a2 2 0 002-2v-2M10 12h11M18 9l3 3-3 3",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v3M12 20v3M4 4l2 2M18 18l2 2M1 12h3M20 12h3M4 20l2-2M18 6l2-2",
  plus: "M12 5v14M5 12h14",
  pencil: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z",
  "eye-off": "M2 12s4-7 10-7a9 9 0 014 1M22 12s-4 7-10 7a9 9 0 01-4-1M3 3l18 18M9.9 9.9a3 3 0 004.2 4.2",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-left": "M15 18l-6-6 6-6",
  "chevron-right": "M9 18l6-6-6-6",
  calendar: "M7 3v3M17 3v3M4 8h16M4 6h16v15H4zM4 6a0 0 0 010 0",
  clock: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  phone:
    "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  alert: "M12 8v5M12 16h.01M12 3a9 9 0 100 18 9 9 0 000-18z",
  "arrow-left": "M19 12H5M12 19l-7-7 7-7",
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M6 6l12 12M18 6L6 18",
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

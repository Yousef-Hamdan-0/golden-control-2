import { SplashScreen } from "@/components/feedback/SplashScreen";

/**
 * Root suspense fallback for the App Router.
 * Shown while the initial route segment streams in.
 * Reuses the same SplashScreen so the boot experience is identical everywhere.
 */
export default function Loading() {
  return <SplashScreen />;
}

import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "تسجيل الدخول | مركز الصيانة الذهبي",
};

export default function LoginPage() {
  return <LoginScreen />;
}

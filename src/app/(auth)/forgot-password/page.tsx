import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور | مركز الصيانة الذهبي",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}

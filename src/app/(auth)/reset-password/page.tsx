import type { Metadata } from "next";
import { ResetPasswordScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "إعادة تعيين كلمة المرور | مركز الصيانة الذهبي",
};

export default function ResetPasswordPage() {
  return <ResetPasswordScreen />;
}

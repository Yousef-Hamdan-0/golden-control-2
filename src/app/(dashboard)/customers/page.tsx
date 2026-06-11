import type { Metadata } from "next";
import { CustomersScreen } from "@/features/customers/components/CustomersScreen";

export const metadata: Metadata = {
  title: "إدارة العملاء | مركز الصيانة الذهبي",
};

export default function CustomersPage() {
  return <CustomersScreen />;
}

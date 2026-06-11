import { Suspense } from "react";
import { UserManagementScreen } from "@/features/users";

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementScreen />
    </Suspense>
  );
}

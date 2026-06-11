"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserForm } from "@/features/users";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";

export default function NewUserPage() {
  const router = useRouter();
  const { create } = useUserMutations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="إنشاء مستخدم جديد"
        subtitle="بيانات الحساب الجديد"
        align="end"
      />
      <UserForm
        mode="create"
        submitting={create.isPending}
        onCancel={() => router.push("/settings/users")}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => router.push("/settings/users"),
          })
        }
      />
    </div>
  );
}

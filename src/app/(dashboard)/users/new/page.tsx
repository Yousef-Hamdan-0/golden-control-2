"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { UserForm } from "@/features/users";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";

export default function NewUserPage() {
  const router = useRouter();
  const toast = useToast();
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
        submitError={create.error ? getApiErrorMessage(create.error) : undefined}
        onCancel={() => router.push("/users")}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.success(
                "تم إنشاء المستخدم",
                `تمت إضافة ${input.fullName} إلى جدول المستخدمين بنجاح.`,
              );
              router.push(`/users?role=${input.role}&isActive=true`);
            },
            onError: (error) =>
              toast.error("تعذر إنشاء المستخدم", getApiErrorMessage(error)),
          })
        }
      />
    </div>
  );
}

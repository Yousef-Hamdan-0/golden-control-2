"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { UserForm } from "@/features/users";
import { useUserQuery } from "@/features/users/hooks/use-users-query";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";

export default function EditUserPage({ params }: { params: { userId: string } }) {
  const userId = decodeURIComponent(params.userId);
  const router = useRouter();
  const { data: user, isLoading } = useUserQuery(userId);
  const { update } = useUserMutations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="تعديل الملف الشخصي"
        subtitle="تحديث بيانات المستخدم وكلمة المرور والتحكم في صلاحيات الوصول الخاصة به."
      />
      {isLoading || !user ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <UserForm
          mode="edit"
          user={user}
          submitting={update.isPending}
          onCancel={() => router.push(`/settings/users/${encodeURIComponent(userId)}`)}
          onSubmit={(input) =>
            update.mutate(
              { id: userId, input },
              { onSuccess: () => router.push(`/settings/users/${encodeURIComponent(userId)}`) },
            )
          }
        />
      )}
    </div>
  );
}

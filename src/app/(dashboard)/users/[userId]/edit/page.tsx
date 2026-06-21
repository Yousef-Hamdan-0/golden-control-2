"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { UserForm } from "@/features/users";
import { useUserQuery } from "@/features/users/hooks/use-users-query";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";

export default function EditUserPage() {
  const params = useParams<{ userId: string }>();
  const userId = decodeURIComponent(params.userId);
  const router = useRouter();
  const toast = useToast();
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
          submitError={update.error ? getApiErrorMessage(update.error) : undefined}
          onCancel={() => router.push(`/users/${encodeURIComponent(userId)}`)}
          onSubmit={(input) =>
            update.mutate(
              { id: userId, input },
              {
                onSuccess: () => {
                  toast.success("تم تحديث المستخدم", "تم حفظ بيانات المستخدم بنجاح.");
                  router.push(`/users/${encodeURIComponent(userId)}`);
                },
                onError: (error) =>
                  toast.error("تعذر تحديث المستخدم", getApiErrorMessage(error)),
              },
            )
          }
        />
      )}
    </div>
  );
}

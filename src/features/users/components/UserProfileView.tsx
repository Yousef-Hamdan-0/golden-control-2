"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/lib/format/currency";
import {
  ROLE_LABELS_AR,
  STATUS_LABELS_AR,
  type User,
} from "@/models/auth/user.model";
import { useUserQuery } from "@/features/users/hooks/use-users-query";
import { UserAvatar } from "@/features/users/components/UserAvatar";

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-content-muted">{label}</span>
      <div className="h-11 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-content">
        {value}
      </div>
    </div>
  );
}

export function UserProfileView({
  userId,
  user,
  onEdit,
}: {
  userId?: string;
  user?: User;
  onEdit?: (user: User) => void;
}) {
  const router = useRouter();
  const { data: queriedUser, isLoading, isError } = useUserQuery(userId ?? "");
  const currentUser = user ?? queriedUser;

  if (!user && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (isError || !currentUser) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger-soft p-6 text-center text-sm text-danger">
        تعذّر العثور على المستخدم.
      </div>
    );
  }

  const u = currentUser as User;

  return (
    <div className="space-y-4">
      <Button onClick={() => (onEdit ? onEdit(u) : router.push(`/settings/users/${encodeURIComponent(u.id)}/edit`))}>
        تعديل البيانات
      </Button>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <UserAvatar name={u.fullName} imageUrl={u.imageUrl} size="lg" />
          <div>
            <h2 className="font-heading text-xl font-bold text-content">{u.fullName}</h2>
            <p className="mt-1 text-sm text-content-muted">{u.jobTitle}</p>
            <p className="mt-1 text-xs text-gold">{u.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReadField label="الاسم بالكامل" value={u.fullName} />
          <ReadField label="البريد الإلكتروني" value={u.email} />
          <ReadField label="المسمى الوظيفي" value={u.jobTitle} />
          <ReadField label="رقم الهاتف" value={u.phone} />
          <ReadField label="الدور / الصلاحية" value={ROLE_LABELS_AR[u.role]} />
          <ReadField label="الراتب الشهري" value={formatMoney(u.salary)} />
        </div>
        <div className="border-t border-border pt-4">
          <div className="mb-2 text-sm text-content-muted">حالة المستخدم</div>
          <Badge tone={u.status === "available" ? "success" : "danger"}>
            {STATUS_LABELS_AR[u.status]}
          </Badge>
        </div>
      </Card>
    </div>
  );
}

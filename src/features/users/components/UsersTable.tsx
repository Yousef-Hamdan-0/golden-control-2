"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { SkeletonRow } from "@/components/ui/Spinner";
import { Icon } from "@/lib/icons";
import {
  ROLE_LABELS_AR,
  STATUS_LABELS_AR,
  type User,
} from "@/models/auth/user.model";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";
import { UserAvatar } from "@/features/users/components/UserAvatar";

interface Props {
  users: User[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
}

const HEADERS = ["المعرف", "الاسم", "البريد الإلكتروني", "رقم الهاتف", "الدور", "الحالة", "الإجراءات"];

function StatusBadge({ status }: { status: User["status"] }) {
  return (
    <Badge tone={status === "available" ? "success" : "danger"} dot>
      {STATUS_LABELS_AR[status]}
    </Badge>
  );
}

function RowActions({
  user,
  onView,
  onEdit,
}: {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
}) {
  const { remove } = useUserMutations();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="flex items-center justify-start gap-2" dir="rtl">
        <button
          type="button"
          aria-label="عرض"
          onClick={() => onView(user)}
          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
        >
          <Icon name="eye" size={18} />
        </button>
        <button
          type="button"
          aria-label="تعديل"
          onClick={() => onEdit(user)}
          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
        >
          <Icon name="pencil" size={18} />
        </button>
        <button
          type="button"
          aria-label="حذف"
          onClick={() => setConfirmDelete(true)}
          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
        >
          <Icon name="trash" size={18} />
        </button>
      </div>
      {confirmDelete ? (
        <ConfirmToast
          title="تأكيد حذف المستخدم"
          message={`هل تريد حذف المستخدم ${user.fullName}؟ لا يمكن التراجع عن هذه العملية.`}
          isLoading={remove.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            remove.mutate(user.id, {
              onSuccess: () => setConfirmDelete(false),
            })
          }
        />
      ) : null}
    </>
  );
}

export function UsersTable({ users, isLoading, total, page, pageSize, onPage, onView, onEdit }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <Card className="overflow-hidden">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-surface-2 text-content-muted">
              {HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} />)
              : users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-medium text-gold">
                      <button type="button" onClick={() => onView(u)} className="font-medium text-gold hover:text-gold-hover">
                        {u.id}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-content">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={u.fullName} imageUrl={u.imageUrl} size="sm" />
                        <span>{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{u.email}</td>
                    <td className="px-4 py-4 text-content-muted" dir="ltr">
                      {u.phone}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="neutral">{ROLE_LABELS_AR[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-4">
                      <RowActions user={u} onView={onView} onEdit={onEdit} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {!isLoading &&
          users.map((u) => (
            <div key={u.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => onView(u)} className="font-medium text-gold hover:text-gold-hover">
                  {u.id}
                </button>
                <StatusBadge status={u.status} />
              </div>
              <div className="flex items-center justify-start gap-2.5 text-right text-content">
                <UserAvatar name={u.fullName} imageUrl={u.imageUrl} size="sm" />
                <span>{u.fullName}</span>
              </div>
              <div className="text-right text-sm text-content-muted">{u.email}</div>
              <div className="text-right text-sm text-content-muted" dir="ltr">
                {u.phone}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Badge tone="neutral">{ROLE_LABELS_AR[u.role]}</Badge>
                <RowActions user={u} onView={onView} onEdit={onEdit} />
              </div>
            </div>
          ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-content-muted">
        <span>
          عرض {start}-{end} من أصل {total} مستخدم
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="السابق"
          >
            <Icon name="chevron-right" size={16} />
          </Button>
          {Array.from({ length: pages }).map((_, i) => {
            const p = i + 1;
            return (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "primary" : "outline"}
                className="h-8 w-8 px-0"
                onClick={() => onPage(p)}
              >
                {p}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
            aria-label="التالي"
          >
            <Icon name="chevron-left" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

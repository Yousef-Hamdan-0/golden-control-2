"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import { PAGE_SIZE } from "@/config/constants";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { UserFilters, type RoleFilter, type StatusFilter } from "@/features/users/components/UserFilters";
import { UsersTable } from "@/features/users/components/UsersTable";
import { UserKpiCards } from "@/features/users/components/UserKpiCards";
import { UserForm } from "@/features/users/components/UserForm";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";
import type { UserCreateInput } from "@/models/users/user-create.schema";

export function UserManagementScreen() {
  const params = useSearchParams();
  const initialRole = (params.get("role") as RoleFilter) || "all";

  const [role, setRole] = useState<RoleFilter>(initialRole);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { create } = useUserMutations();

  // role + status are in the query key → changing a filter refetches that slice.
  const { data, isLoading, isError, refetch } = useUsersQuery({
    role,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const resetPageThen = <T,>(setter: (v: T) => void) => (v: T) => {
    setPage(1);
    setter(v);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-right font-heading text-xl font-bold text-gold">إدارة المستخدمين</h2>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <UserFilters
            role={role}
            status={status}
            onRole={resetPageThen(setRole)}
            onStatus={resetPageThen(setStatus)}
          />
          <Button className="shrink-0" onClick={() => setShowCreateModal(true)}>
            <Icon name="plus" size={18} />
            مستخدم جديد
          </Button>
        </div>
      </div>

      {showCreateModal ? (
        <Modal
          title="إنشاء مستخدم جديد"
          description="إضافة مستخدم وهمي إلى نظام الصلاحيات."
          onClose={() => setShowCreateModal(false)}
          widthClassName="max-w-5xl"
        >
          <div className="p-5">
            <UserForm
              mode="create"
              submitting={create.isPending}
              onCancel={() => setShowCreateModal(false)}
              onSubmit={(input: UserCreateInput) =>
                create.mutate(input, { onSuccess: () => setShowCreateModal(false) })
              }
            />
          </div>
        </Modal>
      ) : null}

      {/* Table */}
      {isError ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft p-6 text-center text-sm text-danger">
          تعذّر تحميل المستخدمين.{" "}
          <button onClick={() => refetch()} className="underline">
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <UsersTable
          users={data?.items ?? []}
          isLoading={isLoading}
          total={data?.total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      )}

      {/* KPI cards */}
      <UserKpiCards />
    </div>
  );
}

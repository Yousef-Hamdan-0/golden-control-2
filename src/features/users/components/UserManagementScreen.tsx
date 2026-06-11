"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/lib/icons";
import { PAGE_SIZE } from "@/config/constants";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { UserFilters, type RoleFilter, type StatusFilter } from "@/features/users/components/UserFilters";
import { UsersTable } from "@/features/users/components/UsersTable";
import { UserKpiCards } from "@/features/users/components/UserKpiCards";

export function UserManagementScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as RoleFilter) || "all";

  const [role, setRole] = useState<RoleFilter>(initialRole);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center justify-end gap-6">
          <UserFilters
            role={role}
            status={status}
            onRole={resetPageThen(setRole)}
            onStatus={resetPageThen(setStatus)}
          />
          <h2 className="font-heading text-xl font-bold text-gold">إدارة المستخدمين</h2>
        </div>
        <Button onClick={() => router.push("/settings/users/new")}>
          <Icon name="plus" size={18} />
          مستخدم جديد
        </Button>
      </div>

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

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/lib/icons";
import { PAGE_SIZE } from "@/config/constants";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { UserFilters, type RoleFilter, type StatusFilter } from "@/features/users/components/UserFilters";
import { UsersTable } from "@/features/users/components/UsersTable";
import { UserKpiCards } from "@/features/users/components/UserKpiCards";
import { UserForm } from "@/features/users/components/UserForm";
import { UserProfileView } from "@/features/users/components/UserProfileView";
import { useUserMutations } from "@/features/users/hooks/use-user-mutations";
import { RoleSchema, type User } from "@/models/auth/user.model";
import type { UserCreateInput } from "@/models/users/user-create.schema";
import type { UserUpdateInput } from "@/models/users/user-update.schema";

function statusFromParam(value: string | null): StatusFilter {
  if (value === "false") return "unavailable";
  if (value === "all") return "all";
  return "available";
}

function usersUrl(role: RoleFilter, status: StatusFilter) {
  const query = new URLSearchParams();
  query.set("role", role);
  query.set(
    "isActive",
    status === "available" ? "true" : status === "unavailable" ? "false" : "all",
  );
  return `/users?${query}`;
}

export function UserManagementScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const activeParam = params.get("isActive");
  const parsedRole = RoleSchema.safeParse(roleParam);
  const initialRole: RoleFilter = parsedRole.success ? parsedRole.data : "all";

  const [role, setRole] = useState<RoleFilter>(initialRole);
  const [status, setStatus] = useState<StatusFilter>(statusFromParam(activeParam));
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { create, update } = useUserMutations();

  useEffect(() => {
    const nextRole = RoleSchema.safeParse(roleParam);
    setRole(nextRole.success ? nextRole.data : "all");
    setStatus(statusFromParam(activeParam));
    setPage(1);
  }, [activeParam, roleParam]);

  // role + status are in the query key → changing a filter refetches that slice.
  const { data, error: listError, isLoading, isError, refetch } = useUsersQuery({
    role,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (isError && listError) {
      toast.error("تعذر تحميل المستخدمين", getApiErrorMessage(listError));
    }
  }, [isError, listError, toast]);

  function handleRoleChange(nextRole: RoleFilter) {
    setPage(1);
    setRole(nextRole);
    router.replace(usersUrl(nextRole, status));
  }

  function handleStatusChange(nextStatus: StatusFilter) {
    setPage(1);
    setStatus(nextStatus);
    router.replace(usersUrl(role, nextStatus));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-right font-heading text-xl font-bold text-gold">إدارة المستخدمين</h2>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <UserFilters
            role={role}
            status={status}
            onRole={handleRoleChange}
            onStatus={handleStatusChange}
          />
          <Button
            className="shrink-0"
            onClick={() => {
              create.reset();
              setShowCreateModal(true);
            }}
          >
            <Icon name="plus" size={18} />
            مستخدم جديد
          </Button>
        </div>
      </div>

      {showCreateModal ? (
        <Modal
          title="إنشاء مستخدم جديد"
          description="إضافة مستخدم جديد إلى نظام الصلاحيات."
          onClose={() => setShowCreateModal(false)}
          widthClassName="max-w-5xl"
        >
          <div className="p-5">
            <UserForm
              mode="create"
              defaultRole={role === "all" ? "employee" : role}
              submitting={create.isPending}
              submitError={create.error ? getApiErrorMessage(create.error) : undefined}
              onCancel={() => setShowCreateModal(false)}
              onSubmit={(input: UserCreateInput) =>
                create.mutate(input, {
                  onSuccess: () => {
                    setRole(input.role);
                    setStatus("available");
                    setPage(1);
                    setShowCreateModal(false);
                    router.replace(usersUrl(input.role, "available"));
                    toast.success(
                      "تم إنشاء المستخدم",
                      `تمت إضافة ${input.fullName} إلى جدول المستخدمين بنجاح.`,
                    );
                  },
                  onError: (error) =>
                    toast.error("تعذر إنشاء المستخدم", getApiErrorMessage(error)),
                })
              }
            />
          </div>
        </Modal>
      ) : null}
      {viewingUser ? (
        <Modal
          title="تفاصيل الملف الشخصي"
          description="عرض بيانات المستخدم وصلاحياته وحالته داخل النظام."
          onClose={() => setViewingUser(null)}
          widthClassName="max-w-4xl"
        >
          <div className="p-5">
            <UserProfileView
              user={viewingUser}
              onEdit={(user) => {
                setViewingUser(null);
                setEditingUser(user);
              }}
            />
          </div>
        </Modal>
      ) : null}
      {editingUser ? (
        <Modal
          title="تعديل المستخدم"
          description="تحديث بيانات المستخدم وصلاحياته وحالته."
          onClose={() => setEditingUser(null)}
          widthClassName="max-w-5xl"
        >
          <div className="p-5">
            <UserForm
              mode="edit"
              user={editingUser}
              submitting={update.isPending}
              submitError={update.error ? getApiErrorMessage(update.error) : undefined}
              onCancel={() => setEditingUser(null)}
              onSubmit={(input: UserUpdateInput) =>
                update.mutate(
                  { id: editingUser.id, input },
                  {
                    onSuccess: () => {
                      setEditingUser(null);
                      toast.success(
                        "تم تحديث المستخدم",
                        `تم حفظ تعديلات ${input.fullName} بنجاح.`,
                      );
                    },
                    onError: (error) =>
                      toast.error("تعذر تحديث المستخدم", getApiErrorMessage(error)),
                  },
                )
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
          onView={setViewingUser}
          onEdit={setEditingUser}
        />
      )}

      {/* KPI cards */}
      <UserKpiCards />
    </div>
  );
}

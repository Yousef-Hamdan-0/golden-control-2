"use client";

import { Select } from "@/components/ui/Select";
import { ROLE_LABELS_AR, STATUS_LABELS_AR, type Role, type UserStatus } from "@/models/auth/user.model";

export type RoleFilter = Role | "all";
export type StatusFilter = UserStatus | "all";

interface Props {
  role: RoleFilter;
  status: StatusFilter;
  onRole: (r: RoleFilter) => void;
  onStatus: (s: StatusFilter) => void;
}

export function UserFilters({ role, status, onRole, onStatus }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-content-muted">الدور</label>
        <div className="w-44">
          <Select value={role} onChange={(e) => onRole(e.target.value as RoleFilter)}>
            <option value="all">الكل</option>
            {(Object.keys(ROLE_LABELS_AR) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS_AR[r]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-content-muted">الحالة</label>
        <div className="w-44">
          <Select value={status} onChange={(e) => onStatus(e.target.value as StatusFilter)}>
            <option value="all">الكل</option>
            {(Object.keys(STATUS_LABELS_AR) as UserStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS_AR[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}

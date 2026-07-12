"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/lib/icons";
import { useUsersAllQuery } from "@/features/users/hooks/use-users-query";
import type { RepairRequest } from "@/models/requests/request.model";

/**
 * Bulk "assign to technician" popup: lists the selected requests (request
 * number + customer name only) and a technician picker. The actual API call
 * (POST /api/requests/assign-bulk) is triggered by the screen via onAssign.
 */
export function AssignTechnicianModal({
  requests,
  onClose,
  onAssign,
  submitting = false,
  submitError,
}: {
  requests: RepairRequest[];
  onClose: () => void;
  onAssign: (technicianId: string) => void;
  submitting?: boolean;
  submitError?: string;
}) {
  const [technicianId, setTechnicianId] = useState("");
  // Same technician source used by the request form modal.
  const { data: technicians = [] } = useUsersAllQuery(
    { role: "technician", status: "available" },
    true,
  );

  return (
    <Modal
      title="إسناد إلى فني"
      description="سيصبح الفني المختار مسؤولاً عن كل الطلبات المحددة أدناه."
      onClose={onClose}
      widthClassName="max-w-lg"
    >
      <div className="space-y-5 p-5">
        <div className="rounded-md border border-border">
          <div className="border-b border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-content">
            الطلبات المحددة ({requests.length})
          </div>
          <ul className="max-h-64 divide-y divide-border overflow-y-auto">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="font-bold text-gold" dir="ltr">
                  {request.requestNumber}
                </span>
                <span className="text-content">{request.customer.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <Field label="الفني" htmlFor="bulk-assign-technician">
          <Select
            id="bulk-assign-technician"
            value={technicianId}
            disabled={submitting}
            onChange={(event) => setTechnicianId(event.target.value)}
          >
            <option value="" disabled>
              اختر الفني…
            </option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.fullName}
              </option>
            ))}
          </Select>
        </Field>

        {submitError ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={!technicianId || submitting}
            onClick={() => onAssign(technicianId)}
          >
            <Icon name="wrench" size={17} />
            {submitting ? "جاري الإسناد..." : "إسناد"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

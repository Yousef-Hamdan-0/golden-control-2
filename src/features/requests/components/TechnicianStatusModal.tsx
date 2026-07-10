"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { useRequestMutations } from "@/features/requests/hooks/use-requests";
import {
  REQUEST_STATUS_OPTIONS,
  type RepairRequest,
  type RepairRequestStatus,
} from "@/models/requests/request.model";

/**
 * Technician-only status update: the matrix denies technicians PATCH
 * /requests/:id, so this goes through PUT /technician/requests/:id/status.
 */
export function TechnicianStatusModal({
  request,
  onClose,
}: {
  request: RepairRequest;
  onClose: () => void;
}) {
  const toast = useToast();
  const { updateStatus } = useRequestMutations();
  const [status, setStatus] = useState<RepairRequestStatus>(request.status);

  function submit() {
    updateStatus.mutate(
      { id: request.id, status },
      {
        onSuccess: () => {
          onClose();
          toast.success("تم تحديث الحالة", `تم تحديث حالة الطلب ${request.requestNumber}.`);
        },
        onError: (error) => toast.error("تعذر تحديث الحالة", getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Modal
      title="تحديث حالة الطلب"
      description={`تغيير حالة الطلب ${request.requestNumber}.`}
      onClose={onClose}
      widthClassName="max-w-md"
    >
      <div className="space-y-4 p-5">
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as RepairRequestStatus)}
          aria-label="حالة الطلب"
        >
          {REQUEST_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {updateStatus.error ? (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {getApiErrorMessage(updateStatus.error)}
          </div>
        ) : null}

        <div className="flex items-center justify-start gap-2">
          <Button type="button" onClick={submit} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? "جار الحفظ..." : "حفظ الحالة"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </Modal>
  );
}

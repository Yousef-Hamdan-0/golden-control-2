"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "@/config/constants";
import { ApiError, getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { KpiCards } from "@/features/operations/components/shared/KpiCards";
import { SectionTitle } from "@/features/operations/components/shared/SectionTitle";
import { FilterCard } from "@/features/operations/components/shared/FilterCard";
import { DateFilterModal } from "@/features/operations/components/shared/DateFilterModal";
import type { DateFilter } from "@/features/operations/types";
import { requestService } from "@/services/request.service";
import {
  createRepairRequestUpdatePatch,
  hasRepairRequestPatch,
  normalizeRequestPriority,
  normalizeRequestStatus,
  normalizeRequestType,
  REQUEST_PRIORITY_OPTIONS,
  REQUEST_STATUS_OPTIONS,
  REQUEST_TYPE_OPTIONS,
  type RepairRequest,
  type RepairRequestInput,
  type RepairRequestPriority,
  type RepairRequestStatus,
  type RepairRequestType,
} from "@/models/requests/request.model";
import {
  useRequestMutations,
  useRequestQuery,
  useRequestsQuery,
  useRequestStatusHistoryQuery,
} from "@/features/requests/hooks/use-requests";
import { AssignTechnicianModal } from "@/features/requests/components/AssignTechnicianModal";
import { RequestDetailsModal } from "@/features/requests/components/RequestDetailsModal";
import { RequestFormModal } from "@/features/requests/components/RequestFormModal";
import { RequestsTable } from "@/features/requests/components/RequestsTable";
import { technicianDisplayName } from "@/features/requests/components/request-display.helpers";
import { useUsersAllQuery } from "@/features/users/hooks/use-users-query";
import { useRole } from "@/features/auth/hooks/use-role";

type StatusFilter = RepairRequestStatus | "all";
type PriorityFilter = RepairRequestPriority | "all";
type TypeFilter = RepairRequestType | "all";

const EMPTY_REQUESTS: RepairRequest[] = [];

function initialStatus(value: string | null): StatusFilter {
  return value ? normalizeRequestStatus(value) : "all";
}

function initialPriority(value: string | null): PriorityFilter {
  return value ? normalizeRequestPriority(value) : "all";
}

function initialType(value: string | null): TypeFilter {
  return value ? normalizeRequestType(value) : "all";
}

function saveBlob(response: Awaited<ReturnType<typeof requestService.downloadReceipt>>, request: RepairRequest) {
  const url = URL.createObjectURL(response.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = response.fileName ?? `request-${request.requestNumber}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getPdfDownloadErrorMessage(error: unknown) {
  const message = getApiErrorMessage(error);
  if (error instanceof ApiError && error.status >= 500) {
    return message === "تعذر إكمال الطلب من الخادم."
      ? "فشل توليد ملف PDF من خادم الطلبات. المسار صحيح لكن الخادم رجّع خطأ داخلي أثناء إنشاء الإيصال."
      : message;
  }

  return message;
}

export function RequestsScreen() {
  const params = useSearchParams();
  const typeParam = params.get("type");
  const statusParam = params.get("status");
  const routeType = initialType(typeParam);
  const routeStatus = initialStatus(statusParam);
  const toast = useToast();
  const [status, setStatus] = useState<StatusFilter>(() => routeStatus);
  const [priority, setPriority] = useState<PriorityFilter>(() =>
    initialPriority(params.get("priority")),
  );
  const [type, setType] = useState<TypeFilter>(() => routeType);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(params.get("create") === "1");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<RepairRequest | null>(null);
  const [pdfRequestId, setPdfRequestId] = useState<string | null>(null);
  const [printRequestId, setPrintRequestId] = useState<string | null>(null);
  // Bulk "assign to technician" selection (UI only; API wired later).
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Map<string, RepairRequest>>(
    () => new Map(),
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const creatingRequestRef = useRef(false);
  const { create, update, assignBulk } = useRequestMutations();
  const { role } = useRole();
  // GET /users (list) is allowed for admin/manager/employee — the roles that
  // reach this screen (the technician web dashboard was removed).
  const usersQuery = useUsersAllQuery({ role: "all", status: "all" }, role !== null);

  const listParams = useMemo(
    () => ({
      status,
      priority,
      type,
      startDate: dateFilter.from,
      endDate: dateFilter.to,
      search: query,
      page,
      pageSize: PAGE_SIZE,
    }),
    [dateFilter.from, dateFilter.to, page, priority, query, status, type],
  );
  const requestsQuery = useRequestsQuery(listParams, role !== null);
  const { data, error: listError, isError, refetch } = requestsQuery;
  const isLoading = role === null || requestsQuery.isLoading;
  const requests = data?.items ?? EMPTY_REQUESTS;
  const currentPage = data?.page ?? page;
  const tableRequests = requests;
  const selectedPreview =
    requests.find((request) => request.id === selectedRequestId) ?? null;
  const detailsQuery = useRequestQuery(selectedRequestId);
  const detailsRequest = detailsQuery.data ?? selectedPreview;
  const statusHistoryQuery = useRequestStatusHistoryQuery(selectedRequestId, true);
  const embeddedStatusHistory = detailsRequest?.statusHistory ?? [];
  const visibleStatusHistory = statusHistoryQuery.data?.length
    ? statusHistoryQuery.data
    : embeddedStatusHistory;
  const totalRequests = data?.total ?? 0;
  const metricRequests = requests;
  const completedCount = metricRequests.filter((request) => request.status === "completed").length;
  const incompletedCount = metricRequests.filter(
    (request) => request.status === "incompleted",
  ).length;
  const pulledCount = metricRequests.filter((request) => request.status === "pulltocenter").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);
  const defaultRequestType = routeType === "all" ? undefined : routeType;
  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data ?? []) {
      map.set(user.id, user.fullName);
      if (user.userNumber) map.set(user.userNumber, user.fullName);
    }
    return map;
  }, [usersQuery.data]);

  useEffect(() => {
    if (isError && listError) {
      toast.error("تعذر تحميل الطلبات", getApiErrorMessage(listError));
    }
  }, [isError, listError, toast]);

  useEffect(() => {
    setStatus(routeStatus);
    setType(routeType);
    setPage(1);
  }, [routeStatus, routeType]);

  async function downloadPdf(request: RepairRequest) {
    setPdfRequestId(request.id);
    try {
      const response = await requestService.downloadReceipt(request.id);
      saveBlob(response, request);
      toast.success("تم تنزيل PDF", `تم تجهيز إيصال الطلب ${request.requestNumber}.`);
    } catch (error) {
      toast.error("تعذر تنزيل PDF", getPdfDownloadErrorMessage(error));
    } finally {
      setPdfRequestId(null);
    }
  }

  // Prints the exact same server-generated PDF used by "تحميل PDF", so the
  // printed copy and the downloaded file are guaranteed to be identical (same
  // bytes, same call to requestService.downloadReceipt).
  async function printRequestReport(request: RepairRequest) {
    setPrintRequestId(request.id);
    try {
      const response = await requestService.downloadReceipt(request.id);
      const url = URL.createObjectURL(response.blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => printWindow.print());
      } else {
        toast.error("تعذر فتح التقرير", "يرجى السماح بالنوافذ المنبثقة لهذا الموقع.");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error("تعذر طباعة التقرير", getPdfDownloadErrorMessage(error));
    } finally {
      setPrintRequestId(null);
    }
  }

  function toggleSelectionMode() {
    setIsSelectionMode((current) => {
      // Leaving selection mode clears every selection.
      if (current) setSelectedRequests(new Map());
      return !current;
    });
  }

  function toggleRequestSelection(request: RepairRequest) {
    setSelectedRequests((current) => {
      const next = new Map(current);
      if (next.has(request.id)) next.delete(request.id);
      else next.set(request.id, request);
      return next;
    });
  }

  function submitBulkAssign(technicianId: string) {
    assignBulk.mutate(
      { requestIds: Array.from(selectedRequests.keys()), technicianId },
      {
        onSuccess: (result) => {
          setShowAssignModal(false);
          setSelectedRequests(new Map());
          setIsSelectionMode(false);

          if (result.notFoundRequestIds.length > 0) {
            toast.error(
              "لم يتم العثور على بعض الطلبات",
              `تعذر إسناد ${result.notFoundRequestIds.length} من الطلبات المحددة لأنها غير موجودة. تم إسناد البقية بنجاح.`,
            );
            return;
          }

          toast.success(
            "تم الإسناد",
            `تم إسناد ${result.assignments.length} طلب/طلبات إلى الفني بنجاح.`,
          );
        },
        onError: (error) => toast.error("تعذر إسناد الطلبات", getApiErrorMessage(error)),
      },
    );
  }

  function submitCreate(input: RepairRequestInput) {
    if (creatingRequestRef.current) return;
    creatingRequestRef.current = true;
    create.mutate(input, {
      onSuccess: () => {
        setShowCreateModal(false);
        setPage(1);
        toast.success("تم إنشاء الطلب", "تمت إضافة طلب الصيانة بنجاح.");
      },
      onError: (error) => toast.error("تعذر إنشاء الطلب", getApiErrorMessage(error)),
      onSettled: () => {
        creatingRequestRef.current = false;
      },
    });
  }

  function submitUpdate(input: RepairRequestInput) {
    if (!editingRequest) return;
    const patch = createRepairRequestUpdatePatch(input, editingRequest);
    if (!hasRepairRequestPatch(patch)) {
      setEditingRequest(null);
      toast.success("لا توجد تغييرات", "لم يتم إرسال طلب تعديل للطلب.");
      return;
    }

    update.mutate(
      { id: editingRequest.id, input },
      {
        onSuccess: () => {
          setEditingRequest(null);
          toast.success("تم تحديث الطلب", `تم حفظ تعديلات ${editingRequest.requestNumber}.`);
        },
        onError: (error) => toast.error("تعذر تحديث الطلب", getApiErrorMessage(error)),
      },
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الطلبات"
        subtitle="إنشاء طلبات الصيانة ومتابعة الحالات والفنيين وسجل الطلبات."
        action={
          <Button
            type="button"
            onClick={() => {
              create.reset();
              setShowCreateModal(true);
            }}
          >
            <Icon name="plus" size={18} />
            طلب صيانة جديد
          </Button>
        }
      />

      <KpiCards
        cards={[
          { label: "إجمالي الطلبات", value: String(totalRequests), icon: "clipboard" },
          { label: "مكتملة", value: String(completedCount), icon: "shield", tone: "success" },
          { label: "غير مكتملة", value: String(incompletedCount), icon: "wrench", tone: "gold" },
          { label: "مسحوبة للمركز", value: String(pulledCount), icon: "box", tone: "info" },
        ]}
      />

      {showCreateModal ? (
        <RequestFormModal
          defaultType={defaultRequestType}
          submitting={create.isPending}
          submitError={create.error ? getApiErrorMessage(create.error) : undefined}
          onClose={() => setShowCreateModal(false)}
          onSubmit={submitCreate}
        />
      ) : null}

      {editingRequest ? (
        <RequestFormModal
          request={editingRequest}
          submitting={update.isPending}
          submitError={update.error ? getApiErrorMessage(update.error) : undefined}
          onClose={() => setEditingRequest(null)}
          onSubmit={submitUpdate}
        />
      ) : null}

      {selectedRequestId ? (
        <RequestDetailsModal
          request={detailsRequest}
          isLoading={detailsQuery.isLoading}
          errorMessage={detailsQuery.error ? getApiErrorMessage(detailsQuery.error) : undefined}
          statusHistory={visibleStatusHistory}
          statusHistoryLoading={statusHistoryQuery.isLoading && embeddedStatusHistory.length === 0}
          statusHistoryError={
            statusHistoryQuery.error && embeddedStatusHistory.length === 0
              ? getApiErrorMessage(statusHistoryQuery.error)
              : undefined
          }
          technicianDisplayName={
            detailsRequest ? technicianDisplayName(detailsRequest, usersById) : undefined
          }
          usersById={usersById}
          downloadingPdf={pdfRequestId === selectedRequestId}
          printingPdf={printRequestId === selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onEdit={(request) => {
            update.reset();
            setSelectedRequestId(null);
            setEditingRequest(request);
          }}
          onDownloadPdf={downloadPdf}
          onPrintReport={printRequestReport}
        />
      ) : null}
      {showDateFilter ? (
        <DateFilterModal
          filter={dateFilter}
          onApply={(filter) => {
            setDateFilter(filter);
            setPage(1);
          }}
          onClose={() => setShowDateFilter(false)}
        />
      ) : null}

      <FilterCard className="lg:grid-cols-[minmax(360px,2fr)_repeat(3,minmax(130px,1fr))_auto]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الطلب أو هاتف العميل"
          aria-label="بحث الطلبات"
        />
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            setPage(1);
          }}
          aria-label="تصفية حالة الطلب"
        >
          <option value="all">كل الحالات</option>
          {REQUEST_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(event) => {
            setPriority(event.target.value as PriorityFilter);
            setPage(1);
          }}
          aria-label="تصفية الأولوية"
        >
          <option value="all">كل الأولويات</option>
          {REQUEST_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={type}
          onChange={(event) => {
            setType(event.target.value as TypeFilter);
            setPage(1);
          }}
          aria-label="تصفية نوع الطلب"
        >
          <option value="all">كل أنواع الطلبات</option>
          {REQUEST_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant={hasDateFilter ? "primary" : "outline"}
          className="whitespace-nowrap"
          onClick={() => setShowDateFilter(true)}
        >
          <Icon name="clock" size={18} />
          الفترة الزمنية
        </Button>
      </FilterCard>

      {/* Bulk-assign toolbar: selection toggle + assign action (new requests only). */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {selectedRequests.size > 0 ? (
          <Button
            type="button"
            onClick={() => {
              assignBulk.reset();
              setShowAssignModal(true);
            }}
          >
            <Icon name="wrench" size={18} />
            إسناد إلى فني ({selectedRequests.size})
          </Button>
        ) : null}
        <Button
          type="button"
          variant={isSelectionMode ? "primary" : "outline"}
          onClick={toggleSelectionMode}
        >
          <Icon name="clipboard" size={18} />
          {isSelectionMode ? "إلغاء التحديد" : "تحديد الطلبات"}
        </Button>
      </div>

      {isError && !data ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft p-6 text-center text-sm text-danger">
          تعذر تحميل الطلبات.{" "}
          <button type="button" onClick={() => refetch()} className="underline">
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <RequestsTable
          requests={tableRequests}
          isLoading={isLoading}
          currentPage={currentPage}
          totalRequests={totalRequests}
          usersById={usersById}
          pdfRequestId={pdfRequestId}
          selectionMode={isSelectionMode}
          selectedIds={new Set(selectedRequests.keys())}
          onToggleSelect={toggleRequestSelection}
          onPage={setPage}
          onDetails={(request) => setSelectedRequestId(request.id)}
          onEdit={(request) => {
            update.reset();
            setEditingRequest(request);
          }}
          onDownloadPdf={downloadPdf}
        />
      )}

      {showAssignModal ? (
        <AssignTechnicianModal
          requests={Array.from(selectedRequests.values())}
          onClose={() => {
            if (!assignBulk.isPending) setShowAssignModal(false);
          }}
          onAssign={submitBulkAssign}
          submitting={assignBulk.isPending}
          submitError={assignBulk.error ? getApiErrorMessage(assignBulk.error) : undefined}
        />
      ) : null}
    </div>
  );
}

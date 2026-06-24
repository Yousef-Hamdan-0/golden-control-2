"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonRow } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "@/config/constants";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { KpiCards } from "@/features/operations/components/shared/KpiCards";
import { SectionTitle } from "@/features/operations/components/shared/SectionTitle";
import { DateFilterModal } from "@/features/operations/components/shared/DateFilterModal";
import type { DateFilter } from "@/features/operations/types";
import { requestService } from "@/services/request.service";
import {
  normalizeRequestPriority,
  normalizeRequestStatus,
  normalizeRequestType,
  REQUEST_PRIORITY_LABELS,
  REQUEST_PRIORITY_OPTIONS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_OPTIONS,
  REQUEST_STATUS_TONE,
  REQUEST_TYPE_OPTIONS,
  type RepairRequest,
  type RepairRequestInput,
  type RepairRequestPriority,
  type RepairRequestStatus,
  type RepairRequestType,
  type RequestRecordsInput,
} from "@/models/requests/request.model";
import {
  useRequestMutations,
  useRequestQuery,
  useRequestsQuery,
  useRequestStatusHistoryQuery,
} from "@/features/requests/hooks/use-requests";
import { RequestDetailsModal } from "@/features/requests/components/RequestDetailsModal";
import { RequestFormModal } from "@/features/requests/components/RequestFormModal";
import { UploadRecordsModal } from "@/features/requests/components/UploadRecordsModal";

type StatusFilter = RepairRequestStatus | "all";
type PriorityFilter = RepairRequestPriority | "all";
type TypeFilter = RepairRequestType | "all";

function initialStatus(value: string | null): StatusFilter {
  return value ? normalizeRequestStatus(value) : "all";
}

function initialPriority(value: string | null): PriorityFilter {
  return value ? normalizeRequestPriority(value) : "all";
}

function initialType(value: string | null): TypeFilter {
  return value ? normalizeRequestType(value) : "all";
}

function formatDate(value: string) {
  return value ? value.slice(0, 10) : "غير محدد";
}

function primaryDevice(request: RepairRequest) {
  const first = request.devices[0];
  if (!first) return "غير محدد";
  const name = first.deviceName || first.deviceType || "غير محدد";
  return first.brand ? `${name} / ${first.brand}` : name;
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

export function RequestsScreen() {
  const params = useSearchParams();
  const toast = useToast();
  const [status, setStatus] = useState<StatusFilter>(() => initialStatus(params.get("status")));
  const [priority, setPriority] = useState<PriorityFilter>(() =>
    initialPriority(params.get("priority")),
  );
  const [type, setType] = useState<TypeFilter>(() => initialType(params.get("type")));
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(params.get("create") === "1");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<RepairRequest | null>(null);
  const [recordsRequest, setRecordsRequest] = useState<RepairRequest | null>(null);
  const [pdfRequestId, setPdfRequestId] = useState<string | null>(null);
  const { create, update, uploadRecords } = useRequestMutations();

  const listParams = useMemo(
    () => ({
      status,
      priority,
      type,
      startDate: dateFilter.from,
      endDate: dateFilter.to,
      page,
      pageSize: PAGE_SIZE,
      search,
    }),
    [dateFilter.from, dateFilter.to, page, priority, search, status, type],
  );
  const {
    data,
    error: listError,
    isLoading,
    isError,
    refetch,
  } = useRequestsQuery(listParams);
  const requests = data?.items ?? [];
  const selectedPreview =
    requests.find((request) => request.id === selectedRequestId) ?? null;
  const detailsQuery = useRequestQuery(selectedRequestId);
  const detailsRequest = detailsQuery.data ?? selectedPreview;
  const statusHistoryQuery = useRequestStatusHistoryQuery(selectedRequestId);
  const totalRequests = data?.total ?? 0;
  const emergencyCount = requests.filter((request) => request.priority === "emergency").length;
  const completedCount = requests.filter((request) => request.status === "completed").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);

  useEffect(() => {
    if (isError && listError) {
      toast.error("تعذر تحميل الطلبات", getApiErrorMessage(listError));
    }
  }, [isError, listError, toast]);

  function applySearch() {
    setSearch(searchDraft.trim());
    setPage(1);
  }

  function clearFilters() {
    setStatus("all");
    setPriority("all");
    setType("all");
    setDateFilter({ from: "", to: "" });
    setSearchDraft("");
    setSearch("");
    setPage(1);
  }

  async function downloadPdf(request: RepairRequest) {
    setPdfRequestId(request.id);
    try {
      const response = await requestService.downloadReceipt(request.id);
      saveBlob(response, request);
      toast.success("تم تنزيل PDF", `تم تجهيز إيصال الطلب ${request.requestNumber}.`);
    } catch (error) {
      toast.error("تعذر تنزيل PDF", getApiErrorMessage(error));
    } finally {
      setPdfRequestId(null);
    }
  }

  function submitCreate(input: RepairRequestInput) {
    create.mutate(input, {
      onSuccess: () => {
        setShowCreateModal(false);
        setPage(1);
        toast.success("تم إنشاء الطلب", "تمت إضافة طلب الصيانة بنجاح.");
      },
      onError: (error) => toast.error("تعذر إنشاء الطلب", getApiErrorMessage(error)),
    });
  }

  function submitUpdate(input: RepairRequestInput) {
    if (!editingRequest) return;
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

  function submitRecords(input: RequestRecordsInput) {
    const requestId = recordsRequest?.id;
    uploadRecords.mutate({ requestId, input }, {
      onSuccess: () => {
        setRecordsRequest(null);
        toast.success("تم رفع التسجيلات", `تم تسجيل الملفات للطلب ${input.requestNumber}.`);
      },
      onError: (error) => toast.error("تعذر رفع التسجيلات", getApiErrorMessage(error)),
    });
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
          { label: "طلبات الصفحة", value: String(requests.length), icon: "file" },
          { label: "طلبات طارئة", value: String(emergencyCount), icon: "alert" },
          { label: "طلبات مكتملة", value: String(completedCount), icon: "shield" },
        ]}
      />

      {showCreateModal ? (
        <RequestFormModal
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
          statusHistory={statusHistoryQuery.data ?? []}
          statusHistoryLoading={statusHistoryQuery.isLoading}
          statusHistoryError={
            statusHistoryQuery.error ? getApiErrorMessage(statusHistoryQuery.error) : undefined
          }
          downloadingPdf={pdfRequestId === selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onEdit={(request) => {
            update.reset();
            setSelectedRequestId(null);
            setEditingRequest(request);
          }}
          onDownloadPdf={downloadPdf}
          onUploadRecords={(request) => {
            uploadRecords.reset();
            setRecordsRequest(request);
          }}
        />
      ) : null}

      {recordsRequest ? (
        <UploadRecordsModal
          requestNumber={recordsRequest.requestNumber}
          submitting={uploadRecords.isPending}
          submitError={
            uploadRecords.error ? getApiErrorMessage(uploadRecords.error) : undefined
          }
          onClose={() => setRecordsRequest(null)}
          onSubmit={submitRecords}
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

      <Card className="p-4">
        <form
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_repeat(3,minmax(135px,1fr))_auto_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <Field label="بحث">
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="رقم الطلب، اسم العميل، رقم الهاتف"
              aria-label="بحث في الطلبات"
            />
          </Field>
          <Field label="الحالة">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              aria-label="تصفية حسب حالة الطلب"
            >
              <option value="all">كل الحالات</option>
              {REQUEST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الأولوية">
            <Select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as PriorityFilter);
                setPage(1);
              }}
              aria-label="تصفية حسب الأولوية"
            >
              <option value="all">كل الأولويات</option>
              {REQUEST_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="نوع الطلب">
            <Select
              value={type}
              onChange={(event) => {
                setType(event.target.value as TypeFilter);
                setPage(1);
              }}
              aria-label="تصفية حسب نوع الطلب"
            >
              <option value="all">كل الأنواع</option>
              {REQUEST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            type="button"
            variant={hasDateFilter ? "primary" : "outline"}
            className="self-end whitespace-nowrap px-4"
            onClick={() => setShowDateFilter(true)}
          >
            <Icon name="clock" size={18} />
            الفترة الزمنية
          </Button>
          <Button type="submit" className="self-end px-4">
            بحث
          </Button>
          <Button type="button" variant="outline" className="self-end px-4" onClick={clearFilters}>
            مسح
          </Button>
        </form>
      </Card>

      {isError && !data ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft p-6 text-center text-sm text-danger">
          تعذر تحميل الطلبات.{" "}
          <button type="button" onClick={() => refetch()} className="underline">
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {[
                    "رقم الطلب",
                    "العميل",
                    "الجهاز",
                    "الفني",
                    "الحالة",
                    "الأولوية",
                    "الموعد",
                    "الإجراءات",
                  ].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <SkeletonRow key={index} cols={8} />
                  ))
                ) : requests.length ? (
                  requests.map((request) => (
                    <tr
                      key={request.id}
                      onClick={() => setSelectedRequestId(request.id)}
                      className="cursor-pointer border-b border-border hover:bg-gold-soft"
                    >
                      <td className="px-4 py-4 font-bold text-gold" dir="ltr">
                        {request.requestNumber}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-content">{request.customer.name}</div>
                        <div className="text-xs text-content-muted" dir="ltr">
                          {request.customer.firstPhone || "غير محدد"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-content-muted">{primaryDevice(request)}</td>
                      <td className="px-4 py-4 text-content">
                        {request.technicianName || "غير محدد"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={REQUEST_STATUS_TONE[request.status]} dot>
                          {REQUEST_STATUS_LABELS[request.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={request.priority === "emergency" ? "danger" : "neutral"}>
                          {REQUEST_PRIORITY_LABELS[request.priority]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-content-muted">
                        {formatDate(request.scheduledDate)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-start gap-2" dir="rtl">
                          <button
                            type="button"
                            aria-label={`تفاصيل ${request.requestNumber}`}
                            title="تفاصيل الطلب"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRequestId(request.id);
                            }}
                            className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                          >
                            <Icon name="eye" size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label={`تعديل ${request.requestNumber}`}
                            title="تعديل"
                            onClick={(event) => {
                              event.stopPropagation();
                              update.reset();
                              setEditingRequest(request);
                            }}
                            className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                          >
                            <Icon name="pencil" size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label={`PDF ${request.requestNumber}`}
                            title="تنزيل PDF"
                            disabled={pdfRequestId === request.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadPdf(request);
                            }}
                            className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2 disabled:opacity-50"
                          >
                            <Icon name="file" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-border">
                    <td className="px-4 py-10 text-center text-content-muted" colSpan={8}>
                      لا توجد طلبات مطابقة للفلاتر.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={data?.page ?? page}
            total={totalRequests}
            pageSize={data?.pageSize ?? PAGE_SIZE}
            onPage={setPage}
            itemLabel="طلب"
          />
        </Card>
      )}
    </div>
  );
}

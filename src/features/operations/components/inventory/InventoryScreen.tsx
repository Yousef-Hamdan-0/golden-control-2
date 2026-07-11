"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Input } from "@/components/ui/Input";
import { SkeletonRow } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { localDateKey, localDisplayDateTime } from "@/lib/format/date";
import { PAGE_SIZE } from "@/config/constants";
import type { DateFilter } from "../../types";
import { INVENTORY_MOVEMENT_LABELS } from "../../constants";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { DateFilterModal } from "../shared/DateFilterModal";
import { EmptyState } from "../shared/EmptyState";
import { PartFormModal } from "./PartFormModal";
import { QuantityAdjustmentModal } from "./QuantityAdjustmentModal";
import { useRole } from "@/features/auth/hooks/use-role";
import {
  useInventoryMovementsQuery,
  useInventoryMutations,
  useInventoryPartsQuery,
} from "@/features/inventory/hooks/use-inventory";
import type {
  InventoryMovementType,
  InventoryMovementLog,
  InventoryPart,
  InventoryPartInput,
} from "@/models/inventory/inventory.model";

const EMPTY_PARTS: InventoryPart[] = [];
const EMPTY_MOVEMENTS: InventoryMovementLog[] = [];

function isSparePartNumberSearch(value: string) {
  const term = value.trim();
  return /^SP[-\s]?\d+/i.test(term) || /^\d+$/.test(term);
}

function partListParams(query: string, page: number) {
  const search = query.trim();
  const params: { page: number; pageSize: number; name?: string; sparePartNumber?: string } = {
    page,
    pageSize: PAGE_SIZE,
  };
  if (!search) return params;
  if (isSparePartNumberSearch(search)) params.sparePartNumber = search;
  else params.name = search;
  return params;
}

function matchesDateFilter(value: string, filter: DateFilter) {
  const date = localDateKey(value);
  if (filter.from && date < filter.from) return false;
  if (filter.to && date > filter.to) return false;
  return true;
}

function movementReference(type: InventoryMovementType) {
  if (type === "supply") return "توريد مخزون";
  if (type === "withdraw") return "صرف مخزون";
  return "تسوية مخزون";
}

export function InventoryScreen({ section = "parts" }: { section?: string }) {
  // Parts writes and movements are admin-only per the matrix; every role may
  // view the parts list.
  const { role } = useRole();
  const isAdmin = role === "admin";
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null);
  const [partToDelete, setPartToDelete] = useState<InventoryPart | null>(null);
  const [partPage, setPartPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [showMovementDateFilter, setShowMovementDateFilter] = useState(false);
  const [movementDateFilter, setMovementDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const isMovement = section === "movement";
  const hasMovementDateFilter = Boolean(movementDateFilter.from || movementDateFilter.to);
  const partsQueryParams = useMemo(() => partListParams(query, partPage), [partPage, query]);
  const partsQuery = useInventoryPartsQuery(partsQueryParams);
  const movementsQuery = useInventoryMovementsQuery();
  const { createPart, updatePart, deletePart, createMovement } = useInventoryMutations();
  const inventoryItems = partsQuery.data?.items ?? EMPTY_PARTS;
  const visibleParts = inventoryItems;
  const inventoryMovements = movementsQuery.data ?? EMPTY_MOVEMENTS;
  const lowStock = visibleParts.filter((item) => item.quantity <= 0);
  const inventoryValueSyp = visibleParts.reduce(
    (sum, item) => sum + item.quantity * item.costSyp,
    0,
  );
  const inventoryValueUsd = visibleParts.reduce(
    (sum, item) => sum + item.quantity * item.costUsd,
    0,
  );
  const sortedMovements = useMemo(
    () =>
      [...inventoryMovements]
        .filter((movement) => matchesDateFilter(movement.createdAt, movementDateFilter))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [inventoryMovements, movementDateFilter],
  );
  const movementPages = Math.max(1, Math.ceil(sortedMovements.length / PAGE_SIZE));
  const currentMovementPage = Math.min(movementPage, movementPages);
  const visibleMovements = sortedMovements.slice(
    (currentMovementPage - 1) * PAGE_SIZE,
    currentMovementPage * PAGE_SIZE,
  );
  const displayedTotalParts = partsQuery.data?.total ?? inventoryItems.length;
  const currentPartPage = partsQuery.data?.page ?? partPage;
  const isPartSubmitting = createPart.isPending || updatePart.isPending;
  const partSubmitError =
    createPart.error ? getApiErrorMessage(createPart.error) :
    updatePart.error ? getApiErrorMessage(updatePart.error) :
    undefined;

  function closePartModal() {
    setShowSupplyModal(false);
    setEditingPart(null);
  }

  function savePart(input: InventoryPartInput) {
    if (editingPart) {
      updatePart.mutate(
        { id: editingPart.id, input },
        {
          onSuccess: () => {
            toast.success("تم تعديل القطعة", `تم حفظ تعديلات ${input.name} بنجاح.`);
            closePartModal();
          },
          onError: (error) => toast.error("تعذر تعديل القطعة", getApiErrorMessage(error)),
        },
      );
      return;
    }

    createPart.mutate(input, {
      onSuccess: () => {
        toast.success("تمت إضافة القطعة", `تمت إضافة ${input.name} إلى المخزون بنجاح.`);
        closePartModal();
        setPartPage(1);
      },
      onError: (error) => toast.error("تعذر إضافة القطعة", getApiErrorMessage(error)),
    });
  }

  function adjustQuantity(partId: string, movementType: InventoryMovementType, quantity: number) {
    const movementPart = inventoryItems.find((item) => item.id === partId);
    if (!movementPart) return;

    createMovement.mutate(
      {
        partId,
        movementType,
        quantity,
        reference: movementReference(movementType),
      },
      {
        onSuccess: () =>
          toast.success(
            "تم تعديل الكمية",
            `تم تسجيل حركة ${INVENTORY_MOVEMENT_LABELS[movementType].label} للقطعة ${movementPart.name}.`,
          ),
        onError: (error) => toast.error("تعذر تعديل الكمية", getApiErrorMessage(error)),
      },
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title={isMovement ? "حركة المخزون" : "قطع الغيار"}
        subtitle="إدارة مخزون قطع الصيانة، حدود النقص، ومتابعة الصرف والتوريد."
      />

      {showSupplyModal || editingPart ? (
        <PartFormModal
          initialPart={editingPart}
          submitting={isPartSubmitting}
          submitError={partSubmitError}
          onClose={closePartModal}
          onSave={savePart}
        />
      ) : null}
      {showQuantityModal ? (
        <QuantityAdjustmentModal
          items={visibleParts}
          onClose={() => setShowQuantityModal(false)}
          onSave={adjustQuantity}
        />
      ) : null}
      {showMovementDateFilter ? (
        <DateFilterModal
          filter={movementDateFilter}
          onApply={(filter) => {
            setMovementDateFilter(filter);
            setMovementPage(1);
          }}
          onClose={() => setShowMovementDateFilter(false)}
        />
      ) : null}
      {partToDelete ? (
        <ConfirmToast
          title="تأكيد حذف القطعة"
          message={`هل تريد حذف القطعة ${partToDelete.name} من جدول قطع الغيار؟`}
          isLoading={deletePart.isPending}
          onCancel={() => setPartToDelete(null)}
          onConfirm={() => {
            const deletedPart = partToDelete;
            deletePart.mutate(deletedPart.id, {
              onSuccess: () => {
                toast.success("تم حذف القطعة", `تم حذف ${deletedPart.name} من المخزون بنجاح.`);
                setPartToDelete(null);
                if (visibleParts.length <= 1 && partPage > 1) setPartPage((current) => current - 1);
              },
              onError: (error) => toast.error("تعذر حذف القطعة", getApiErrorMessage(error)),
            });
          }}
        />
      ) : null}

      <KpiCards
        cards={
          isMovement
            ? [
                { label: "إجمالي الحركات", value: String(inventoryMovements.length), icon: "clipboard" },
                {
                  label: "حركات التوريد",
                  value: String(inventoryMovements.filter((item) => item.movementType === "supply").length),
                  icon: "plus",
                  tone: "success",
                },
                {
                  label: "حركات الصرف",
                  value: String(inventoryMovements.filter((item) => item.movementType === "withdraw").length),
                  icon: "box",
                  tone: "gold",
                },
                {
                  label: "التسويات",
                  value: String(inventoryMovements.filter((item) => item.movementType === "adjustment").length),
                  icon: "clipboard",
                  tone: "info",
                },
              ]
            : [
                { label: "إجمالي القطع", value: String(displayedTotalParts), icon: "box" },
                { label: "تنبيهات نقص", value: String(lowStock.length), icon: "alert", tone: "danger" },
                {
                  label: "قيمة المخزون بالليرة",
                  value: formatMoney(inventoryValueSyp, "SYP"),
                  icon: "wallet",
                },
                {
                  label: "قيمة المخزون بالدولار",
                  value: formatMoney(inventoryValueUsd, "USD", { decimals: 2 }),
                  icon: "wallet",
                },
              ]
        }
      />

      {!isMovement ? (
        <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center" dir="rtl">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPartPage(1);
            }}
            placeholder="بحث باسم القطعة أو رقم القطعة"
            aria-label="بحث المخزون"
            className="md:flex-1"
          />
          {isAdmin ? (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="button" className="shrink-0" onClick={() => setShowSupplyModal(true)}>
                <Icon name="plus" size={18} />
                إضافة قطعة
              </Button>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setShowQuantityModal(true)}
                disabled={!visibleParts.length}
              >
                <Icon name="pencil" size={18} />
                تعديل الكمية
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {isMovement ? (
        <>
          <div className="flex justify-end">
            <Button
              type="button"
              variant={hasMovementDateFilter ? "primary" : "outline"}
              onClick={() => setShowMovementDateFilter(true)}
            >
              <Icon name="clock" size={18} />
              الفترة الزمنية
            </Button>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["رقم الحركة", "القطعة", "نوع الحركة", "الكمية", "المسؤول", "المرجع", "وقت الإنشاء"].map(
                      (header) => (
                        <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {movementsQuery.isLoading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, index) => (
                      <SkeletonRow key={index} cols={7} />
                    ))
                  ) : visibleMovements.length ? (
                    visibleMovements.map((movement) => (
                      <tr key={movement.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                        <td className="whitespace-nowrap px-4 py-4 font-bold text-gold">
                          {movement.movementNumber || "رقم غير متاح"}
                        </td>
                        <td className="max-w-[150px] px-4 py-4 text-content">
                          <div className="whitespace-nowrap font-medium">{movement.partName || "قطعة غير محددة"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone={INVENTORY_MOVEMENT_LABELS[movement.movementType].tone} dot>
                            {INVENTORY_MOVEMENT_LABELS[movement.movementType].label}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-content-muted">{movement.quantity}</td>
                        <td className="max-w-[150px] whitespace-nowrap px-4 py-4 text-content-muted">{movement.owner}</td>
                        <td className="max-w-[150px] whitespace-nowrap px-4 py-4 text-content-muted">{movement.reference || "غير محدد"}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-content-muted">
                          {localDisplayDateTime(movement.createdAt, "غير محدد")}
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
            {!movementsQuery.isLoading && visibleMovements.length === 0 ? (
              <EmptyState title="لا توجد حركات مخزون مطابقة." />
            ) : null}
            <TablePagination
              page={currentMovementPage}
              total={sortedMovements.length}
              pageSize={PAGE_SIZE}
              onPage={setMovementPage}
              itemLabel="حركة"
            />
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["رقم القطعة", "القطعة", "المتوفر", "الموقع", "القيمة بالليرة", "القيمة بالدولار", "الإجراءات"].map(
                    (header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {partsQuery.isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <SkeletonRow key={index} cols={7} />
                  ))
                ) : visibleParts.length ? (
                  visibleParts.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                      <td className="px-4 py-4">
                        <div className="font-bold text-gold">{item.sparePartNumber}</div>
                      </td>
                      <td className="max-w-[150px] px-4 py-4 text-content">{item.name}</td>
                      <td className="px-4 py-4">
                        <Badge tone={item.quantity <= 0 ? "danger" : "success"} dot>
                          {item.quantity}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-content-muted">{item.shelfLocation || "غير محدد"}</td>
                      <td className="px-4 py-4 text-content-muted">
                        {formatMoney(item.quantity * item.costSyp, "SYP")}
                      </td>
                      <td className="px-4 py-4 text-content-muted">
                        {formatMoney(item.quantity * item.costUsd, "USD", { decimals: 2 })}
                      </td>
                      <td className="px-4 py-4">
                        {isAdmin ? (
                          <div className="flex items-center justify-start gap-2" dir="rtl">
                            <button
                              type="button"
                              aria-label={`تعديل ${item.sparePartNumber}`}
                              title="تعديل"
                              onClick={() => setEditingPart(item)}
                              className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                            >
                              <Icon name="pencil" size={18} />
                            </button>
                            <button
                              type="button"
                              aria-label={`حذف ${item.sparePartNumber}`}
                              title="حذف"
                              onClick={() => setPartToDelete(item)}
                              className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                            >
                              <Icon name="trash" size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-content-muted">عرض فقط</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>
          {!partsQuery.isLoading && visibleParts.length === 0 ? (
            <EmptyState title="لا توجد قطع غيار مطابقة." />
          ) : null}
          <TablePagination
            page={currentPartPage}
            total={displayedTotalParts}
            pageSize={partsQuery.data?.pageSize ?? PAGE_SIZE}
            onPage={setPartPage}
            itemLabel="قطعة"
          />
        </Card>
      )}
    </div>
  );
}

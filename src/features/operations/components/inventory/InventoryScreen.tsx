"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Input } from "@/components/ui/Input";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { PAGE_SIZE } from "@/config/constants";
import type { InventoryItem, InventoryMovement, DateFilter } from "../../types";
import { INVENTORY, INVENTORY_MOVEMENTS } from "../../data/seed";
import {
  INVENTORY_ITEMS_STORAGE_KEY,
  INVENTORY_MOVEMENTS_STORAGE_KEY,
  INVENTORY_MOVEMENT_LABELS,
  USD_TO_SYP_RATE,
} from "../../constants";
import { readStoredList, writeStoredList } from "../../utils/storage";
import { matchesDateValue, contains } from "../../utils/filter";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { DateFilterModal } from "../shared/DateFilterModal";
import { PartFormModal } from "./PartFormModal";
import { QuantityAdjustmentModal } from "./QuantityAdjustmentModal";

export function InventoryScreen({ section = "parts" }: { section?: string }) {
  const toast = useToast();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() =>
    readStoredList(INVENTORY_ITEMS_STORAGE_KEY, INVENTORY),
  );
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() =>
    readStoredList(INVENTORY_MOVEMENTS_STORAGE_KEY, INVENTORY_MOVEMENTS),
  );
  const [query, setQuery] = useState("");
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryItem | null>(null);
  const [partToDelete, setPartToDelete] = useState<InventoryItem | null>(null);
  const [partPage, setPartPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [showMovementDateFilter, setShowMovementDateFilter] = useState(false);
  const [movementDateFilter, setMovementDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const lowStock = inventoryItems.filter((item) => item.stock <= item.minStock);
  const filtered = inventoryItems.filter((item) => {
    const byQuery = !query || contains(item.name, query) || contains(item.id, query);
    return byQuery;
  });

  const isMovement = section === "movement";
  const inventoryValue = inventoryItems.reduce((sum, item) => sum + item.stock * item.unitCost, 0);
  const sortedMovements = [...inventoryMovements]
    .filter((movement) => matchesDateValue(movement.createdAt, movementDateFilter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const movementPages = Math.max(1, Math.ceil(sortedMovements.length / PAGE_SIZE));
  const currentMovementPage = Math.min(movementPage, movementPages);
  const visibleMovements = sortedMovements.slice(
    (currentMovementPage - 1) * PAGE_SIZE,
    currentMovementPage * PAGE_SIZE,
  );
  const partPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPartPage = Math.min(partPage, partPages);
  const visibleParts = filtered.slice(
    (currentPartPage - 1) * PAGE_SIZE,
    currentPartPage * PAGE_SIZE,
  );
  const hasMovementDateFilter = Boolean(movementDateFilter.from || movementDateFilter.to);

  useEffect(() => {
    writeStoredList(INVENTORY_ITEMS_STORAGE_KEY, inventoryItems);
  }, [inventoryItems]);

  useEffect(() => {
    writeStoredList(INVENTORY_MOVEMENTS_STORAGE_KEY, inventoryMovements);
  }, [inventoryMovements]);

  function upsertPart(item: InventoryItem) {
    const isEdit = Boolean(editingPart);
    setInventoryItems((current) => {
      const exists = current.some((part) => part.id === item.id);
      return exists
        ? current.map((part) => (part.id === item.id ? item : part))
        : [item, ...current];
    });

    if (!editingPart) {
      setInventoryMovements((current) => [
        {
          id: `MOV-${Date.now().toString().slice(-5)}`,
          partId: item.id,
          partName: item.name,
          type: "supply",
          quantity: item.stock,
          owner: "إدارة المخزون",
          createdAt: new Date().toISOString().slice(0, 10),
          reference: "إضافة قطعة",
        },
        ...current,
      ]);
    }
    toast.success(
      isEdit ? "تم تعديل القطعة" : "تمت إضافة القطعة",
      isEdit ? `تم حفظ تعديلات ${item.name} بنجاح.` : `تمت إضافة ${item.name} إلى المخزون بنجاح.`,
    );
  }

  function adjustQuantity(partId: string, movementType: InventoryMovement["type"], quantity: number) {
    const movementPart = inventoryItems.find((item) => item.id === partId);
    if (!movementPart) return;

    const movementLabel = INVENTORY_MOVEMENT_LABELS[movementType].label;

    setInventoryItems((current) =>
      current.map((item) => {
        if (item.id !== partId) return item;
        const nextStock = Math.max(0, item.stock + quantity);
        return { ...item, stock: nextStock, lastMove: movementLabel };
      }),
    );

    setInventoryMovements((current) => [
      {
        id: `MOV-${Date.now().toString().slice(-5)}`,
        partId: movementPart.id,
        partName: movementPart.name,
        type: movementType,
        quantity,
        owner: "إدارة المخزون",
        createdAt: new Date().toISOString().slice(0, 10),
        reference: movementType === "supply" ? "تعديل كمية - توريد" : "تعديل كمية - تسوية",
      },
      ...current,
    ]);
    toast.success("تم تعديل الكمية", `تم تسجيل حركة ${movementLabel} للقطعة ${movementPart.name}.`);
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
          onClose={() => {
            setShowSupplyModal(false);
            setEditingPart(null);
          }}
          onSave={upsertPart}
        />
      ) : null}
      {showQuantityModal ? (
        <QuantityAdjustmentModal
          items={inventoryItems}
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
          onCancel={() => setPartToDelete(null)}
          onConfirm={() => {
            setInventoryItems((current) => current.filter((item) => item.id !== partToDelete.id));
            toast.success("تم حذف القطعة", `تم حذف ${partToDelete.name} من المخزون بنجاح.`);
            setPartToDelete(null);
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
                  value: String(inventoryMovements.filter((item) => item.type === "supply").length),
                  icon: "plus",
                  tone: "success",
                },
                {
                  label: "حركات الصرف",
                  value: String(inventoryMovements.filter((item) => item.type === "withdraw").length),
                  icon: "box",
                  tone: "gold",
                },
                {
                  label: "التسويات",
                  value: String(inventoryMovements.filter((item) => item.type === "adjustment").length),
                  icon: "clipboard",
                  tone: "info",
                },
              ]
            : [
                { label: "إجمالي القطع", value: String(inventoryItems.length), icon: "box" },
                { label: "تنبيهات نقص", value: String(lowStock.length), icon: "alert", tone: "danger" },
                {
                  label: "قيمة المخزون بالليرة",
                  value: formatMoney(inventoryValue, "SYP"),
                  icon: "wallet",
                },
                {
                  label: "قيمة المخزون بالدولار",
                  value: formatMoney(inventoryValue / USD_TO_SYP_RATE, "USD", { decimals: 2 }),
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
            placeholder="بحث باسم القطعة أو الكود"
            aria-label="بحث المخزون"
            className="md:flex-1"
          />
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" className="shrink-0" onClick={() => setShowSupplyModal(true)}>
              <Icon name="plus" size={18} />
              إضافة قطعة
            </Button>
            <Button type="button" variant="outline" className="shrink-0" onClick={() => setShowQuantityModal(true)}>
              <Icon name="pencil" size={18} />
              تعديل الكمية
            </Button>
          </div>
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
              <table className="min-w-[860px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["رقم الحركة", "القطعة", "نوع الحركة", "الكمية", "المسؤول", "المرجع", "التاريخ"].map(
                      (header) => (
                        <th key={header} className="px-4 py-3 font-medium">
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleMovements.map((movement) => (
                    <tr key={movement.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                      <td className="px-4 py-4 font-bold text-gold">{movement.id}</td>
                      <td className="px-4 py-4 text-content">
                        <div className="font-medium">{movement.partName}</div>
                        <div className="text-xs text-content-muted" dir="ltr">{movement.partId}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={INVENTORY_MOVEMENT_LABELS[movement.type].tone} dot>
                          {INVENTORY_MOVEMENT_LABELS[movement.type].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-content-muted">{movement.quantity}</td>
                      <td className="px-4 py-4 text-content-muted">{movement.owner}</td>
                      <td className="px-4 py-4 text-content-muted">{movement.reference}</td>
                      <td className="px-4 py-4 text-content-muted">{movement.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <table className="min-w-[840px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["الكود", "القطعة", "المتوفر", "الموقع", "القيمة بالليرة", "القيمة بالدولار", "الإجراءات"].map(
                    (header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleParts.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{item.id}</td>
                    <td className="px-4 py-4 text-content">{item.name}</td>
                    <td className="px-4 py-4">
                      <Badge tone={item.stock <= item.minStock ? "danger" : "success"} dot>
                        {item.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{item.location}</td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney(item.stock * item.unitCost, "SYP")}
                    </td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney((item.stock * item.unitCost) / USD_TO_SYP_RATE, "USD", { decimals: 2 })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-start gap-2" dir="rtl">
                        <button
                          type="button"
                          aria-label={`تعديل ${item.id}`}
                          title="تعديل"
                          onClick={() => setEditingPart(item)}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف ${item.id}`}
                          title="حذف"
                          onClick={() => setPartToDelete(item)}
                          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentPartPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPage={setPartPage}
            itemLabel="قطعة"
          />
        </Card>
      )}
    </div>
  );
}

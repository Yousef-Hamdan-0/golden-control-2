"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "@/config/constants";
import { UserAvatar } from "@/features/users/components/UserAvatar";
import {
  usePartMovementsQuery,
  useTechnicianCustodyMutations,
  useTechnicianCustodyQuery,
  useWalletMovementsQuery,
} from "@/features/technicians/hooks/use-technician-custody";
import { UpdatePartsModal } from "@/features/technicians/components/UpdatePartsModal";
import { UpdateToolsModal } from "@/features/technicians/components/UpdateToolsModal";
import { UpdateWalletModal } from "@/features/technicians/components/UpdateWalletModal";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { formatMoney } from "@/lib/format/currency";
import { localDisplayDateTime } from "@/lib/format/date";
import {
  MOVEMENT_LABELS,
  MOVEMENT_TONE,
  type TechnicianCustody,
} from "@/models/technician/custody.model";
import type { User } from "@/models/auth/user.model";

type OpenModal = "wallet" | "parts" | "tools" | null;

const EMPTY_CUSTODY: Omit<TechnicianCustody, "technicianId"> = {
  walletBalance: 0,
  tools: "",
  parts: [],
};

export function TechnicianCustodyCard({ technician }: { technician: User }) {
  const toast = useToast();
  const { updateWallet, updateParts, updateTools } = useTechnicianCustodyMutations();
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [walletPage, setWalletPage] = useState(1);
  const [partsPage, setPartsPage] = useState(1);

  const technicianId = technician.id;
  const custodyQuery = useTechnicianCustodyQuery(technicianId);
  // Never blocks the card: identity renders immediately, assets fill in.
  const custody: TechnicianCustody = custodyQuery.data ?? {
    technicianId,
    ...EMPTY_CUSTODY,
  };

  const walletQuery = useWalletMovementsQuery(technicianId, walletPage);
  const partMovementsQuery = usePartMovementsQuery(technicianId, partsPage);
  const walletMovements = walletQuery.data?.items ?? [];
  const partMovements = partMovementsQuery.data?.items ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={technician.fullName} imageUrl={technician.imageUrl || undefined} />
          <div className="min-w-0">
            <h3 className="truncate font-heading text-lg font-bold text-content">
              {technician.fullName}
            </h3>
            <p className="text-xs text-content-muted">
              رقم الفني:{" "}
              <span dir="ltr">{technician.userNumber || technician.id}</span>
            </p>
            {technician.phone ? (
              <p className="text-xs text-content-muted" dir="ltr">
                {technician.phone}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setOpenModal("wallet")}>
            تحديث المحفظة
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenModal("parts")}>
            تحديث القطع
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenModal("tools")}>
            تحديث الأدوات
          </Button>
        </div>
      </CardHeader>

      <section className="border-t border-border p-4 sm:p-5">
        <h4 className="font-heading text-base font-bold text-content">المخزون المالي</h4>
        <p className="mt-1 text-xs text-content-muted">محفظة الفني</p>
        <p className="mt-2 font-heading text-2xl font-bold text-gold">
          {formatMoney(custody.walletBalance, "SYP")}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["المبلغ", "النوع", "السبب", "التاريخ والوقت"].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {walletQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-content-muted">
                    جاري تحميل الحركات...
                  </td>
                </tr>
              ) : walletQuery.isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-danger">
                    {getApiErrorMessage(walletQuery.error)}
                  </td>
                </tr>
              ) : walletMovements.length ? (
                walletMovements.map((movement) => (
                  <tr key={movement.id} className="border-t border-border">
                    <td className="px-4 py-3 font-bold text-content" dir="ltr">
                      {formatMoney(movement.amount, "SYP")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={MOVEMENT_TONE[movement.type]} dot>
                        {MOVEMENT_LABELS[movement.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-content-muted">{movement.reason}</td>
                    <td className="px-4 py-3 text-content-muted" dir="ltr">
                      {localDisplayDateTime(movement.createdAt, "—")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-content-muted">
                    لا توجد حركات على المحفظة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={walletPage}
          total={walletQuery.data?.total ?? 0}
          pageSize={PAGE_SIZE}
          onPage={setWalletPage}
          itemLabel="حركة"
        />
      </section>

      <section className="border-t border-border p-4 sm:p-5">
        <h4 className="font-heading text-base font-bold text-content">مخزون الأدوات والقطع</h4>

        <p className="mt-3 text-xs text-content-muted">الأدوات</p>
        <p className="mt-1 whitespace-pre-line text-sm text-content">
          {custody.tools.trim() || "لا توجد أدوات مسجّلة."}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[360px] text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["اسم القطعة", "الكمية"].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custody.parts.length ? (
                custody.parts.map((part) => (
                  <tr key={part.partId} className="border-t border-border">
                    <td className="px-4 py-3 text-content">{part.name}</td>
                    <td className="px-4 py-3 text-content-muted" dir="ltr">
                      {part.quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-content-muted">
                    لا توجد قطع في العهدة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-xs text-content-muted">حركات القطع</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["اسم القطعة", "الكمية", "السبب", "التاريخ والوقت"].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partMovementsQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-content-muted">
                    جاري تحميل الحركات...
                  </td>
                </tr>
              ) : partMovementsQuery.isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-danger">
                    {getApiErrorMessage(partMovementsQuery.error)}
                  </td>
                </tr>
              ) : partMovements.length ? (
                partMovements.map((movement) => (
                  <tr key={movement.id} className="border-t border-border">
                    <td className="px-4 py-3 text-content">{movement.partName}</td>
                    <td
                      className={`px-4 py-3 font-bold ${movement.quantity < 0 ? "text-danger" : "text-success"}`}
                      dir="ltr"
                    >
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-content-muted">{movement.reason}</td>
                    <td className="px-4 py-3 text-content-muted" dir="ltr">
                      {localDisplayDateTime(movement.createdAt, "—")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-content-muted">
                    لا توجد حركات على القطع.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={partsPage}
          total={partMovementsQuery.data?.total ?? 0}
          pageSize={PAGE_SIZE}
          onPage={setPartsPage}
          itemLabel="حركة"
        />
      </section>

      {openModal === "wallet" ? (
        <UpdateWalletModal
          custody={custody}
          technicianName={technician.fullName}
          isSaving={updateWallet.isPending}
          onClose={() => setOpenModal(null)}
          onSave={(input) =>
            updateWallet.mutate(
              { technicianId, input },
              {
                onSuccess: () => {
                  setOpenModal(null);
                  toast.success("تم تحديث المحفظة", "تم تسجيل الحركة وتحديث الرصيد.");
                },
                onError: (error) =>
                  toast.error("تعذر تحديث المحفظة", getApiErrorMessage(error)),
              },
            )
          }
        />
      ) : null}

      {openModal === "parts" ? (
        <UpdatePartsModal
          custody={custody}
          technicianName={technician.fullName}
          isSaving={updateParts.isPending}
          onClose={() => setOpenModal(null)}
          onSave={(input) =>
            updateParts.mutate(
              { technicianId, input },
              {
                onSuccess: () => {
                  setOpenModal(null);
                  toast.success("تم تحديث القطع", "تم تحديث قطع العهدة وتسجيل الحركات.");
                },
                onError: (error) => toast.error("تعذر تحديث القطع", getApiErrorMessage(error)),
              },
            )
          }
        />
      ) : null}

      {openModal === "tools" ? (
        <UpdateToolsModal
          custody={custody}
          technicianName={technician.fullName}
          isSaving={updateTools.isPending}
          onClose={() => setOpenModal(null)}
          onSave={(tools) =>
            updateTools.mutate(
              { technicianId, tools },
              {
                onSuccess: () => {
                  setOpenModal(null);
                  toast.success("تم تحديث الأدوات", "تم حفظ أدوات العهدة.");
                },
                onError: (error) => toast.error("تعذر تحديث الأدوات", getApiErrorMessage(error)),
              },
            )
          }
        />
      ) : null}
    </Card>
  );
}

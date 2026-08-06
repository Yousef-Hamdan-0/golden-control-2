"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { PAGE_SIZE } from "@/config/constants";
import { TechnicianCustodyCard } from "@/features/technicians/components/TechnicianCustodyCard";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { getApiErrorMessage } from "@/helpers/api.helper";

export function TechnicianCustodyScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Identity (name, photo, number) comes from the real users endpoint — never
  // from the custody payload. GET /users has no search param, so the technician
  // list is fetched once and filtered/paginated on the client.
  const techniciansQuery = useUsersQuery({ role: "technician", pageSize: 1000 });
  const technicians = useMemo(
    () => techniciansQuery.data?.items ?? [],
    [techniciansQuery.data?.items],
  );

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return technicians;
    return technicians.filter(
      (technician) =>
        technician.fullName.includes(term) ||
        (technician.userNumber ?? "").includes(term),
    );
  }, [technicians, search]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // A shrinking result set (e.g. after searching) must not strand the user on
  // a page that no longer exists.
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="عهدة الفني"
        subtitle="متابعة محفظة كل فني وأدواته وقطعه مع سجل الحركات."
      />

      <Card className="p-4 sm:p-5">
        <Field label="بحث باسم الفني أو رقمه" htmlFor="custody-search">
          <Input
            id="custody-search"
            value={search}
            placeholder="اكتب اسم الفني أو رقمه..."
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </Field>
      </Card>

      {techniciansQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : techniciansQuery.isError ? (
        <Card className="border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {getApiErrorMessage(techniciansQuery.error)}
        </Card>
      ) : visible.length ? (
        <div className="space-y-6">
          {visible.map((technician) => (
            <TechnicianCustodyCard key={technician.id} technician={technician} />
          ))}
        </div>
      ) : (
        <Card className="px-4 py-12 text-center text-content-muted">
          {technicians.length === 0
            ? "لا يوجد فنيون مسجّلون حالياً."
            : "لا يوجد فني مطابق للبحث."}
        </Card>
      )}

      <TablePagination
        page={currentPage}
        total={total}
        pageSize={PAGE_SIZE}
        onPage={setPage}
        itemLabel="فني"
      />
    </div>
  );
}

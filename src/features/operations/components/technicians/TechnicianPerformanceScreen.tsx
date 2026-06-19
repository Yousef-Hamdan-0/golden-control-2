"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format/currency";
import { TECHNICIANS } from "../../data/seed";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { ProgressBar } from "../shared/ProgressBar";

export function TechnicianPerformanceScreen() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="أداء الفنيين"
        subtitle="تتبع الإنجاز، الطلبات النشطة، التأخير، رضا العملاء، والعائد لكل فني."
      />
      <KpiCards
        cards={[
          {
            label: "الطلبات المكتملة",
            value: String(TECHNICIANS.reduce((sum, tech) => sum + tech.completed, 0)),
            icon: "shield",
            tone: "success",
          },
          {
            label: "طلبات نشطة",
            value: String(TECHNICIANS.reduce((sum, tech) => sum + tech.active, 0)),
            icon: "clipboard",
            tone: "info",
          },
          {
            label: "متوسط الرضا",
            value: `${Math.round(TECHNICIANS.reduce((sum, tech) => sum + tech.satisfaction, 0) / TECHNICIANS.length)}%`,
            icon: "chart",
          },
          {
            label: "العائد",
            value: formatMoney(TECHNICIANS.reduce((sum, tech) => sum + tech.revenue, 0)),
            icon: "wallet",
          },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {TECHNICIANS.map((tech) => (
          <Card key={tech.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="text-right">
                <h3 className="font-heading text-lg font-bold text-content">{tech.name}</h3>
                <p className="text-sm text-content-muted">{tech.id}</p>
              </div>
              <Badge tone={tech.status === "available" ? "success" : tech.status === "busy" ? "gold" : "neutral"} dot>
                {tech.status === "available" ? "متاح" : tech.status === "busy" ? "مشغول" : "مجاز"}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">مكتملة</p>
                <p className="font-heading text-xl font-bold text-content">{tech.completed}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">نشطة</p>
                <p className="font-heading text-xl font-bold text-content">{tech.active}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">تأخير</p>
                <p className="font-heading text-xl font-bold text-content">{tech.delayed}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-content-muted">
                <span>رضا العملاء</span>
                <span>{tech.satisfaction}%</span>
              </div>
              <ProgressBar value={tech.satisfaction} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

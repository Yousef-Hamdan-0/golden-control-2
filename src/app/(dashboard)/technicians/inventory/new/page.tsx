import { PageHeader } from "@/components/layout/PageHeader";
import { DailyInventoryForm } from "@/features/technicians";

export default function NewDailyInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="تعيين مخزون جديد"
        subtitle="تسجيل الأدوات والمواد المستلمة لعهدة الفني"
      />
      <DailyInventoryForm />
    </div>
  );
}

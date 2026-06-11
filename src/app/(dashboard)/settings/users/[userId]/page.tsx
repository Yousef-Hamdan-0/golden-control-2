import { PageHeader } from "@/components/layout/PageHeader";
import { UserProfileView } from "@/features/users";

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const userId = decodeURIComponent(params.userId);
  return (
    <div className="space-y-6">
      <PageHeader title="الملف الشخصي" subtitle="عرض تفاصيل المستخدم." />
      <UserProfileView userId={userId} />
    </div>
  );
}

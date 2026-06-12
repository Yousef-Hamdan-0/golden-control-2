import { PageHeader } from "@/components/layout/PageHeader";
import { UserProfileView } from "@/features/users";

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: rawUserId } = await params;
  const userId = decodeURIComponent(rawUserId);
  return (
    <div className="space-y-6">
      <PageHeader title="الملف الشخصي" subtitle="عرض تفاصيل المستخدم." />
      <UserProfileView userId={userId} />
    </div>
  );
}

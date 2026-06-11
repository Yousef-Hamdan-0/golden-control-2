import { PageHeader } from "@/components/layout/PageHeader";
import { UserProfileView } from "@/features/users";

// Use a permissive prop type because Next's PageProps typing may vary
// across Next.js versions (params can be a Promise in some types).
export default function UserDetailPage({ params }: any) {
  const userId = decodeURIComponent(params?.userId ?? "");
  return (
    <div className="space-y-6">
      <PageHeader title="الملف الشخصي" subtitle="عرض تفاصيل المستخدم." />
      <UserProfileView userId={userId} />
    </div>
  );
}

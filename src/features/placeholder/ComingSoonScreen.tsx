import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/lib/icons";

export function ComingSoonScreen({
  title,
  description,
  icon = "clipboard",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <Card className="max-w-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-gold-soft text-gold">
          <Icon name={icon} size={28} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-content">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-content-muted">{description}</p>
      </Card>
    </div>
  );
}

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/lib/icons";

export function KpiCards({
  cards,
}: {
  cards: Array<{ label: string; value: string; icon: IconName; tone?: BadgeTone }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-right">
              <p className="text-sm text-content-muted">{card.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-content">
                {card.value}
              </p>
            </div>
            <div className="rounded-md bg-gold-soft p-2 text-gold">
              <Icon name={card.icon} />
            </div>
          </div>
          {card.tone ? (
            <div className="mt-4 flex justify-end">
              <Badge tone={card.tone} dot>
                مباشر
              </Badge>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

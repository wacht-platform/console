import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardData {
  title: string;
  value: string;
  change: number;
}

export function SectionCards({ data }: { data?: SectionCardData[] }) {
  const cards = data || [];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="@container/card bg-gradient-to-t from-primary/[0.03] to-card border-border/40 shadow-sm"
        >
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-xl font-normal tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                {card.change >= 0 ? <IconTrendingUp className="size-3.5" /> : <IconTrendingDown className="size-3.5" />}
                {card.change >= 0 ? "+" : ""}{card.change.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

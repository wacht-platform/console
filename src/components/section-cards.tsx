import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface SectionCardData {
    title: string;
    value: string;
    change: number;
}

export function SectionCards({ data }: { data?: SectionCardData[] }) {
    const cards = data || [];

    return (
        <div className="overflow-hidden rounded-lg border border-border/50">
            <div className="flex flex-col sm:flex-row">
            {cards.map((card, index) => (
                <Card
                    key={index}
                    className="@container-card flex-1 rounded-none border-0 border-b border-border/40 bg-gradient-to-t from-primary/5 to-card shadow-none sm:border-b-0 sm:border-r last:border-b-0 sm:last:border-r-0"
                >
                    <CardHeader className="gap-1 px-2.5 py-0 sm:px-3 sm:py-0">
                        <CardDescription className="text-[9px] leading-none uppercase tracking-[0.05em] text-muted-foreground sm:text-[10px]">
                            {card.title}
                        </CardDescription>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-medium leading-none tabular-nums sm:text-xl">
                                {card.value}
                            </CardTitle>
                            <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium sm:text-[11px] ${
                                    card.change >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                            >
                                {card.change >= 0 ? (
                                    <IconTrendingUp className="size-3" />
                                ) : (
                                    <IconTrendingDown className="size-3" />
                                )}
                                {card.change >= 0 ? "+" : ""}
                                {card.change.toFixed(1)}%
                            </span>
                        </div>
                    </CardHeader>
                </Card>
            ))}
            </div>
        </div>
    );
}

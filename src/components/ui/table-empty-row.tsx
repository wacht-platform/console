import type { ReactNode } from "react";
import { TableRow, TableCell } from "@/components/ui/app-table";

export function TableEmptyRow({
    colSpan,
    icon,
    title,
    description,
    action,
}: {
    colSpan: number;
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-1.5">
                    {icon}
                    <p className="text-sm text-muted-foreground">{title}</p>
                    {description ? (
                        <p className="text-xs text-muted-foreground/70">
                            {description}
                        </p>
                    ) : null}
                    {action ? <div className="mt-3">{action}</div> : null}
                </div>
            </TableCell>
        </TableRow>
    );
}

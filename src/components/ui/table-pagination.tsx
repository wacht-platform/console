import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function TablePagination({
    page,
    onPageChange,
    hasMore,
    itemsPerPage,
    onItemsPerPageChange,
    perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
}: {
    page: number;
    onPageChange: (page: number) => void;
    hasMore: boolean;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
    perPageOptions?: number[];
}) {
    const hasPrev = page > 1;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Show</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) =>
                        onItemsPerPageChange(Number.parseInt(value, 10))
                    }
                >
                    <SelectTrigger className="w-[70px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {perPageOptions.map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                                {value}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span>per page</span>
            </div>

            <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">Page {page}</p>
                <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                aria-disabled={!hasPrev}
                                className={
                                    !hasPrev
                                        ? "pointer-events-none opacity-50"
                                        : undefined
                                }
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (hasPrev) onPageChange(page - 1);
                                }}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                aria-disabled={!hasMore}
                                className={
                                    !hasMore
                                        ? "pointer-events-none opacity-50"
                                        : undefined
                                }
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (hasMore) onPageChange(page + 1);
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}

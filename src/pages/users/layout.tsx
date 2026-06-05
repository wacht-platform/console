import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CheckIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/ui/page-head";
import { UsersTabs } from "@/components/users/users-tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { InviteUserModal } from "@/components/users/InviteUserModal";

export type UsersListContext = {
    search: string;
    sortKey: string;
    sortOrder: string;
};

type Section = "active" | "invited" | "waitlist";

const SECTIONS: Record<
    Section,
    { sub: string; placeholder: string; cta: string | null }
> = {
    active: {
        sub: "Search and manage user accounts in this deployment.",
        placeholder: "Search users…",
        cta: "Create user",
    },
    invited: {
        sub: "Pending invitations to join this deployment.",
        placeholder: "Search invitations…",
        cta: "Invite user",
    },
    waitlist: {
        sub: "People waiting for access to this deployment.",
        placeholder: "Search waitlist…",
        cta: null,
    },
};

const SORT_OPTIONS = [
    ["created_at-desc", "Newest first"],
    ["created_at-asc", "Oldest first"],
    ["email-asc", "Email (A–Z)"],
    ["email-desc", "Email (Z–A)"],
] as const;

export default function UsersLayout() {
    const { pathname } = useLocation();
    const section: Section = pathname.endsWith("/invited")
        ? "invited"
        : pathname.endsWith("/waitlist")
          ? "waitlist"
          : "active";
    const config = SECTIONS[section];

    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const debouncedSearch = useDebouncedValue(search, 500);

    // Reset filter + any open dialog when moving between tabs.
    useEffect(() => {
        setSearch("");
        setModalOpen(false);
    }, [section]);

    const handleSortChange = (value: string) => {
        const [key, order] = value.split("-");
        setSortKey(key);
        setSortOrder(order);
    };

    const context = useMemo<UsersListContext>(
        () => ({ search: debouncedSearch, sortKey, sortOrder }),
        [debouncedSearch, sortKey, sortOrder],
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Management"
                title="Users"
                sub={config.sub}
                actions={
                    <>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <FunnelIcon className="size-4" />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                className="w-64 space-y-3 p-3"
                            >
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={config.placeholder}
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="h-8 bg-secondary pl-8 text-[13px]"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="px-1 pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                        Sort by
                                    </div>
                                    {SORT_OPTIONS.map(([value, label]) => {
                                        const active =
                                            `${sortKey}-${sortOrder}` === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    handleSortChange(value)
                                                }
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition-colors",
                                                    active
                                                        ? "bg-accent text-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                                )}
                                            >
                                                {label}
                                                {active && (
                                                    <CheckIcon className="size-3.5 text-primary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                        {config.cta && (
                            <Button
                                className="gap-1.5"
                                onClick={() => setModalOpen(true)}
                            >
                                <PlusIcon className="size-4" />
                                {config.cta}
                            </Button>
                        )}
                    </>
                }
            />

            <UsersTabs />

            <Outlet context={context} />

            {section === "active" && (
                <CreateUserModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                />
            )}
            {section === "invited" && (
                <InviteUserModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

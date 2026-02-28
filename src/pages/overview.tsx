import { useState } from "react";
import { format } from "date-fns";
import {
    FingerPrintIcon,
    UserPlusIcon,
    ArrowRightOnRectangleIcon,
    CalendarDaysIcon,
    RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { SectionCards } from "@/components/section-cards";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useAnalyticsStats } from "@/lib/api/hooks/use-analytics";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Heading } from "@/components/ui/heading";
import { useSession } from "@wacht/react-router";
import type { RecentSignup } from "@/lib/api/hooks/use-analytics";
import { Badge } from "@/components/ui/badge";

// Date range options for analytics
const DATE_RANGES = {
    today: () => ({
        from: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
        to: format(new Date(), "yyyy-MM-dd'T'23:59:59'Z'"),
        label: "Today",
    }),
    yesterday: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
            from: format(yesterday, "yyyy-MM-dd'T'00:00:00'Z'"),
            to: format(yesterday, "yyyy-MM-dd'T'23:59:59'Z'"),
            label: "Yesterday",
        };
    },
    thisWeek: () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return {
            from: format(startOfWeek, "yyyy-MM-dd'T'00:00:00'Z'"),
            to: format(now, "yyyy-MM-dd'T'23:59:59'Z'"),
            label: "This week",
        };
    },
    thisMonth: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            from: format(startOfMonth, "yyyy-MM-dd'T'00:00:00'Z'"),
            to: format(now, "yyyy-MM-dd'T'23:59:59'Z'"),
            label: "This month",
        };
    },
};

export default function OverviewPage() {
    const { selectedDeployment } = useProjects();
    const [selectedPeriod, setSelectedPeriod] =
        useState<keyof typeof DATE_RANGES>("thisWeek");
    const currentRange = DATE_RANGES[selectedPeriod]();

    const { session } = useSession();
    const user = session?.active_signin?.user;
    const userName = user?.first_name || "User";

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Analytics data - single hook now returns everything
    const { data: stats, isLoading: statsLoading } = useAnalyticsStats(
        selectedDeployment?.id || "",
        currentRange.from,
        currentRange.to,
        !!selectedDeployment?.id,
    );

    // Extract recent signups/signins from stats response
    const recentSignupsData = stats?.recent_signups || [];
    const recentSigninsData = stats?.recent_signins || [];
    const signupsLoading = statsLoading;
    const signinsLoading = statsLoading;

    // Map analytics stats to section cards data
    const sectionCardsData = [
        {
            title: "Unique Sign Ins",
            value: statsLoading
                ? "..."
                : stats?.unique_signins?.toString() || "0",
            change: statsLoading ? 0 : stats?.unique_signins_change || 0,
        },
        {
            title: "New Sign Ups",
            value: statsLoading ? "..." : stats?.signups?.toString() || "0",
            change: statsLoading ? 0 : stats?.signups_change || 0,
        },
        {
            title: "New Organizations",
            value: statsLoading
                ? "..."
                : stats?.organizations_created?.toString() || "0",
            change: statsLoading ? 0 : stats?.organizations_created_change || 0,
        },
        {
            title: "New Workspaces",
            value: statsLoading
                ? "..."
                : stats?.workspaces_created?.toString() || "0",
            change: statsLoading ? 0 : stats?.workspaces_created_change || 0,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <Heading className="text-2xl tracking-tight">
                        {getGreeting()}, {userName}
                    </Heading>
                    <p className="text-sm text-muted-foreground">
                        {selectedDeployment
                            ? `Performance snapshot for ${selectedDeployment.name}`
                            : "Select a deployment to view analytics."}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-9 gap-2 rounded-lg px-3">
                        <CalendarDaysIcon className="size-4" />
                        {currentRange.label}
                    </Badge>
                    <Select
                        value={selectedPeriod}
                        onValueChange={(val) =>
                            setSelectedPeriod(val as keyof typeof DATE_RANGES)
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(DATE_RANGES).map(([key, fn]) => (
                                <SelectItem key={key} value={key}>
                                    {fn().label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <RectangleStackIcon className="size-4 text-muted-foreground" />
                    <h2 className="text-sm uppercase tracking-[0.14em] text-muted-foreground">
                        Key Metrics
                    </h2>
                </div>
                <SectionCards data={sectionCardsData} />
            </div>

            <div className="h-px w-full bg-border/70" />

            <div>
                <h2 className="mb-3 text-base text-foreground">Recent Activity</h2>
                <Tabs
                    defaultValue="signups"
                    className="w-full flex-col justify-start gap-4"
                >
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="signups">
                                Recent Signups
                            </TabsTrigger>
                            <TabsTrigger value="signins">
                                Recent Sign-ins
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="signups">
                        <ActivityTable
                            loading={signupsLoading}
                            rows={recentSignupsData}
                            emptyIcon={<UserPlusIcon className="h-12 w-12" />}
                            emptyTitle="No signups yet"
                            emptyDescription="When users sign up for your application, they will appear here."
                        />
                    </TabsContent>

                    <TabsContent value="signins">
                        <ActivityTable
                            loading={signinsLoading}
                            rows={recentSigninsData}
                            emptyIcon={<ArrowRightOnRectangleIcon className="h-12 w-12" />}
                            emptyTitle="No sign-ins yet"
                            emptyDescription="User sign-in activity will be displayed here once users start authenticating."
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ActivityTable({
    loading,
    rows,
    emptyIcon,
    emptyTitle,
    emptyDescription,
}: {
    loading: boolean;
    rows: RecentSignup[];
    emptyIcon: React.ReactNode;
    emptyTitle: string;
    emptyDescription: string;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-border/80">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <SkeletonTableRows
                            rows={5}
                            columns={4}
                            withAvatar={false}
                        />
                    ) : rows?.length ? (
                        rows.map((user: RecentSignup, index: number) => (
                            <TableRow
                                key={`${user.email || "unknown"}-${user.date}-${index}`}
                            >
                                <TableCell>
                                    <span className="font-normal">
                                        {user.name || "Anonymous"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-zinc-600 dark:text-zinc-400">
                                    {user.email || "N/A"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <FingerPrintIcon className="size-4" />
                                        <span>{user.method || "Email"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-600 dark:text-zinc-400">
                                    {format(
                                        new Date(user.date),
                                        "MMM dd, HH:mm",
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="p-0"
                            >
                                <EmptyState
                                    icon={emptyIcon}
                                    title={emptyTitle}
                                    description={emptyDescription}
                                />
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

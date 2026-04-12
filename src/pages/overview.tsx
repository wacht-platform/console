import { useState } from "react";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
    FingerPrintIcon,
    UserPlusIcon,
    ArrowRightOnRectangleIcon,
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
} from "@/components/ui/app-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
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
    const resolvedStats = stats;
    const resolvedStatsLoading = statsLoading;

    // Extract recent signups/signins from stats response
    const recentSignupsData = resolvedStats?.recent_signups || [];
    const recentSigninsData = resolvedStats?.recent_signins || [];
    const signupsLoading = resolvedStatsLoading;
    const signinsLoading = resolvedStatsLoading;

    // Map analytics stats to section cards data
    const sectionCardsData = [
        {
            title: "Unique Sign Ins",
            value: statsLoading
                ? "..."
                : resolvedStats?.unique_signins?.toString() || "0",
            change: resolvedStatsLoading
                ? 0
                : resolvedStats?.unique_signins_change || 0,
        },
        {
            title: "New Sign Ups",
            value: resolvedStatsLoading
                ? "..."
                : resolvedStats?.signups?.toString() || "0",
            change: resolvedStatsLoading
                ? 0
                : resolvedStats?.signups_change || 0,
        },
        {
            title: "New Organizations",
            value: resolvedStatsLoading
                ? "..."
                : resolvedStats?.organizations_created?.toString() || "0",
            change: resolvedStatsLoading
                ? 0
                : resolvedStats?.organizations_created_change || 0,
        },
        {
            title: "New Workspaces",
            value: resolvedStatsLoading
                ? "..."
                : resolvedStats?.workspaces_created?.toString() || "0",
            change: resolvedStatsLoading
                ? 0
                : resolvedStats?.workspaces_created_change || 0,
        },
    ];

    const dailyChartConfig = {
        signins: {
            label: "Sign-ins",
            color: "var(--chart-1)",
        },
        signups: {
            label: "Sign-ups",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig;

    const dailyMetrics = (resolvedStats?.daily_metrics || []).map((metric) => {
        const date = new Date(`${metric.day}T00:00:00Z`);
        const hasValidDate = !Number.isNaN(date.getTime());
        return {
            ...metric,
            label: hasValidDate ? format(date, "MMM dd") : metric.day,
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <Heading className="text-2xl tracking-tight">
                        {getGreeting()}, {userName}
                    </Heading>
                    <p className="text-sm text-muted-foreground">
                        See how your app is performing.
                    </p>
                </div>
                <div className="flex items-center gap-2">
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

            <SectionCards data={sectionCardsData} />

            <Card className="border-border/80">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">7 days Trend</CardTitle>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1.5">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: "var(--chart-1)" }}
                            />
                            <span>Sign-ins</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: "var(--chart-2)" }}
                            />
                            <span>Sign-ups</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {resolvedStatsLoading ? (
                        <div className="h-[280px] animate-pulse rounded-md bg-muted/50" />
                    ) : dailyMetrics.length > 0 ? (
                        <ChartContainer
                            config={dailyChartConfig}
                            className="h-[280px] w-full"
                        >
                            <LineChart data={dailyMetrics}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={16}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent indicator="dot" />
                                    }
                                />
                                <Line
                                    dataKey="signins"
                                    type="monotone"
                                    stroke="var(--color-signins)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    dataKey="signups"
                                    type="monotone"
                                    stroke="var(--color-signups)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <EmptyState
                            icon={<RectangleStackIcon className="h-12 w-12" />}
                            title="No daily metrics"
                            description="Daily sign-in and sign-up counts will appear here once activity is available."
                        />
                    )}
                </CardContent>
            </Card>

            <div>
                <h2 className="mb-3 text-base text-foreground">
                    Recent Activity
                </h2>
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
                            emptyIcon={
                                <ArrowRightOnRectangleIcon className="h-12 w-12" />
                            }
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
                            <TableCell colSpan={4} className="p-0">
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

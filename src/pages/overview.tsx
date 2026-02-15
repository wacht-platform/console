import { useState } from "react";
import { format } from "date-fns";
import { FingerPrintIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Heading } from "@/components/ui/heading";
import { useSession } from "@wacht/react-router";

// Date range options for analytics
const DATE_RANGES = {
	today: () => ({
		from: format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'"),
		to: format(new Date(), "yyyy-MM-dd'T'23:59:59'Z'"),
		label: "Today"
	}),
	yesterday: () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return {
			from: format(yesterday, "yyyy-MM-dd'T'00:00:00'Z'"),
			to: format(yesterday, "yyyy-MM-dd'T'23:59:59'Z'"),
			label: "Yesterday"
		};
	},
	thisWeek: () => {
		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay());
		return {
			from: format(startOfWeek, "yyyy-MM-dd'T'00:00:00'Z'"),
			to: format(now, "yyyy-MM-dd'T'23:59:59'Z'"),
			label: "This week"
		};
	},
	thisMonth: () => {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		return {
			from: format(startOfMonth, "yyyy-MM-dd'T'00:00:00'Z'"),
			to: format(now, "yyyy-MM-dd'T'23:59:59'Z'"),
			label: "This month"
		};
	}
};

export default function OverviewPage() {
	const { selectedDeployment } = useProjects();
	const [selectedPeriod, setSelectedPeriod] = useState<keyof typeof DATE_RANGES>("thisWeek");
	const currentRange = DATE_RANGES[selectedPeriod]();

	const { session } = useSession();
	const user = (session?.active_signin?.user);
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
		!!selectedDeployment?.id
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
			value: statsLoading ? "..." : (stats?.unique_signins?.toString() || "0"),
			change: statsLoading ? 0 : (stats?.unique_signins_change || 0),
			description: "No data for comparison",
			footer: stats?.unique_signins_change && stats.unique_signins_change >= 0
				? "Trending up this period"
				: "Down this period",
		},
		{
			title: "New Sign Ups",
			value: statsLoading ? "..." : (stats?.signups?.toString() || "0"),
			change: statsLoading ? 0 : (stats?.signups_change || 0),
			description: "No data for comparison",
			footer: stats?.signups_change && stats.signups_change >= 0
				? "User growth"
				: "Acquisition needs attention",
		},
		{
			title: "New Organizations",
			value: statsLoading ? "..." : (stats?.organizations_created?.toString() || "0"),
			change: statsLoading ? 0 : (stats?.organizations_created_change || 0),
			description: "No data for comparison",
			footer: stats?.organizations_created_change && stats.organizations_created_change >= 0
				? "Strong organization growth"
				: "Organization creation down",
		},
		{
			title: "New Workspaces",
			value: statsLoading ? "..." : (stats?.workspaces_created?.toString() || "0"),
			change: statsLoading ? 0 : (stats?.workspaces_created_change || 0),
			description: "No data for comparison",
			footer: stats?.workspaces_created_change && stats.workspaces_created_change >= 0
				? "Workspace growth"
				: "Workspace creation down",
		},
	];

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<Heading>{getGreeting()}, {userName}</Heading>
			</div>

			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Heading className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overview</Heading>
					<Select
						value={selectedPeriod}
						onValueChange={(val) => setSelectedPeriod(val as keyof typeof DATE_RANGES)}
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
				<SectionCards data={sectionCardsData} />
			</div>

			<div className="space-y-6">
				<Heading className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Signups</Heading>
				<Tabs defaultValue="signups" className="w-full flex-col justify-start gap-6">
					<div className="flex items-center justify-between">
						<TabsList>
							<TabsTrigger value="signups">Recent Signups</TabsTrigger>
							<TabsTrigger value="signins">Recent Sign-ins</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent value="signups">
						<div className="overflow-hidden rounded-lg border">
							<Table>
								<TableHeader className="bg-muted">
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Method</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{signupsLoading ? (
										<SkeletonTableRows rows={5} columns={4} withAvatar={false} />
									) : recentSignupsData?.signups?.length ? (
										recentSignupsData.signups.map((user, index) => (
											<TableRow key={`${user.email}-${index}`}>
												<TableCell>
													<span className="font-normal">{user.name || "Anonymous"}</span>
												</TableCell>
												<TableCell className="text-zinc-600 dark:text-zinc-400">{user.email || "N/A"}</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
														<FingerPrintIcon className="size-4" />
														<span>{user.method || "Email"}</span>
													</div>
												</TableCell>
												<TableCell className="text-zinc-600 dark:text-zinc-400">
													{format(new Date(user.date), "MMM dd, HH:mm")}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={4} className="p-0">
												<EmptyState
													icon={<UserPlusIcon className="w-12 h-12" />}
													title="No signups yet"
													description="When users sign up for your application, they will appear here."
												/>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</TabsContent>
					<TabsContent value="signins">
						<div className="overflow-hidden rounded-lg border">
							<Table>
								<TableHeader className="bg-muted">
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Method</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{signinsLoading ? (
										<SkeletonTableRows rows={5} columns={4} withAvatar={false} />
									) : recentSigninsData?.signups?.length ? (
										recentSigninsData.signups.map((user, index) => (
											<TableRow key={`signin-${user.email}-${index}`}>
												<TableCell>
													<span className="font-normal">{user.name || "Anonymous"}</span>
												</TableCell>
												<TableCell className="text-zinc-600 dark:text-zinc-400">{user.email || "N/A"}</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
														<FingerPrintIcon className="size-4" />
														<span>{user.method || "Email"}</span>
													</div>
												</TableCell>
												<TableCell className="text-zinc-600 dark:text-zinc-400">
													{format(new Date(user.date), "MMM dd, HH:mm")}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={4} className="p-0">
												<EmptyState
													icon={<ArrowRightOnRectangleIcon className="w-12 h-12" />}
													title="No sign-ins yet"
													description="User sign-in activity will be displayed here once users start authenticating."
												/>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

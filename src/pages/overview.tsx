import { FingerPrintIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Heading, Subheading } from "../components/ui/heading";
import { Select } from "../components/ui/select";
import { Stat } from "../components/stat";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../components/ui/table";
import { EmptyState } from "../components/ui/empty-state";
import { SkeletonTableRows } from "../components/ui/skeleton";
import { DnsVerificationPanel } from "../components/dns-verification-panel";
import { useProjects } from "../lib/api/hooks/use-projects";
import { useVerifyDnsRecords } from "../lib/api/hooks/use-dns-verification";
import { useAnalyticsStats, useRecentSignups, useRecentSignins } from "../lib/api/hooks/use-analytics";
import { useState } from "react";
import { format } from "date-fns";

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
	const { mutate: verifyDnsRecords, isPending: isVerifying } =
		useVerifyDnsRecords();

	// State for date range selection
	const [selectedPeriod, setSelectedPeriod] = useState<keyof typeof DATE_RANGES>("today");
	const currentRange = DATE_RANGES[selectedPeriod]();

	// Analytics data hooks
	const { data: stats, isLoading: statsLoading } = useAnalyticsStats(
		selectedDeployment?.id || "",
		currentRange.from,
		currentRange.to,
		!!selectedDeployment?.id
	);

	const { data: recentSignupsData, isLoading: signupsLoading } = useRecentSignups(
		selectedDeployment?.id || "",
		10,
		!!selectedDeployment?.id
	);

	const { data: recentSigninsData, isLoading: signinsLoading } = useRecentSignins(
		selectedDeployment?.id || "",
		10,
		!!selectedDeployment?.id
	);

	// Helper function to format percentage change
	const formatChange = (change?: number): string => {
		if (change === undefined || change === null || isNaN(change)) return "";
		const sign = change >= 0 ? "+" : "";
		return `${sign}${change.toFixed(1)}%`;
	};

	const handleVerifyDns = () => {
		if (selectedDeployment?.id) {
			verifyDnsRecords({ deploymentId: selectedDeployment.id });
		}
	};

	// Check if we need to show DNS verification
	const shouldShowDnsVerification = () => {
		if (selectedDeployment?.mode !== "production") return false;

		const domainRecords = [
			...(selectedDeployment.domain_verification_records
				?.cloudflare_verification || []),
			...(selectedDeployment.domain_verification_records
				?.custom_hostname_verification || []),
		];

		const emailRecords = [
			...(selectedDeployment.email_verification_records?.dkim_records || []),
			...(selectedDeployment.email_verification_records?.return_path_records || []),
	
		];

		const allRecords = [...domainRecords, ...emailRecords];

		// Show if there are records and any are not verified
		return (
			allRecords.length > 0 && allRecords.some((record) => !record.verified)
		);
	};

	return (
		<div className="space-y-8">
			<Heading>Good afternoon, Saurav</Heading>

			{/* DNS Configuration Section - Show when pending */}
			{shouldShowDnsVerification() && (
				<DnsVerificationPanel
					domainRecords={selectedDeployment?.domain_verification_records}
					emailRecords={selectedDeployment?.email_verification_records}
					verificationStatus={selectedDeployment?.verification_status}
					onVerify={handleVerifyDns}
					isVerifying={isVerifying}
					compact={true}
				/>
			)}

			<div className="flex items-end justify-between">
				<Subheading>Overview</Subheading>
				<div>
					<Select
						name="period"
						value={selectedPeriod}
						onChange={(e) => setSelectedPeriod(e.target.value as keyof typeof DATE_RANGES)}
					>
						<option value="today">Today</option>
						<option value="yesterday">Yesterday</option>
						<option value="thisWeek">This week</option>
						<option value="thisMonth">This month</option>
					</Select>
				</div>
			</div>
			<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
				<Stat
					title="Unique Sign Ins"
					value={statsLoading ? "..." : (stats?.unique_signins?.toString() || "0")}
					change={statsLoading ? "" : formatChange(stats?.unique_signins_change)}
				/>
				<Stat
					title="New Sign Ups"
					value={statsLoading ? "..." : (stats?.signups?.toString() || "0")}
					change={statsLoading ? "" : formatChange(stats?.signups_change)}
				/>
				<Stat
					title="New Organizations"
					value={statsLoading ? "..." : (stats?.organizations_created?.toString() || "0")}
					change={statsLoading ? "" : formatChange(stats?.organizations_created_change)}
				/>
				<Stat
					title="New Workspaces"
					value={statsLoading ? "..." : (stats?.workspaces_created?.toString() || "0")}
					change={statsLoading ? "" : formatChange(stats?.workspaces_created_change)}
				/>
			</div>

			<div>
				<div className="mb-4">
					<h3 className="text-base font-normal text-zinc-900 dark:text-zinc-100">Recent Signups</h3>
				</div>
				<Table>
					<TableHead>
						<TableRow>
							<TableHeader>Name</TableHeader>
							<TableHeader>Email</TableHeader>
							<TableHeader>Method</TableHeader>
							<TableHeader>Date</TableHeader>
						</TableRow>
					</TableHead>
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

			<div>
				<div className="mb-4">
					<h3 className="text-base font-normal text-zinc-900 dark:text-zinc-100">Recent Sign-ins</h3>
				</div>
				<Table>
					<TableHead>
						<TableRow>
							<TableHeader>Name</TableHeader>
							<TableHeader>Email</TableHeader>
							<TableHeader>Method</TableHeader>
							<TableHeader>Date</TableHeader>
						</TableRow>
					</TableHead>
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
		</div>
	);
}

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalyticsStats, useRecentSignups } from "@/lib/api/hooks/use-analytics";
import { format } from "date-fns";

interface AnalyticsDashboardProps {
	deploymentId: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
	deploymentId,
}) => {
	const [dateRange, setDateRange] = useState({
		from: format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
		to: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
	});

	const { data: stats, isLoading: statsLoading } = useAnalyticsStats(
		deploymentId,
		dateRange.from,
		dateRange.to
	);

	const { data: recentSignups, isLoading: signupsLoading } = useRecentSignups(
		deploymentId,
		10
	);

	const handleDateChange = (field: "from" | "to", value: string) => {
		setDateRange((prev) => ({
			...prev,
			[field]: new Date(value).toISOString(),
		}));
	};

	const setLast24Hours = () => {
		const to = new Date();
		const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
		setDateRange({
			from: from.toISOString(),
			to: to.toISOString(),
		});
	};

	const setLast7Days = () => {
		const to = new Date();
		const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
		setDateRange({
			from: from.toISOString(),
			to: to.toISOString(),
		});
	};

	const setLast30Days = () => {
		const to = new Date();
		const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
		setDateRange({
			from: from.toISOString(),
			to: to.toISOString(),
		});
	};

	return (
		<div className="space-y-6">
			{/* Date Range Controls */}
			<Card>
				<CardHeader>
					<CardTitle>Analytics Dashboard</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4 items-end">
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={setLast24Hours}>
								Last 24h
							</Button>
							<Button variant="outline" size="sm" onClick={setLast7Days}>
								Last 7 days
							</Button>
							<Button variant="outline" size="sm" onClick={setLast30Days}>
								Last 30 days
							</Button>
						</div>
						<div className="flex gap-4">
							<div>
								<Label htmlFor="from-date">From</Label>
								<Input
									id="from-date"
									type="datetime-local"
									value={format(new Date(dateRange.from), "yyyy-MM-dd'T'HH:mm")}
									onChange={(e) => handleDateChange("from", e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="to-date">To</Label>
								<Input
									id="to-date"
									type="datetime-local"
									value={format(new Date(dateRange.to), "yyyy-MM-dd'T'HH:mm")}
									onChange={(e) => handleDateChange("to", e.target.value)}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Unique Sign Ins</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statsLoading ? "..." : stats?.unique_signins || 0}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Sign Ups</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statsLoading ? "..." : stats?.signups || 0}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Organizations Created</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statsLoading ? "..." : stats?.organizations_created || 0}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Workspaces Created</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{statsLoading ? "..." : stats?.workspaces_created || 0}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Total Signups */}
			<Card>
				<CardHeader>
					<CardTitle>Total Signups (All Time)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">
						{statsLoading ? "..." : stats?.total_signups || 0}
					</div>
				</CardContent>
			</Card>

			{/* Recent Signups Table */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Signups</CardTitle>
				</CardHeader>
				<CardContent>
					{signupsLoading ? (
						<div>Loading...</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2">Name</th>
										<th className="text-left p-2">Email</th>
										<th className="text-left p-2">Method</th>
										<th className="text-left p-2">Date</th>
									</tr>
								</thead>
								<tbody>
									{recentSignups?.signups.map((signup, index) => (
										<tr key={index} className="border-b">
											<td className="p-2">{signup.name || "—"}</td>
											<td className="p-2">{signup.email || "—"}</td>
											<td className="p-2">{signup.method || "—"}</td>
											<td className="p-2">
												{format(new Date(signup.date), "MMM dd, yyyy HH:mm")}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

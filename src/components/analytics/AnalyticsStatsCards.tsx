import React from "react";
import { Stat } from "../stat";
import { useAnalyticsStats } from "@/lib/api/hooks/use-analytics";

interface AnalyticsStatsCardsProps {
	deploymentId: number;
	from: string;
	to: string;
	enabled?: boolean;
}

export const AnalyticsStatsCards: React.FC<AnalyticsStatsCardsProps> = ({
	deploymentId,
	from,
	to,
	enabled = true,
}) => {
	const { data: stats, isLoading: statsLoading } = useAnalyticsStats(
		deploymentId,
		from,
		to,
		enabled
	);

	return (
		<div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
			<Stat
				title="Unique Sign Ins"
				value={statsLoading ? "..." : (stats?.unique_signins?.toString() || "0")}
				change=""
			/>
			<Stat
				title="New Sign Ups"
				value={statsLoading ? "..." : (stats?.signups?.toString() || "0")}
				change=""
			/>
			<Stat
				title="New Organizations"
				value={statsLoading ? "..." : (stats?.organizations_created?.toString() || "0")}
				change=""
			/>
			<Stat
				title="New Workspaces"
				value={statsLoading ? "..." : (stats?.workspaces_created?.toString() || "0")}
				change=""
			/>
		</div>
	);
};

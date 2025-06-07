import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface AnalyticsStats {
	unique_signins: number;
	signups: number;
	organizations_created: number;
	workspaces_created: number;
	total_signups: number;
	unique_signins_change?: number;
	signups_change?: number;
	organizations_created_change?: number;
	workspaces_created_change?: number;
}

export interface RecentSignup {
	name: string | null;
	email: string | null;
	method: string | null;
	date: string;
}

export interface AnalyticsStatsResponse {
	unique_signins: number;
	signups: number;
	organizations_created: number;
	workspaces_created: number;
	total_signups: number;
	unique_signins_change?: number;
	signups_change?: number;
	organizations_created_change?: number;
	workspaces_created_change?: number;
}

export interface RecentSignupsResponse {
	signups: RecentSignup[];
}

export const useAnalyticsStats = (
	deploymentId: number,
	from: string,
	to: string,
	enabled = true
) => {
	return useQuery({
		queryKey: ["analytics", "stats", deploymentId, from, to],
		queryFn: async (): Promise<AnalyticsStatsResponse> => {
			const response = await apiClient.get(
				`/deployment/${deploymentId}/analytics/stats`,
				{
					params: { from, to },
				}
			);
			return response.data;
		},
		enabled,
	});
};

export const useRecentSignups = (
	deploymentId: number,
	limit = 10,
	enabled = true
) => {
	return useQuery({
		queryKey: ["analytics", "recent-signups", deploymentId, limit],
		queryFn: async (): Promise<RecentSignupsResponse> => {
			const response = await apiClient.get(
				`/deployment/${deploymentId}/analytics/recent-signups`,
				{
					params: { limit },
				}
			);
			return response.data;
		},
		enabled,
	});
};

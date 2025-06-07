import React from "react";
import { FingerPrintIcon } from "@heroicons/react/24/outline";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { useRecentSignups } from "@/lib/api/hooks/use-analytics";
import { format } from "date-fns";

interface RecentSignupsTableProps {
	deploymentId: number;
	limit?: number;
	enabled?: boolean;
}

export const RecentSignupsTable: React.FC<RecentSignupsTableProps> = ({
	deploymentId,
	limit = 10,
	enabled = true,
}) => {
	const { data: recentSignupsData, isLoading: signupsLoading } = useRecentSignups(
		deploymentId,
		limit,
		enabled
	);

	return (
		<Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
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
					<TableRow>
						<TableCell colSpan={4} className="text-center py-8">
							Loading recent signups...
						</TableCell>
					</TableRow>
				) : recentSignupsData?.signups?.length ? (
					recentSignupsData.signups.map((user, index) => (
						<TableRow key={`${user.email}-${index}`}>
							<TableCell>
								<span>{user.name || "Anonymous"}</span>
							</TableCell>
							<TableCell>{user.email || "N/A"}</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<FingerPrintIcon className="size-4" />
									<span>{user.method || "Email"}</span>
								</div>
							</TableCell>
							<TableCell>
								{format(new Date(user.date), "EEE MMM dd, HH:mm")}
							</TableCell>
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell colSpan={4} className="text-center py-8 text-gray-500">
							No recent signups found
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
};

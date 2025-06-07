import React from "react";
import { useParams } from "react-router-dom";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
	const { deploymentId } = useParams<{ deploymentId: string }>();

	if (!deploymentId) {
		return <div>Deployment ID is required</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<AnalyticsDashboard deploymentId={parseInt(deploymentId)} />
		</div>
	);
}

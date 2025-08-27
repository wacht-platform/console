import { DnsVerificationPanel } from "@/components/dns-verification-panel";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useVerifyDnsRecords } from "@/lib/api/hooks/use-dns-verification";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

export default function DnsVerificationPage() {
	const { selectedDeployment, isLoading } = useProjects();
	const { mutate: verifyDnsRecords, isPending: isVerifying } =
		useVerifyDnsRecords();

	const handleVerify = () => {
		if (selectedDeployment?.id) {
			verifyDnsRecords({ deploymentId: selectedDeployment.id });
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px] w-full">
				<div className="flex flex-col items-center gap-4">
					<Spinner size="lg" />
					<span className="text-sm text-zinc-600 dark:text-zinc-400">Loading deployment details...</span>
				</div>
			</div>
		);
	}

	if (!selectedDeployment) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Text className="text-gray-500">
					No deployment selected. Please select a deployment first.
				</Text>
			</div>
		);
	}

	// Only show DNS verification for production deployments
	if (selectedDeployment.mode !== "production") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<Text className="text-gray-500 mb-2">
						DNS configuration is only available for production deployments.
					</Text>
					<Text className="text-sm text-gray-400">
						Create a production deployment to configure custom domain
						functionality.
					</Text>
				</div>
			</div>
		);
	}

	return (
			<DnsVerificationPanel
				domainRecords={selectedDeployment.domain_verification_records}
				emailRecords={selectedDeployment.email_verification_records}
				verificationStatus={selectedDeployment.verification_status}
				onVerify={handleVerify}
				isVerifying={isVerifying}
			/>
	);
}

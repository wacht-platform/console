import { DnsVerificationPanel } from "@/components/dns-verification-panel";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useVerifyDnsRecords } from "@/lib/api/hooks/use-dns-verification";
import {
	useUpdateSmtpConfig,
	useVerifySmtpConnection,
	useRemoveSmtpConfig,
} from "@/lib/api/hooks/use-smtp-config";
import { InlineLoader } from "@/components/ui/loading-screen";
import { toast } from "sonner";
import type { SmtpConfigRequest } from "@/types/deployment";

export default function DnsVerificationPage() {
	const { selectedDeployment, isLoading } = useProjects();
	const { mutate: verifyDnsRecords, isPending: isVerifying } =
		useVerifyDnsRecords();
	const { mutate: updateSmtpConfig, isPending: isSmtpSubmitting } =
		useUpdateSmtpConfig();
	const { mutate: verifySmtpConnection, isPending: isSmtpVerifying } =
		useVerifySmtpConnection();
	const { mutate: removeSmtpConfig, isPending: isSmtpRemoving } =
		useRemoveSmtpConfig();

	const handleVerify = () => {
		if (selectedDeployment?.id) {
			verifyDnsRecords({ deploymentId: selectedDeployment.id });
		}
	};

	const handleSmtpSubmit = (config: SmtpConfigRequest) => {
		if (selectedDeployment?.id) {
			updateSmtpConfig(
				{ deploymentId: selectedDeployment.id, config },
				{
					onSuccess: () => {
						toast.success("SMTP configuration saved successfully");
					},
					onError: (error) => {
						toast.error(`Failed to save SMTP configuration: ${error.message}`);
					},
				}
			);
		}
	};

	const handleSmtpVerify = (config: SmtpConfigRequest) => {
		if (selectedDeployment?.id) {
			verifySmtpConnection(
				{ deploymentId: selectedDeployment.id, config },
				{
					onSuccess: () => {
						toast.success("SMTP connection test successful");
					},
					onError: (error) => {
						toast.error(`SMTP connection failed: ${error.message}`);
					},
				}
			);
		}
	};

	const handleSmtpRemove = () => {
		if (selectedDeployment?.id) {
			removeSmtpConfig(selectedDeployment.id, {
				onSuccess: () => {
					toast.success("SMTP configuration removed, reverted to Postmark");
				},
				onError: (error) => {
					toast.error(`Failed to remove SMTP configuration: ${error.message}`);
				},
			});
		}
	};

	if (isLoading) {
		return <InlineLoader />;
	}

	if (!selectedDeployment) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-sm text-muted-foreground text-muted-foreground">
					No deployment selected. Please select a deployment first.
				</p>
			</div>
		);
	}

	// Only show DNS verification for production deployments
	if (selectedDeployment.mode !== "production") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-sm text-muted-foreground text-muted-foreground mb-2">
						DNS configuration is only available for production deployments.
					</p>
					<p className="text-sm text-muted-foreground text-sm text-muted-foreground/70">
						Create a production deployment to configure custom domain
						functionality.
					</p>
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
			emailProvider={selectedDeployment.email_provider}
			smtpConfig={selectedDeployment.custom_smtp_config}
			onSmtpSubmit={handleSmtpSubmit}
			onSmtpVerify={handleSmtpVerify}
			onSmtpRemove={handleSmtpRemove}
			isSmtpSubmitting={isSmtpSubmitting}
			isSmtpVerifying={isSmtpVerifying}
			isSmtpRemoving={isSmtpRemoving}
		/>
	);
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";

export default function Home() {
	const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
	const [isBillingSetupDialogOpen, setIsBillingSetupDialogOpen] = useState(false);
	const { data: billingAccount } = useBillingAccount();

	const handleCreateClick = () => {
		if (
			!billingAccount ||
			billingAccount.status === "cancelled" ||
			billingAccount.status === "failed"
		) {
			setIsBillingSetupDialogOpen(true);
		} else {
			setIsCreateProjectDialogOpen(true);
		}
	};

	return (
		<div className="p-10 max-w-7xl mx-auto flex flex-col justify-center items-center min-h-screen">
			<h1 className="text-xl font-bold mb-8">Authentication Form Builder</h1>
			<p className="text-muted-foreground mb-8 max-w-2xl text-center">
				Design and customize your authentication experience with our visual
				builder. Select the authentication methods you want to support and see a
				live preview of your sign-in form.
			</p>

			<Button onClick={handleCreateClick} color="blue" className="px-6 py-3">
				Design Authentication Experience
			</Button>

			<BillingSetupDialog
				open={isBillingSetupDialogOpen}
				onClose={() => setIsBillingSetupDialogOpen(false)}
			/>

			<CreateProjectDialog
				open={isCreateProjectDialogOpen}
				onClose={() => setIsCreateProjectDialogOpen(false)}
			/>
		</div>
	);
}

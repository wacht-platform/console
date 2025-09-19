import { useState } from "react";
import { Text } from "@/components/ui/text";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	CheckIcon,
	BeakerIcon,
	RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import XIcon from "@/assets/x.svg";
import { Dialog, DialogActions, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { toast } from 'sonner';
import clsx from "clsx";

type AuthMethod =
	| "email"
	| "phone"
	| "username"
	| "google_oauth"
	| "apple_oauth"
	| "facebook_oauth"
	| "microsoft_oauth"
	| "linkedin_oauth"
	| "discord_oauth"
	| "github_oauth"
	| "gitlab_oauth"
	| "x_oauth";

interface CreateStagingDeploymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateStagingDeployment: (authMethods: string[]) => void;
	isLoading?: boolean;
}

export function CreateStagingDeploymentDialog({
	open,
	onOpenChange,
	onCreateStagingDeployment,
	isLoading = false,
}: CreateStagingDeploymentDialogProps) {
	const [selectedMethods, setSelectedMethods] = useState<AuthMethod[]>([
		"email",
	]);

	const toggleAuthMethod = (method: AuthMethod) => {
		if (selectedMethods.includes(method)) {
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const handleCreate = async () => {
		try {
			await onCreateStagingDeployment(selectedMethods);
			toast.success("Staging deployment created successfully!");
			onOpenChange(false);
			setSelectedMethods(["email"]);
		} catch (error: unknown) {
			console.error("Failed to create staging deployment:", error);

			// Extract error message from response
			let errorMessage = "Failed to create staging deployment. Please try again.";
			if (error && typeof error === 'object' && 'response' in error) {
				const responseError = error as { response?: { data?: { message?: string } } };
				if (responseError.response?.data?.message) {
					errorMessage = responseError.response.data.message;
				}
			} else if (error && typeof error === 'object' && 'message' in error) {
				const messageError = error as { message: string };
				errorMessage = messageError.message;
			}

			toast.error(errorMessage);
		}
	};

	return (
		<Dialog size="4xl" open={open} onClose={() => onOpenChange(false)}>
			<DialogTitle>
				<div className="flex items-center gap-2">
					<BeakerIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
					Create Staging Deployment
				</div>
			</DialogTitle>
			<DialogBody>
				<div className="space-y-4">
					{/* Info Banner */}
					<div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
						<div className="flex gap-3">
							<RocketLaunchIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
							<div>
								<h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
									Staging Environment
								</h3>
								<Text className="text-sm text-orange-700 dark:text-orange-300 mt-1">
									Perfect for testing and development. You can create up to 3 staging deployments per project to test different configurations.
								</Text>
							</div>
						</div>
					</div>

					{/* Authentication Methods Section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
									Authentication Configuration
								</h3>
								<Text className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
									Select the authentication methods for this staging environment
								</Text>
							</div>
							{selectedMethods.length > 0 && (
								<span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
									{selectedMethods.length}
								</span>
							)}
						</div>

						{/* Traditional Methods */}
						<div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
							<div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
								<h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Traditional Authentication</h4>
							</div>
							<div className="p-3 space-y-1">
								<AuthMethodItem
									icon={<EnvelopeIcon className="h-5 w-5" />}
									label="Email"
									description="Sign in with email and password"
									selected={selectedMethods.includes("email")}
									onClick={() => toggleAuthMethod("email")}
								/>

								<AuthMethodItem
									icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
									label="Phone"
									description="Sign in with phone number"
									selected={selectedMethods.includes("phone")}
									onClick={() => toggleAuthMethod("phone")}
								/>

								<AuthMethodItem
									icon={<UserCircleIcon className="h-5 w-5" />}
									label="Username"
									description="Sign in with username"
									selected={selectedMethods.includes("username")}
									onClick={() => toggleAuthMethod("username")}
								/>
							</div>
						</div>

						{/* Social Methods */}
						<div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
							<div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
								<h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Social Login Providers</h4>
							</div>
							<div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-1">
								<AuthMethodItem
									icon={<img src={GoogleIcon} alt="Google" className="h-5 w-5" />}
									label="Google"
									description="Continue with Google"
									selected={selectedMethods.includes("google_oauth")}
									onClick={() => toggleAuthMethod("google_oauth")}
								/>

								<AuthMethodItem
									icon={<img src={MicrosoftIcon} alt="Microsoft" className="h-5 w-5" />}
									label="Microsoft"
									description="Continue with Microsoft"
									selected={selectedMethods.includes("microsoft_oauth")}
									onClick={() => toggleAuthMethod("microsoft_oauth")}
								/>

								<AuthMethodItem
									icon={<img src={GithubIcon} alt="GitHub" className="h-5 w-5" />}
									label="GitHub"
									description="Continue with GitHub"
									selected={selectedMethods.includes("github_oauth")}
									onClick={() => toggleAuthMethod("github_oauth")}
								/>

								<AuthMethodItem
									icon={<img src={DiscordIcon} alt="Discord" className="h-5 w-5" />}
									label="Discord"
									description="Continue with Discord"
									selected={selectedMethods.includes("discord_oauth")}
									onClick={() => toggleAuthMethod("discord_oauth")}
								/>

								<AuthMethodItem
									icon={<img src={LinkedInIcon} alt="LinkedIn" className="h-5 w-5" />}
									label="LinkedIn"
									description="Continue with LinkedIn"
									selected={selectedMethods.includes("linkedin_oauth")}
									onClick={() => toggleAuthMethod("linkedin_oauth")}
								/>

								<AuthMethodItem
									icon={<img src={GitlabIcon} alt="GitLab" className="h-5 w-5" />}
									label="GitLab"
									description="Continue with GitLab"
									selected={selectedMethods.includes("gitlab_oauth")}
									onClick={() => toggleAuthMethod("gitlab_oauth")}
								/>

								<AuthMethodItem
									icon={<img src={XIcon} alt="X" className="h-5 w-5" />}
									label="X (Twitter)"
									description="Continue with X"
									selected={selectedMethods.includes("x_oauth")}
									onClick={() => toggleAuthMethod("x_oauth")}
								/>
							</div>
						</div>
					</div>
				</div>
			</DialogBody>

			<DialogActions>
				<Button outline onClick={() => onOpenChange(false)} disabled={isLoading}>
					Cancel
				</Button>
				<Button
					onClick={handleCreate}
					disabled={isLoading || selectedMethods.length === 0}
					className="min-w-[180px]"
				>
					{isLoading ? "Creating..." : "Create Staging Deployment"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function AuthMethodItem({
	icon,
	label,
	description,
	selected,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	description: string;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<div 
			className={clsx(
				"relative flex items-center gap-2.5 p-2.5 rounded-lg transition-all cursor-pointer border",
				selected
					? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
					: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
				selected
					? "bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-400"
					: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
			)}>
				{icon}
			</span>
			<div className="flex-1 min-w-0">
				<h3 className={clsx(
					"text-sm font-medium leading-tight",
					selected ? "text-orange-900 dark:text-orange-100" : "text-zinc-900 dark:text-white"
				)}>
					{label}
				</h3>
				<p className={clsx(
					"text-[11px] truncate",
					selected ? "text-orange-700 dark:text-orange-300" : "text-zinc-500 dark:text-zinc-400"
				)}>
					{description}
				</p>
			</div>
			{selected && (
				<CheckIcon className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
			)}
		</div>
	);
}
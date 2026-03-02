import { useState } from "react";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	CheckCircleIcon,
	BeakerIcon,
	RocketLaunchIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import XIcon from "@/assets/x.svg";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
	const showPhonePrepaidWarning = selectedMethods.includes("phone");

	const toggleAuthMethod = (method: AuthMethod) => {
		if (selectedMethods.includes(method)) {
			if (selectedMethods.length === 1) return;
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const handleCreate = async () => {
		try {
			onCreateStagingDeployment(selectedMethods);
			toast.success("Staging deployment created successfully!");
			onOpenChange(false);
			setSelectedMethods(["email"]);
		} catch (error: unknown) {
			console.error("Failed to create staging deployment:", error);
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BeakerIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
						Create Staging Deployment
					</DialogTitle>
					<DialogDescription>
						Set up a test environment for development and QA.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Info Banner */}
					<div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-900/20">
						<div className="flex gap-3">
							<div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0 h-fit">
								<RocketLaunchIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<h3 className="text-sm font-normal text-orange-900 dark:text-orange-100">
									Development Environment
								</h3>
								<Text className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1 leading-relaxed">
									Staging deployments are perfect for testing changes safely. You can create up to 3 staging environments per project. They come with a generated <code>.wacht.app</code> domain.
								</Text>
							</div>
						</div>
					</div>

					{/* Authentication Methods Section */}
					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
								Authentication Configuration
							</h3>
							<span className="text-xs text-zinc-500">
								{selectedMethods.length} selected
							</span>
						</div>

						<div className="space-y-3">
							<div className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Identity Providers</div>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<AuthMethodCard
									icon={<EnvelopeIcon className="h-5 w-5" />}
									label="Email"
									selected={selectedMethods.includes("email")}
									onClick={() => toggleAuthMethod("email")}
								/>
								<AuthMethodCard
									icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
									label="Phone"
									selected={selectedMethods.includes("phone")}
									onClick={() => toggleAuthMethod("phone")}
								/>
								<AuthMethodCard
									icon={<UserCircleIcon className="h-5 w-5" />}
									label="Username"
									selected={selectedMethods.includes("username")}
									onClick={() => toggleAuthMethod("username")}
								/>
							</div>
						</div>

						<div className="space-y-3 pt-2">
							<div className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Social Providers</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
								<AuthMethodCard
									icon={<img src={GoogleIcon} alt="Google" className="h-5 w-5" />}
									label="Google"
									selected={selectedMethods.includes("google_oauth")}
									onClick={() => toggleAuthMethod("google_oauth")}
									compact
								/>
								<AuthMethodCard
									icon={<img src={GithubIcon} alt="GitHub" className="h-5 w-5" />}
									label="GitHub"
									selected={selectedMethods.includes("github_oauth")}
									onClick={() => toggleAuthMethod("github_oauth")}
									compact
								/>
								<AuthMethodCard
									icon={<img src={DiscordIcon} alt="Discord" className="h-5 w-5" />}
									label="Discord"
									selected={selectedMethods.includes("discord_oauth")}
									onClick={() => toggleAuthMethod("discord_oauth")}
									compact
								/>
								<AuthMethodCard
									icon={<img src={LinkedInIcon} alt="LinkedIn" className="h-5 w-5" />}
									label="LinkedIn"
									selected={selectedMethods.includes("linkedin_oauth")}
									onClick={() => toggleAuthMethod("linkedin_oauth")}
									compact
								/>
								<AuthMethodCard
									icon={<img src={GitlabIcon} alt="GitLab" className="h-5 w-5" />}
									label="GitLab"
									selected={selectedMethods.includes("gitlab_oauth")}
									onClick={() => toggleAuthMethod("gitlab_oauth")}
									compact
								/>
								<AuthMethodCard
									icon={<img src={XIcon} alt="X" className="h-5 w-5" />}
									label="X (Twitter)"
									selected={selectedMethods.includes("x_oauth")}
									onClick={() => toggleAuthMethod("x_oauth")}
									compact
								/>
							</div>
						</div>

						{showPhonePrepaidWarning && (
							<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
								<ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
								<span>
									Phone auth can be configured now, but SMS delivery requires a prepaid recharge first.
								</span>
							</div>
						)}
					</section>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={isLoading || selectedMethods.length === 0}
						className="min-w-[140px] bg-orange-600 hover:bg-orange-700 text-white"
					>
						{isLoading ? (
							<div className="flex items-center gap-2">
								<Spinner size="sm" />
								<span>Creating...</span>
							</div>
						) : (
							"Create Staging"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function AuthMethodCard({
	icon,
	label,
	selected,
	onClick,
	compact = false,
}: {
	icon: React.ReactNode;
	label: string;
	selected: boolean;
	onClick: () => void;
	compact?: boolean;
}) {
	return (
		<div
			className={clsx(
				"relative flex items-center gap-3 rounded-lg transition-all cursor-pointer border select-none",
				compact ? "p-2.5" : "p-3",
				selected
					? "bg-orange-50/50 dark:bg-orange-500/10 border-orange-500 dark:border-orange-500/50 shadow-sm ring-1 ring-orange-500/20"
					: "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex shrink-0 items-center justify-center rounded-md transition-colors",
				compact ? "h-6 w-6" : "h-8 w-8",
				selected
					? "bg-white dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm"
					: "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
			)}>
				{icon}
			</span>
			<span className={clsx(
				"flex-1 font-medium truncate",
				compact ? "text-xs" : "text-sm",
				selected ? "text-orange-900 dark:text-orange-100" : "text-zinc-700 dark:text-zinc-300"
			)}>
				{label}
			</span>

			{selected && (
				<div className="absolute top-0 right-0 -mt-1 -mr-1">
					<div className="bg-orange-500 text-white rounded-full p-0.5 shadow-sm">
						<CheckCircleIcon className="h-3 w-3" />
					</div>
				</div>
			)}
		</div>
	);
}

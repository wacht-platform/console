import { useEffect, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/app-spinner";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	ArrowPathIcon,
	CheckCircleIcon,
	BeakerIcon,
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
import { billingAccountHasFeature, useBillingAccount } from "@/lib/api/hooks/use-billing";

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
	onCreateStagingDeployment: (authMethods: string[]) => Promise<void>;
	isLoading?: boolean;
}

type AuthOption = {
	method: AuthMethod;
	label: string;
	icon: ReactNode;
	compact?: boolean;
};

const IDENTITY_OPTIONS: AuthOption[] = [
	{
		method: "email",
		label: "Email",
		icon: <EnvelopeIcon className="h-5 w-5" />,
	},
	{
		method: "phone",
		label: "Phone",
		icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
	},
	{
		method: "username",
		label: "Username",
		icon: <UserCircleIcon className="h-5 w-5" />,
	},
];

const SOCIAL_OPTIONS: AuthOption[] = [
	{
		method: "google_oauth",
		label: "Google",
		icon: <img src={GoogleIcon} alt="Google" className="h-5 w-5" />,
		compact: true,
	},
	{
		method: "github_oauth",
		label: "GitHub",
		icon: <img src={GithubIcon} alt="GitHub" className="h-5 w-5" />,
		compact: true,
	},
	{
		method: "discord_oauth",
		label: "Discord",
		icon: <img src={DiscordIcon} alt="Discord" className="h-5 w-5" />,
		compact: true,
	},
	{
		method: "linkedin_oauth",
		label: "LinkedIn",
		icon: <img src={LinkedInIcon} alt="LinkedIn" className="h-5 w-5" />,
		compact: true,
	},
	{
		method: "gitlab_oauth",
		label: "GitLab",
		icon: <img src={GitlabIcon} alt="GitLab" className="h-5 w-5" />,
		compact: true,
	},
	{
		method: "x_oauth",
		label: "X (Twitter)",
		icon: <img src={XIcon} alt="X" className="h-5 w-5" />,
		compact: true,
	},
];

export function CreateStagingDeploymentDialog({
	open,
	onOpenChange,
	onCreateStagingDeployment,
	isLoading = false,
}: CreateStagingDeploymentDialogProps) {
	const [selectedMethods, setSelectedMethods] = useState<AuthMethod[]>(["email"]);
	const { data: billingAccount, isLoading: isBillingLoading } = useBillingAccount();
	const phoneAuthAvailable =
		!isBillingLoading && billingAccountHasFeature(billingAccount, "phone_auth");
	const showPhonePrepaidWarning = selectedMethods.includes("phone");
	const canResetToDefault =
		selectedMethods.length !== 1 || selectedMethods[0] !== "email";

	useEffect(() => {
		if (!phoneAuthAvailable && selectedMethods.includes("phone")) {
			setSelectedMethods((methods) => methods.filter((method) => method !== "phone"));
		}
	}, [phoneAuthAvailable, selectedMethods]);

	const toggleAuthMethod = (method: AuthMethod) => {
		if (selectedMethods.includes(method)) {
			if (selectedMethods.length === 1) return;
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const resetToDefault = () => {
		setSelectedMethods(["email"]);
	};

	const handleCreate = async () => {
		if (!phoneAuthAvailable && selectedMethods.includes("phone")) {
			setSelectedMethods(selectedMethods.filter((method) => method !== "phone"));
			toast.error("Phone authentication is not available on the current plan");
			return;
		}

		try {
			await onCreateStagingDeployment(selectedMethods);
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
			<DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-border">
				<div className="relative">
					<div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
					<div className="absolute -left-20 -bottom-20 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

					<DialogHeader className="mx-0 mt-0 border-b border-border px-6 pb-4 pt-6">
						<div className="flex items-start justify-between gap-4">
							<div>
								<DialogTitle className="flex items-center gap-2 text-base">
									<BeakerIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
									Create Staging Deployment
								</DialogTitle>
								<DialogDescription className="mt-1 text-muted-foreground">
									Set up a controlled test environment before shipping to production.
								</DialogDescription>
							</div>
							<span className="rounded-full border border-orange-300/70 bg-orange-100/80 px-2.5 py-1 text-[10px] uppercase tracking-wider text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300">
								Staging
							</span>
						</div>
					</DialogHeader>

					<div className="space-y-5 p-6">

						<section className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium text-foreground">
									Authentication Configuration
								</h3>
								<div className="flex items-center gap-3">
									<span className="text-xs text-muted-foreground">
										{selectedMethods.length} selected
									</span>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										className="h-7 px-2 text-xs text-muted-foreground"
										onClick={resetToDefault}
										disabled={!canResetToDefault || isLoading}
									>
										<ArrowPathIcon className="mr-1 h-3.5 w-3.5" />
										Reset
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<div className="ml-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
									Identity Providers
								</div>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
									{IDENTITY_OPTIONS.filter(
										(option) => option.method !== "phone" || phoneAuthAvailable,
									).map((option) => (
										<AuthMethodCard
											key={option.method}
											icon={option.icon}
											label={option.label}
											selected={selectedMethods.includes(option.method)}
											onClick={() => toggleAuthMethod(option.method)}
										/>
									))}
								</div>
							</div>

							<div className="space-y-2 pt-1">
								<div className="ml-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
									Social Providers
								</div>
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
									{SOCIAL_OPTIONS.map((option) => (
										<AuthMethodCard
											key={option.method}
											icon={option.icon}
											label={option.label}
											selected={selectedMethods.includes(option.method)}
											onClick={() => toggleAuthMethod(option.method)}
											compact={option.compact}
										/>
									))}
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
				</div>

				<DialogFooter className="mx-0 mb-0 rounded-none border-t border-border bg-secondary px-6 py-4">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={isLoading || selectedMethods.length === 0}
						className="min-w-[140px] bg-orange-600 hover:bg-orange-700 text-primary-foreground"
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
		<button
			type="button"
			aria-pressed={selected}
			className={clsx(
				"relative flex w-full items-center gap-3 rounded-lg border text-left transition-all select-none",
				compact ? "p-2.5" : "p-3",
				selected
					? "bg-orange-50/50 dark:bg-orange-500/10 border-orange-500 dark:border-orange-500/50 shadow-sm ring-1 ring-orange-500/20"
					: "bg-card border-border dark:border-border hover:border-border hover:bg-secondary"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex shrink-0 items-center justify-center rounded-md transition-colors",
				compact ? "h-6 w-6" : "h-8 w-8",
				selected
					? "bg-card dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm"
					: "bg-secondary text-muted-foreground"
			)}>
				{icon}
			</span>
			<span className={clsx(
				"flex-1 font-medium truncate",
				compact ? "text-xs" : "text-sm",
				selected ? "text-orange-900 dark:text-orange-100" : "text-foreground"
			)}>
				{label}
			</span>

			{selected && (
				<div className="absolute top-0 right-0 -mt-1 -mr-1">
					<div className="bg-orange-500 text-primary-foreground rounded-full p-0.5 shadow-sm">
						<CheckCircleIcon className="h-3 w-3" />
					</div>
				</div>
			)}
		</button>
	);
}

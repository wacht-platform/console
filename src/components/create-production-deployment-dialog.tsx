import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Field, Label } from "@/components/ui/fieldset";
import { Button } from "./ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	GlobeAltIcon,
	CheckCircleIcon,
	ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import { useCreateProductionDeployment } from "@/lib/api/hooks/use-projects";
import { toast } from 'sonner';
import clsx from "clsx";

type AuthMethod =
	| "email"
	| "phone"
	| "username"
	| "google_oauth"
	| "microsoft_oauth"
	| "linkedin_oauth"
	| "discord_oauth"
	| "github_oauth"
	| "gitlab_oauth";

interface CreateProductionDeploymentDialogProps {
	open: boolean;
	onClose: () => void;
	projectId: string;
}

export function CreateProductionDeploymentDialog({
	open,
	onClose,
	projectId,
}: CreateProductionDeploymentDialogProps) {
	const [customDomain, setCustomDomain] = useState("");
	const [selectedMethods, setSelectedMethods] = useState<AuthMethod[]>([
		"email",
	]);
	const { createProductionDeployment, isLoading } =
		useCreateProductionDeployment();

	const toggleAuthMethod = (method: AuthMethod) => {
		if (selectedMethods.includes(method)) {
			// Prevent deselecting if it's the last method
			if (selectedMethods.length === 1) return;
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const [validationError, setValidationError] = useState<string>("");

	const validateDomain = (domain: string): string | null => {
		const trimmedDomain = domain.trim();

		if (!trimmedDomain) {
			return "Please enter a custom domain";
		}

		// Check for invalid characters
		if (trimmedDomain.includes("://") || trimmedDomain.includes("/") ||
			trimmedDomain.includes("?") || trimmedDomain.includes("#")) {
			return "Domain should not include protocol (http/https) or path";
		}

		// Basic domain format validation
		const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
		if (!domainRegex.test(trimmedDomain)) {
			return "Please enter a valid domain name (e.g., example.com)";
		}

		// Check minimum domain structure
		const parts = trimmedDomain.split(".");
		if (parts.length < 2) {
			return "Domain must have at least two parts (e.g., example.com)";
		}

		return null;
	};

	const handleCreate = async () => {
		const validationErr = validateDomain(customDomain);
		if (validationErr) {
			setValidationError(validationErr);
			return;
		}

		setValidationError("");

		try {
			await createProductionDeployment({
				projectId,
				customDomain: customDomain.trim(),
				authMethods: selectedMethods,
			});
			toast.success("Production deployment created successfully!");
			onClose();
			setCustomDomain("");
			setSelectedMethods(["email"]);
		} catch (error: unknown) {
			console.error("Failed to create production deployment:", error);

			// Extract error message from response
			let errorMessage = "Failed to create production deployment. Please try again.";
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
			setValidationError(errorMessage);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(openStart) => !openStart && onClose()}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
						Create Production Deployment
					</DialogTitle>
					<DialogDescription>
						Configure your production environment with a custom domain.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-8 mt-4">
					<section className="space-y-4">
						<div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
							<Field>
								<Label className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
									<GlobeAltIcon className="h-4 w-4 text-zinc-500" />
									Custom Domain
								</Label>
								<div className="relative mt-2">
									<Input
										type="text"
										placeholder="app.yourcompany.com"
										className={clsx(
											"w-full pl-3 pr-10 py-2.5",
											validationError ? "border-red-500 focus:ring-red-500" : ""
										)}
										value={customDomain}
										onChange={(e) => {
											setCustomDomain(e.target.value);
											if (validationError) {
												setValidationError("");
											}
										}}
										autoFocus
									/>
								</div>
								{validationError ? (
									<Text className="text-xs text-red-600 dark:text-red-400 mt-1.5 pl-1">
										{validationError}
									</Text>
								) : (
									<Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 pl-1">
										This will be the primary entry point for your users.
									</Text>
								)}
							</Field>
						</div>
					</section>

					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
								Authentication Methods
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
							</div>
						</div>
					</section>
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={isLoading || !customDomain.trim() || selectedMethods.length === 0}
						className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
					>
						{isLoading ? (
							<div className="flex items-center gap-2">
								<Spinner size="sm" />
								<span>Creating...</span>
							</div>
						) : (
							"Create Deployment"
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
					? "bg-green-50/50 dark:bg-green-500/10 border-green-500 dark:border-green-500/50 shadow-sm ring-1 ring-green-500/20"
					: "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex shrink-0 items-center justify-center rounded-md transition-colors",
				compact ? "h-6 w-6" : "h-8 w-8",
				selected
					? "bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-sm"
					: "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
			)}>
				{icon}
			</span>
			<span className={clsx(
				"flex-1 font-medium truncate",
				compact ? "text-xs" : "text-sm",
				selected ? "text-green-900 dark:text-green-100" : "text-zinc-700 dark:text-zinc-300"
			)}>
				{label}
			</span>

			{selected && (
				<div className="absolute top-0 right-0 -mt-1 -mr-1">
					<div className="bg-green-500 text-white rounded-full p-0.5 shadow-sm">
						<CheckCircleIcon className="h-3 w-3" />
					</div>
				</div>
			)}
		</div>
	);
}

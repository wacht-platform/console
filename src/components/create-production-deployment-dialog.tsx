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
import { motion, AnimatePresence } from "framer-motion";

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
			<DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
				<div className="relative">
					{/* Decorative background gradients - Green theme */}
					<div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
					<div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

					<DialogHeader className="p-8 pb-4 relative z-10">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 shadow-sm">
								<ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
							</div>
							<DialogTitle className="text-xl font-normal text-zinc-900 dark:text-zinc-100">
								Create Production Deployment
							</DialogTitle>
						</div>
						<DialogDescription className="text-base text-zinc-500 dark:text-zinc-400 font-normal ml-1">
							Configure your production environment's secure entry point.
						</DialogDescription>
					</DialogHeader>

					<div className="px-8 py-4 space-y-8 relative z-10">
						<section className="space-y-4">
							<div className="flex items-center gap-2">
								<div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
								<span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Environment Details</span>
								<div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
							</div>

							<div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
								<Field className="space-y-2 p-3">
									<Label className="flex items-center gap-2 text-sm font-normal text-zinc-600 dark:text-zinc-400">
										<GlobeAltIcon className="h-4 w-4 text-zinc-400" />
										Custom Domain
									</Label>
									<div className="relative">
										<Input
											type="text"
											placeholder="app.yourcompany.com"
											className={clsx(
												"w-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-green-500/20 focus:border-green-500/50 transition-all rounded-lg py-2.5 pl-3",
												validationError ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""
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
										<Text className="text-xs text-red-600 dark:text-red-400 pl-1">
											{validationError}
										</Text>
									) : (
										<Text className="text-xs text-zinc-400 dark:text-zinc-500 pl-1">
											This will be the primary entry point for your users.
										</Text>
									)}
								</Field>
							</div>
						</section>

						<section className="space-y-5">
							<div className="flex items-center gap-2">
								<div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
								<span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Authentication Methods</span>
								<div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
							</div>

							<div className="space-y-4">
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

								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

					<DialogFooter className="p-8 pt-6 pb-8 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30">
						<Button
							variant="ghost"
							onClick={onClose}
							disabled={isLoading}
							className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={isLoading || !customDomain.trim() || selectedMethods.length === 0}
							className={clsx(
								"min-w-[160px] shadow-lg shadow-green-500/10 transition-all duration-300",
								!customDomain.trim() || selectedMethods.length === 0 || isLoading
									? "opacity-50 cursor-not-allowed"
									: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transform hover:translate-y-[-1px]"
							)}
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<Spinner size="sm" className="text-white" />
									<span>Creating...</span>
								</div>
							) : (
								"Create Deployment"
							)}
						</Button>
					</DialogFooter>
				</div>
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
		<motion.div
			whileHover={{ y: -1, scale: 1.01 }}
			whileTap={{ scale: 0.98 }}
			className={clsx(
				"relative flex items-center gap-3 rounded-xl transition-all cursor-pointer border select-none overflow-hidden",
				compact ? "p-2.5" : "p-3",
				selected
					? "bg-green-50/80 dark:bg-green-500/10 border-green-500/30 shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)] ring-1 ring-green-500/20"
					: "bg-white dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-sm"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex shrink-0 items-center justify-center rounded-lg transition-colors",
				compact ? "h-6 w-6" : "h-8 w-8",
				selected
					? "bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-sm"
					: "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
			)}>
				{icon}
			</span>
			<span className={clsx(
				"flex-1 font-medium truncate",
				compact ? "text-xs" : "text-sm",
				selected ? "text-green-900 dark:text-green-100" : "text-zinc-600 dark:text-zinc-400"
			)}>
				{label}
			</span>

			<AnimatePresence>
				{selected && (
					<motion.div
						initial={{ opacity: 0, scale: 0 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0 }}
						className="absolute top-2 right-2"
					>
						<div className="bg-green-500 text-white rounded-full p-0.5 shadow-sm">
							<CheckCircleIcon className="h-3 w-3" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

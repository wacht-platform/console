import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usePostHog } from "@posthog/react";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	CheckCircleIcon,
	RocketLaunchIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/fieldset";
import { Field } from "@/components/ui/fieldset";
import clsx from "clsx";
import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import { Button } from "./ui/button";
import { useProjects } from "@/lib/api/hooks/use-projects";
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

interface CreateProjectDialogProps {
	open: boolean;
	onClose: () => void;
}

export function CreateProjectDialog({
	open,
	onClose,
}: CreateProjectDialogProps) {
	const [appName, setAppName] = useState("");
	const [selectedMethods, setSelectedMethods] = useState<AuthMethod[]>([
		"email",
	]);
	const [loading, setLoading] = useState(false);
	const { createProject } = useProjects();
	const posthog = usePostHog();
	const showPhonePrepaidWarning = selectedMethods.includes("phone");

	const toggleAuthMethod = (method: AuthMethod) => {
		if (selectedMethods.includes(method)) {
			// Prevent deselecting if it's the last method
			if (selectedMethods.length === 1) return;
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const handleContinue = async () => {
		setLoading(true);
		try {
			const formData = new FormData();
			for (const method of selectedMethods) {
				formData.append("methods", method);
			}

			formData.append("name", appName);

			await createProject(formData);
			posthog?.capture("project_created", {
				project_name: appName,
				auth_methods: selectedMethods,
				auth_method_count: selectedMethods.length,
			});
			onClose();
			// Reset form
			setAppName("");
			setSelectedMethods(["email"]);
		} catch (error) {
			console.error(error);
			posthog?.captureException(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
				<div className="relative">
					{/* Decorative background gradients */}
					<div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
					<div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

					<DialogHeader className="p-8 pb-4 relative z-10">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm">
								<RocketLaunchIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
							</div>
							<DialogTitle className="text-xl font-normal text-zinc-900 dark:text-zinc-100">
								Create New Project
							</DialogTitle>
						</div>
						<DialogDescription className="text-base text-zinc-500 dark:text-zinc-400 font-normal ml-1">
							Establish your project's identity and security foundation.
						</DialogDescription>
					</DialogHeader>

					<div className="px-8 py-4 space-y-8 relative z-10">
						{/* Project Details Section */}
						<section className="space-y-4">
							<div className="flex items-center gap-2">
								<div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
								<span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Project Details</span>
								<div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
							</div>

							{/* Project Name */}
							<Field className="space-y-2">
								<Label className="text-sm font-normal text-zinc-600 dark:text-zinc-400">Project Name</Label>
								<Input
									type="text"
									placeholder="e.g., Acme Dashboard"
									className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all rounded-xl py-2.5"
									value={appName}
									onChange={(e) => setAppName(e.target.value)}
									autoFocus
								/>
							</Field>
						</section>

						{/* Authentication Methods Section */}
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

								{showPhonePrepaidWarning && (
									<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
										<ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
										<span>
											Phone auth can be configured now, but SMS delivery requires a prepaid recharge first.
										</span>
									</div>
								)}
							</div>
						</section>
					</div>

					<DialogFooter className="p-8 pt-6 pb-8 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30">
						<Button
							variant="ghost"
							onClick={onClose}
							className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
						>
							Cancel
						</Button>
						<Button
							onClick={handleContinue}
							disabled={!appName || selectedMethods.length === 0 || loading}
							className={clsx(
								"min-w-[140px] shadow-lg shadow-blue-500/10 transition-all duration-300",
								!appName || selectedMethods.length === 0 || loading
									? "opacity-50 cursor-not-allowed"
									: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transform hover:translate-y-[-1px]"
							)}
						>
							{loading ? (
								<div className="flex items-center gap-2">
									<Spinner size="sm" className="text-white" />
									<span>Creating...</span>
								</div>
							) : (
								"Create Project"
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
					? "bg-blue-50/80 dark:bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
					: "bg-white dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-sm"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex shrink-0 items-center justify-center rounded-lg transition-colors",
				compact ? "h-6 w-6" : "h-8 w-8",
				selected
					? "bg-white dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm"
					: "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
			)}>
				{icon}
			</span>
			<span className={clsx(
				"flex-1 font-medium truncate",
				compact ? "text-xs" : "text-sm",
				selected ? "text-blue-900 dark:text-blue-100" : "text-zinc-600 dark:text-zinc-400"
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
						<div className="bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
							<CheckCircleIcon className="h-3 w-3" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

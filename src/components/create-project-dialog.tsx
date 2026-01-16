import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	CheckCircleIcon,
	CloudArrowUpIcon,
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
// import MicrosoftIcon from "@/assets/microsoft.svg";
import { Button } from "./ui/button";
import { useProjects } from "@/lib/api/hooks/use-projects";

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
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const logoInputRef = useRef<HTMLInputElement>(null);
	const { createProject } = useProjects();

	const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setLogoFile(file);
			const url = URL.createObjectURL(file);
			setLogoUrl(url);
		}
	};

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
			if (logoFile) {
				formData.append("logo", logoFile);
			}
			for (const method of selectedMethods) {
				formData.append("methods", method);
			}

			formData.append("name", appName);

			await createProject(formData);
			onClose();
			// Reset form
			setAppName("");
			setLogoUrl(null);
			setLogoFile(null);
			setSelectedMethods(["email"]);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Create New Project</DialogTitle>
					<DialogDescription>
						Set up your project's identity and authentication methods.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-8 mt-4">
					{/* Project Details Section */}
					<section className="space-y-4">
						<h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
							<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">1</span>
							Project Details
						</h3>

						<div className="flex gap-6 items-start p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
							{/* Logo Upload */}
							<div className="flex flex-col items-center gap-2 shrink-0">
								<button
									type="button"
									className={clsx(
										"w-20 h-20 rounded-2xl border-2 border-dashed transition-all duration-200",
										logoUrl
											? "border-blue-500/50 p-0.5"
											: "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-zinc-800",
										"flex items-center justify-center cursor-pointer overflow-hidden relative group bg-white dark:bg-zinc-900"
									)}
									onClick={() => logoInputRef.current?.click()}
								>
									{logoUrl ? (
										<img
											src={logoUrl}
											alt="App logo"
											className="w-full h-full object-cover rounded-[14px]"
										/>
									) : (
										<div className="flex flex-col items-center gap-1.5 p-2">
											<CloudArrowUpIcon className="h-6 w-6 text-zinc-400 group-hover:text-blue-500 transition-colors" />
											<span className="text-[9px] font-medium text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 uppercase tracking-wide">Upload</span>
										</div>
									)}
									{logoUrl && (
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[14px]">
											<span className="text-xs text-white font-medium">Change</span>
										</div>
									)}
								</button>
								<input
									type="file"
									ref={logoInputRef}
									className="hidden"
									accept="image/*"
									onChange={handleLogoUpload}
								/>
							</div>

							{/* Project Name */}
							<Field className="flex-1">
								<Label>Project Name</Label>
								<Input
									type="text"
									placeholder="e.g., Acme Dashboard"
									className="w-full mt-1.5"
									value={appName}
									onChange={(e) => setAppName(e.target.value)}
									autoFocus
								/>
								<Text className="text-xs text-zinc-500 mt-1.5">
									This name will be displayed to users on the sign-in page.
								</Text>
							</Field>
						</div>
					</section>

					{/* Authentication Methods Section */}
					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">2</span>
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
								{/* Microsoft OAuth temporarily disabled - unverified credentials */}
								{/* <AuthMethodCard
						icon={<img src={MicrosoftIcon} alt="Microsoft" className="h-5 w-5" />}
						label="Microsoft"
						selected={selectedMethods.includes("microsoft_oauth")}
						onClick={() => toggleAuthMethod("microsoft_oauth")}
						compact
					/> */}
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
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={handleContinue}
						disabled={!appName || selectedMethods.length === 0 || loading}
						className="min-w-[120px]"
					>
						{loading ? (
							<div className="flex items-center gap-2">
								<Spinner size="sm" />
								<span>Creating...</span>
							</div>
						) : (
							"Create Project"
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
					? "bg-blue-50/50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-500/50 shadow-sm ring-1 ring-blue-500/20"
					: "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex shrink-0 items-center justify-center rounded-md transition-colors",
				compact ? "h-6 w-6" : "h-8 w-8",
				selected
					? "bg-white dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm"
					: "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
			)}>
				{icon}
			</span>
			<span className={clsx(
				"flex-1 font-medium truncate",
				compact ? "text-xs" : "text-sm",
				selected ? "text-blue-900 dark:text-blue-100" : "text-zinc-700 dark:text-zinc-300"
			)}>
				{label}
			</span>

			{selected && (
				<div className="absolute top-0 right-0 -mt-1 -mr-1">
					<div className="bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
						<CheckCircleIcon className="h-3 w-3" />
					</div>
				</div>
			)}
		</div>
	);
}
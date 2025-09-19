import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
	PhotoIcon,
	CheckIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogActions, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Label } from "@/components/ui/fieldset";
import { Field } from "@/components/ui/fieldset";
import clsx from "clsx";
import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
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
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const handleContinue = async () => {
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
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Dialog size="4xl" open={open} onClose={onClose}>
			<DialogTitle>
				<div className="flex items-center gap-2">
					<SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					Create New Project
				</div>
			</DialogTitle>
			<DialogBody>
				<div className="space-y-4">
					{/* Project Details Section */}
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
						<h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
							<div className="h-6 w-6 rounded-md bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
								<span className="text-white text-xs font-bold">1</span>
							</div>
							Project Information
						</h3>
						<div className="flex items-start gap-4">
							{/* Logo Upload */}
							<div className="flex flex-col items-center gap-2">
								<button
									type="button"
									className={clsx(
										"w-20 h-20 rounded-lg border-2 border-dashed transition-all",
										logoUrl
											? "border-blue-500 bg-white dark:bg-zinc-900"
											: "border-zinc-300 dark:border-zinc-600 hover:border-blue-500 hover:bg-white dark:hover:bg-zinc-900",
										"flex items-center justify-center cursor-pointer overflow-hidden relative group"
									)}
									onClick={() => logoInputRef.current?.click()}
									aria-label="Upload logo"
								>
									{logoUrl ? (
										<img
											src={logoUrl}
											alt="App logo"
											className="w-full h-full object-cover rounded-lg"
										/>
									) : (
										<div className="text-center">
											<PhotoIcon className="h-6 w-6 mx-auto text-zinc-400 group-hover:text-blue-500 transition-colors" />
											<span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">Upload</span>
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
									placeholder="Enter your project name"
									className="w-full mt-1"
									value={appName}
									onChange={(e) => setAppName(e.target.value)}
								/>
								<Text className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
									Choose a memorable name that your users will recognize
								</Text>
							</Field>
						</div>
					</div>

					{/* Authentication Methods Section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="h-6 w-6 rounded-md bg-green-600 dark:bg-green-500 flex items-center justify-center">
									<span className="text-white text-xs font-bold">2</span>
								</div>
								<div>
									<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
										Authentication Methods
									</h3>
									<Text className="text-sm text-zinc-600 dark:text-zinc-400">
										Select how users can access your application
									</Text>
								</div>
							</div>
							{selectedMethods.length > 0 && (
								<span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
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
							</div>
						</div>
					</div>
				</div>
			</DialogBody>
			<DialogActions>
				<Button outline onClick={onClose}>
					Cancel
				</Button>
				<Button 
					onClick={handleContinue}
					disabled={!appName || selectedMethods.length === 0}
					className="min-w-[120px]"
				>
					Create Project
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
					? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
					: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
			)}
			onClick={onClick}
		>
			<span className={clsx(
				"flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
				selected
					? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400"
					: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
			)}>
				{icon}
			</span>
			<div className="flex-1 min-w-0">
				<h3 className={clsx(
					"text-sm font-medium leading-tight",
					selected ? "text-blue-900 dark:text-blue-100" : "text-zinc-900 dark:text-white"
				)}>
					{label}
				</h3>
				<p className={clsx(
					"text-[11px] truncate",
					selected ? "text-blue-700 dark:text-blue-300" : "text-zinc-500 dark:text-zinc-400"
				)}>
					{description}
				</p>
			</div>
			{selected && (
				<CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
			)}
		</div>
	);
}
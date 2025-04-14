import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Label } from "@/components/ui/fieldset";
import { Field } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";
import AppleIcon from "@/assets/apple.svg";
import DiscordIcon from "@/assets/discord.svg";
import FacebookIcon from "@/assets/facebook.svg";
import GithubIcon from "@/assets/github.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import { Button } from "./ui/button";
import { useProjects } from "@/lib/api/hooks/use-projects";

type AuthMethod =
	| "email"
	| "phone"
	| "username"
	| "google"
	| "apple"
	| "facebook"
	| "github"
	| "microsoft"
	| "discord"
	| "linkedin";

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
		<Dialog size="3xl" open={open} onClose={onClose}>
			<div className="md:col-span-3 border-dashed border-zinc-200 dark:border-zinc-700">
				<div className="space-y-4">
					<Field>
						<Label className="font-normal">Project name</Label>
						<Text className="text-sm text-zinc-500 dark:text-zinc-400">
							Set your project name and logo
						</Text>
						<div className="flex items-center gap-4 mt-2">
							<div className="shrink-0">
								<button
									type="button"
									className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 overflow-hidden relative"
									onClick={() => logoInputRef.current?.click()}
									aria-label="Upload logo"
								>
									{logoUrl ? (
										<img
											src={logoUrl}
											alt="App logo"
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
											{appName ? appName.charAt(0).toUpperCase() : "M"}
										</span>
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
							<Input
								type="text"
								placeholder="Monolith"
								className="flex-1 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500"
								value={appName}
								onChange={(e) => setAppName(e.target.value)}
							/>
						</div>
					</Field>

					<div className="space-y-4">
						<h2 className="text-sm font-medium">
							Allowed Authentication Methods
						</h2>

						<div className="max-h-[400px] overflow-y-auto pr-2 space-y-5">
							<AuthMethodItem
								method="email"
								icon={<EnvelopeIcon className="h-5 w-5" />}
								label="Email"
								description="Users can sign in with email and password"
								selected={selectedMethods.includes("email")}
								onClick={() => toggleAuthMethod("email")}
							/>

							<AuthMethodItem
								method="phone"
								icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
								label="Phone"
								description="Users can sign in with phone number"
								selected={selectedMethods.includes("phone")}
								onClick={() => toggleAuthMethod("phone")}
							/>

							<AuthMethodItem
								method="username"
								icon={<UserCircleIcon className="h-5 w-5" />}
								label="Username"
								description="Users can sign in with username"
								selected={selectedMethods.includes("username")}
								onClick={() => toggleAuthMethod("username")}
							/>

							<AuthMethodItem
								method="google"
								icon={<img src={GoogleIcon} alt="Google" className="h-5 w-5" />}
								label="Google"
								description="Allow users to sign in with Google"
								selected={selectedMethods.includes("google")}
								onClick={() => toggleAuthMethod("google")}
							/>

							<AuthMethodItem
								method="apple"
								icon={<img src={AppleIcon} alt="Apple" className="h-5 w-5" />}
								label="Apple"
								description="Allow users to sign in with Apple"
								selected={selectedMethods.includes("apple")}
								onClick={() => toggleAuthMethod("apple")}
							/>

							<AuthMethodItem
								method="microsoft"
								icon={
									<img
										src={MicrosoftIcon}
										alt="Microsoft"
										className="h-5 w-5"
									/>
								}
								label="Microsoft"
								description="Allow users to sign in with Microsoft"
								selected={selectedMethods.includes("microsoft")}
								onClick={() => toggleAuthMethod("microsoft")}
							/>

							<AuthMethodItem
								method="discord"
								icon={
									<img src={DiscordIcon} alt="Discord" className="h-5 w-5" />
								}
								label="Discord"
								description="Allow users to sign in with Discord"
								selected={selectedMethods.includes("discord")}
								onClick={() => toggleAuthMethod("discord")}
							/>

							<AuthMethodItem
								method="linkedin"
								icon={
									<img src={LinkedInIcon} alt="LinkedIn" className="h-5 w-5" />
								}
								label="LinkedIn"
								description="Allow users to sign in with LinkedIn"
								selected={selectedMethods.includes("linkedin")}
								onClick={() => toggleAuthMethod("linkedin")}
							/>

							<AuthMethodItem
								method="github"
								icon={<img src={GithubIcon} alt="GitHub" className="h-5 w-5" />}
								label="GitHub"
								description="Allow users to sign in with GitHub"
								selected={selectedMethods.includes("github")}
								onClick={() => toggleAuthMethod("github")}
							/>

							<AuthMethodItem
								method="facebook"
								icon={
									<img src={FacebookIcon} alt="Facebook" className="h-5 w-5" />
								}
								label="Facebook"
								description="Allow users to sign in with Facebook"
								selected={selectedMethods.includes("facebook")}
								onClick={() => toggleAuthMethod("facebook")}
							/>
						</div>
					</div>
				</div>
			</div>
			<DialogActions className="mt-4">
				<Button outline onClick={onClose}>
					Cancel
				</Button>
				<Button onClick={handleContinue}>Continue</Button>
			</DialogActions>
		</Dialog>
	);
}

function AuthMethodItem({
	method,
	icon,
	label,
	description,
	selected,
	onClick,
}: {
	method: AuthMethod;
	icon: React.ReactNode;
	label: string;
	description: string;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<div className="flex items-start justify-between">
			<div className="flex items-center gap-3">
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
					{icon}
				</span>
				<div>
					<h3 className="text-sm font-medium">{label}</h3>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						{description}
					</p>
				</div>
			</div>
			<Switch
				name={`${method}_enabled`}
				checked={selected}
				onChange={onClick}
			/>
		</div>
	);
}

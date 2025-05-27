import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import AppleIcon from "@/assets/apple.svg";
import DiscordIcon from "@/assets/discord.svg";
import FacebookIcon from "@/assets/facebook.svg";
import GithubIcon from "@/assets/github.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Label } from "@/components/ui/fieldset";
import { Field } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";
import { Button } from "./ui/button";
import { useCreateProductionDeployment } from "@/lib/api/hooks/use-projects";

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
			setSelectedMethods(selectedMethods.filter((m) => m !== method));
		} else {
			setSelectedMethods([...selectedMethods, method]);
		}
	};

	const handleCreate = async () => {
		if (!customDomain.trim()) {
			alert("Please enter a custom domain");
			return;
		}

		try {
			await createProductionDeployment({
				projectId,
				customDomain: customDomain.trim(),
				authMethods: selectedMethods,
			});
			onClose();
			setCustomDomain("");
			setSelectedMethods(["email"]);
		} catch (error) {
			console.error("Failed to create production deployment:", error);
			alert("Failed to create production deployment. Please try again.");
		}
	};

	return (
		<Dialog size="3xl" open={open} onClose={onClose}>
			<div className="md:col-span-3 border-dashed border-zinc-200 dark:border-zinc-700">
				<div className="space-y-4">
					<div>
						<h2 className="text-lg text-zinc-900 dark:text-white">
							Create Deployment
						</h2>
						<Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
							Set up your production deployment with a custom domain
						</Text>
					</div>

					<Field>
						<Label className="font-normal">Custom Domain</Label>
						<Text className="text-sm text-zinc-500 dark:text-zinc-400">
							Enter your custom domain
						</Text>
						<Input
							type="text"
							placeholder="example.com"
							className="mt-2 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500"
							value={customDomain}
							onChange={(e) => setCustomDomain(e.target.value)}
						/>
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
								method="google_oauth"
								icon={<img src={GoogleIcon} alt="Google" className="h-5 w-5" />}
								label="Google"
								description="Allow users to sign in with Google"
								selected={selectedMethods.includes("google_oauth")}
								onClick={() => toggleAuthMethod("google_oauth")}
							/>

							<AuthMethodItem
								method="apple_oauth"
								icon={<img src={AppleIcon} alt="Apple" className="h-5 w-5" />}
								label="Apple"
								description="Allow users to sign in with Apple"
								selected={selectedMethods.includes("apple_oauth")}
								onClick={() => toggleAuthMethod("apple_oauth")}
							/>

							<AuthMethodItem
								method="microsoft_oauth"
								icon={
									<img
										src={MicrosoftIcon}
										alt="Microsoft"
										className="h-5 w-5"
									/>
								}
								label="Microsoft"
								description="Allow users to sign in with Microsoft"
								selected={selectedMethods.includes("microsoft_oauth")}
								onClick={() => toggleAuthMethod("microsoft_oauth")}
							/>

							<AuthMethodItem
								method="discord_oauth"
								icon={
									<img src={DiscordIcon} alt="Discord" className="h-5 w-5" />
								}
								label="Discord"
								description="Allow users to sign in with Discord"
								selected={selectedMethods.includes("discord_oauth")}
								onClick={() => toggleAuthMethod("discord_oauth")}
							/>

							<AuthMethodItem
								method="linkedin_oauth"
								icon={
									<img src={LinkedInIcon} alt="LinkedIn" className="h-5 w-5" />
								}
								label="LinkedIn"
								description="Allow users to sign in with LinkedIn"
								selected={selectedMethods.includes("linkedin_oauth")}
								onClick={() => toggleAuthMethod("linkedin_oauth")}
							/>

							<AuthMethodItem
								method="github_oauth"
								icon={<img src={GithubIcon} alt="GitHub" className="h-5 w-5" />}
								label="GitHub"
								description="Allow users to sign in with GitHub"
								selected={selectedMethods.includes("github_oauth")}
								onClick={() => toggleAuthMethod("github_oauth")}
							/>

							<AuthMethodItem
								method="facebook_oauth"
								icon={
									<img src={FacebookIcon} alt="Facebook" className="h-5 w-5" />
								}
								label="Facebook"
								description="Allow users to sign in with Facebook"
								selected={selectedMethods.includes("facebook_oauth")}
								onClick={() => toggleAuthMethod("facebook_oauth")}
							/>
						</div>
					</div>
				</div>

				<DialogActions className="mt-6">
					<Button outline onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={isLoading || !customDomain.trim()}
					>
						{isLoading ? "Creating..." : "Create Deployment"}
					</Button>
				</DialogActions>
			</div>
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

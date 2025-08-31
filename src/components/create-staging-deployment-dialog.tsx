import { useState } from "react";
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
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import XIcon from "@/assets/x.svg";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "./ui/button";
import { toast } from 'sonner';

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
		<Dialog size="3xl" open={open} onClose={() => onOpenChange(false)}>
			<div className="md:col-span-3 border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
				<div className="space-y-4">
					<div>
						<h2 className="text-lg text-zinc-900 dark:text-white">
							Create Staging Deployment
						</h2>
						<Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
							Create a new staging deployment for testing and development. You can
							have up to 3 staging deployments per project.
						</Text>
					</div>

					<div className="space-y-4">
						<h2 className="text-sm font-medium text-zinc-900 dark:text-white">
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
									<img
										src={LinkedInIcon}
										alt="LinkedIn"
										className="h-5 w-5"
									/>
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

							<AuthMethodItem
								method="gitlab_oauth"
								icon={<img src={GitlabIcon} alt="GitLab" className="h-5 w-5" />}
								label="GitLab"
								description="Allow users to sign in with GitLab"
								selected={selectedMethods.includes("gitlab_oauth")}
								onClick={() => toggleAuthMethod("gitlab_oauth")}
							/>

							<AuthMethodItem
								method="x_oauth"
								icon={<img src={XIcon} alt="X" className="h-5 w-5" />}
								label="X (Twitter)"
								description="Allow users to sign in with X"
								selected={selectedMethods.includes("x_oauth")}
								onClick={() => toggleAuthMethod("x_oauth")}
							/>
						</div>
					</div>
				</div>

				<DialogActions className="mt-6">
					<Button outline onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={isLoading}
					>
						{isLoading ? "Creating..." : "Create Staging Deployment"}
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
					<h3 className="text-sm font-medium text-zinc-900 dark:text-white">{label}</h3>
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

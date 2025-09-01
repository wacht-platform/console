import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	EnvelopeIcon,
	DevicePhoneMobileIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Label } from "@/components/ui/fieldset";
import { Field } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";
import { Button } from "./ui/button";
import { useCreateProductionDeployment } from "@/lib/api/hooks/use-projects";
import { toast } from 'sonner';

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
		<Dialog size="3xl" open={open} onClose={onClose}>
			<div className="md:col-span-3 border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
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
							Enter your custom domain (e.g., example.com)
						</Text>
						<Input
							type="text"
							placeholder="example.com"
							className={`mt-2 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 ${
								validationError ? "border-red-500 dark:border-red-500" : ""
							}`}
							value={customDomain}
							onChange={(e) => {
								setCustomDomain(e.target.value);
								if (validationError) {
									setValidationError("");
								}
							}}
						/>
						{validationError && (
							<Text className="text-sm text-red-600 dark:text-red-400 mt-1">
								{validationError}
							</Text>
						)}
					</Field>

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
								method="gitlab_oauth"
								icon={<img src={GitlabIcon} alt="GitLab" className="h-5 w-5" />}
								label="GitLab"
								description="Allow users to sign in with GitLab"
								selected={selectedMethods.includes("gitlab_oauth")}
								onClick={() => toggleAuthMethod("gitlab_oauth")}
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

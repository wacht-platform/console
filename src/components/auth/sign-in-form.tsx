// Import social login icons
import GoogleIcon from "@/assets/google.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import GithubIcon from "@/assets/github.svg";
import FacebookIcon from "@/assets/facebook.svg";
import AppleIcon from "@/assets/apple.svg";
import DiscordIcon from "@/assets/discord.svg";
import LinkedInIcon from "@/assets/linkedin.svg";

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

interface SignInFormProps {
	appName?: string;
	logo?: string | null;
	enabledMethods?: AuthMethod[];
}

const socialAuthProviders = {
	google: {
		shortLabel: "Google",
		fullLabel: "Continue with Google",
		icon: GoogleIcon,
	},
	microsoft: {
		shortLabel: "Microsoft",
		fullLabel: "Continue with Microsoft",
		icon: MicrosoftIcon,
	},
	github: {
		shortLabel: "GitHub",
		fullLabel: "Continue with GitHub",
		icon: GithubIcon,
	},
	facebook: {
		shortLabel: "Facebook",
		fullLabel: "Continue with Facebook",
		icon: FacebookIcon,
	},
	apple: {
		shortLabel: "Apple",
		fullLabel: "Continue with Apple",
		icon: AppleIcon,
	},
	discord: {
		shortLabel: "Discord",
		fullLabel: "Continue with Discord",
		icon: DiscordIcon,
	},
	linkedin: {
		shortLabel: "LinkedIn",
		fullLabel: "Continue with LinkedIn",
		icon: LinkedInIcon,
	},
};

export function SignInForm({
	appName = "Sign in",
	enabledMethods = ["email"],
}: SignInFormProps) {
	const socialMethods = enabledMethods.filter(
		(method) =>
			method !== "email" && method !== "phone" && method !== "username",
	);

	const organizeButtons = () => {
		if (socialMethods.length <= 6) {
			return [socialMethods];
		}
		if (socialMethods.length <= 12) {
			return [socialMethods.slice(0, 4), socialMethods.slice(4)];
		}
		return [
			socialMethods.slice(0, 4),
			socialMethods.slice(4, 8),
			socialMethods.slice(8),
		];
	};

	const buttonRows = organizeButtons();
	const showEmailPassword = enabledMethods.includes("email");

	return (
		<div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
			<div className="p-8">
				{/* Header */}
				<div className="text-center mb-6">
					<h1 className="text-xl font-semibold text-gray-900">{appName}</h1>
					<p className="text-sm text-gray-600 mt-1">
						Welcome back! Please enter your details.
					</p>
				</div>

				{/* Social Logins */}
				{socialMethods.length > 0 && (
					<div className="space-y-3 mb-6">
						{buttonRows.map((row, rowIndex) => (
							<div
								key={`row-${rowIndex}-${row.join("-")}`}
								className="flex flex-wrap gap-3"
							>
								{row.map((method) => {
									const provider = method as keyof typeof socialAuthProviders;
									const providerInfo = socialAuthProviders[provider];

									return (
										<button
											key={method}
											type="button"
											className={`flex items-center justify-center gap-2 border border-gray-300 rounded-md hover:bg-gray-50 h-10 ${row.length === 1 ? "w-full" : "flex-1"
												}`}
										>
											<img
												src={providerInfo.icon}
												alt={providerInfo.shortLabel}
												className="w-5 h-5"
											/>
											{socialMethods.length < 3 && (
												<span className="text-sm font-medium">
													{socialMethods.length === 1
														? providerInfo.fullLabel
														: providerInfo.shortLabel}
												</span>
											)}
										</button>
									);
								})}
							</div>
						))}
					</div>
				)}

				{/* Divider - show only if we have social methods and email */}
				{socialMethods.length > 0 && showEmailPassword && (
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-white px-2 text-gray-500">or</span>
						</div>
					</div>
				)}

				{/* Email and Password Form */}
				{showEmailPassword && (
					<form className="space-y-4">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								placeholder="Enter your email address"
								required
								className="w-full py-2 px-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>

						<div>
							<div className="flex items-center justify-between mb-1">
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700"
								>
									Password
								</label>
								<a
									href="#forgot-password"
									className="text-sm text-indigo-600 hover:text-indigo-500 font-normal"
								>
									Forgot password?
								</a>
							</div>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								placeholder="Enter your password"
								required
								className="w-full py-2 px-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>

						<button
							type="submit"
							className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Sign in
						</button>
					</form>
				)}

				{/* Other Methods */}
				{enabledMethods.length > 1 && (
					<div className="mt-4 text-center">
						<button
							type="button"
							className="text-sm text-indigo-600 hover:text-indigo-500"
						>
							Use other methods
						</button>
					</div>
				)}

				{/* Sign Up Link */}
				<div className="mt-6 text-center text-sm text-gray-600">
					Don't have an account?{" "}
					<a
						href="#sign-up"
						className="font-medium text-indigo-600 hover:text-indigo-500"
					>
						Sign up
					</a>
				</div>
			</div>
		</div>
	);
}

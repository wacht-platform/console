import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";

interface EmailTemplateCardProps {
	title: string;
	description: string;
	route?: string;
	onClick?: () => void;
}

export function EmailTemplateCard({
	title,
	description,
	route,
	onClick
}: EmailTemplateCardProps) {
	const content = (
		<div className="flex items-center justify-between py-4">
			<div className="space-y-1">
				<h3 className="font-medium text-gray-900">{title}</h3>
				<p className="text-sm text-gray-500">{description}</p>
			</div>
			<ChevronRightIcon className="w-5 h-5 text-gray-400" />
		</div>
	);

	if (route) {
		return (
			<Link to={route}>
				{content}
			</Link>
		);
	}

	return (
		<div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
			{content}
		</div>
	);
}

const emailTemplates = [
	{
		id: 0,
		title: "Organization Invitation",
		description: "Invite users to join an organization within your application.",
		route: "organization-invite-template",
	},
	{
		id: 1,
		title: "Workspace Invitation",
		description: "Send an invitation email to new users to join your application.",
		route: "workspace-invite-template",
	},
	{
		id: 2,
		title: "Verification code",
		description: "Send a verification code for authentication or account confirmation.",
		route: "verification-code-template",
	},
	{
		id: 3,
		title: "Reset password code",
		description: "Send a reset password code to users to reset their password.",
		route: "reset-password-code-template",
	},
	{
		id: 4,
		title: "Primary email address changed",
		description: "Notify users when their primary email address has been updated.",
		route: "primary-email-change-template",
	},
	{
		id: 5,
		title: "Password changed",
		description: "Confirm to users that their password has been successfully changed.",
		route: "password-change-template",
	},
	{
		id: 6,
		title: "Password removed",
		description: "Inform users that their password has been removed from the account.",
		route: "password-remove-template",
	},
	{
		id: 7,
		title: "Sign in from new device",
		description: "Alert users when someone signs in from a new device.",
		route: "sign-in-from-new-device-template",
	},
	{
		id: 8,
		title: "Magic Link",
		description: "Send a magic link to users for passwordless authentication.",
		route: "magic-link-template",
	},
	{
		id: 9,
		title: "Waitlist Signup",
		description: "Notify users they've been added to the waitlist.",
		route: "waitlist-signup-template",
	},
	{
		id: 10,
		title: "Waitlist Invitation",
		description: "Invite users from the waitlist to join.",
		route: "waitlist-invite-template",
	},
	{
		id: 11,
		title: "User Invitation",
		description: "Invite users to join your application (generic).",
		route: "workspace-invite-template",
	},
];

export default function EmailsPage() {
	return (
		<div className="flex flex-col gap-6">
			<Heading>Email Templates</Heading>

			<div className="bg-white rounded-lg overflow-hidden">
				{emailTemplates.map((template) => (
					<EmailTemplateCard
						key={template.id}
						title={template.title}
						description={template.description}
						route={template.route}
					/>
				))}
			</div>
		</div>
	);
}

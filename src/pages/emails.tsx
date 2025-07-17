import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon, EnvelopeIcon, InboxIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
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
		<div className="group relative bg-white px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-b border-gray-200 last:border-0">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-normal text-gray-900 group-hover:text-indigo-600 transition-colors">
						{title}
					</h3>
					<p className="mt-1 text-sm text-gray-500">{description}</p>
				</div>
				<ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
			</div>
		</div>
	);

	if (route) {
		return (
			<Link to={route} className="block hover:no-underline">
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

const emailTemplateCategories = [
	{
		category: "Invitations",
		icon: InboxIcon,
		templates: [
			{
				id: 0,
				title: "Organization Invitation",
				description: "Invite users to join an organization within your application",
				route: "organization-invite-template",
			},
			{
				id: 1,
				title: "Workspace Invitation",
				description: "Send an invitation email to new users to join your application",
				route: "workspace-invite-template",
			},
			{
				id: 11,
				title: "User Invitation",
				description: "Generic invitation for users to join your application",
				route: "workspace-invite-template",
			},
		]
	},
	{
		category: "Authentication",
		icon: DocumentTextIcon,
		templates: [
			{
				id: 2,
				title: "Verification Code",
				description: "Send a verification code for authentication or account confirmation",
				route: "verification-code-template",
			},
			{
				id: 3,
				title: "Reset Password Code",
				description: "Send a reset password code to users",
				route: "reset-password-code-template",
			},
			{
				id: 8,
				title: "Magic Link",
				description: "Send a magic link for passwordless authentication",
				route: "magic-link-template",
			},
			{
				id: 7,
				title: "New Device Sign In",
				description: "Alert users when someone signs in from a new device",
				route: "sign-in-from-new-device-template",
			},
		]
	},
	{
		category: "Account Updates",
		icon: EnvelopeIcon,
		templates: [
			{
				id: 4,
				title: "Email Address Changed",
				description: "Notify users when their primary email address has been updated",
				route: "primary-email-change-template",
			},
			{
				id: 5,
				title: "Password Changed",
				description: "Confirm that a password has been successfully changed",
				route: "password-change-template",
			},
			{
				id: 6,
				title: "Password Removed",
				description: "Inform users that their password has been removed",
				route: "password-remove-template",
			},
		]
	},
	{
		category: "Waitlist",
		icon: InboxIcon,
		templates: [
			{
				id: 9,
				title: "Waitlist Signup",
				description: "Confirm users have been added to the waitlist",
				route: "waitlist-signup-template",
			},
			{
				id: 10,
				title: "Waitlist Invitation",
				description: "Invite waitlisted users to join your application",
				route: "waitlist-invite-template",
			},
		]
	}
];

export default function EmailsPage() {
	return (
		<div className="max-w-7xl mx-auto">
			<div className="mb-8">
				<Heading className="text-2xl font-normal text-gray-900">
					Email Templates
				</Heading>
				<p className="mt-1 text-sm text-gray-600">
					Customize email templates for different communication scenarios
				</p>
			</div>

			<div className="space-y-6">
				{emailTemplateCategories.map((category, categoryIndex) => (
					<div key={category.category}>
						<h2 className="text-sm font-normal text-gray-500 uppercase tracking-wide mb-3">
							{category.category}
						</h2>
						<div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
							{category.templates.map((template) => (
								<EmailTemplateCard
									key={template.id}
									title={template.title}
									description={template.description}
									route={template.route}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

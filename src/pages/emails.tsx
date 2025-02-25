import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Strong, Text } from "@/components/ui/text";
import { Link } from "react-router";

export default function EmailsPage() {

	const data = [
		{
			id: 1,
			title: "Workspace Invitation",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/workspace-invitation",
		},
		{
			id: 2,
			title: "Organization Invitation",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/organization-invitation",
		},
		{
			id: 3,
			title: "Waitlisted",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/waitlisted",
		},
		{
			id: 4,
			title: "New Sign Up",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/new-sign-up",
		},
		{
			id: 5,
			title: "New Device Log In",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/new-device-log-in",
		},
		{
			id: 6,
			title: "E-mail OTP",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/email-otp",
		},
		{
			id: 7,
			title: "Magic Link",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/magic-link",
		},
		{
			id: 8,
			title: "Password Reset",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/password-reset",
		},
		{
			id: 9,
			title: "Bad Sign Up Attempt",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/bad-sign-up-attempt",
		},
		{
			id: 10,
			title: "Password Changed",
			updatedOn: "Never modified",
			status: "Default",
			route: "/emails/password-changed",
		},
	];


	return (
		<div className="flex flex-col gap-4">
			<Heading>E-mails Templates</Heading>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{data.map((item) => (
					<Link key={item.id} to={item.route}>
						<div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-gray-100 transition">
							<div className="space-y-2">
								<Strong>{item.title}</Strong>
								<Text className="text-gray-500">{item.updatedOn}</Text>
								<Button outline className="text-xs pointer-events-none">
									{item.status}
								</Button>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}

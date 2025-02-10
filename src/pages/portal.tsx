import { Heading, Subheading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Strong, Text } from "@/components/ui/text";
import { ArrowTopRightOnSquareIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";

export default function PortalPage() {
	const demoLink = "https://example.com/sign-in";
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(demoLink);
		setCopied(false);
		setTimeout(() => setCopied(true), 10);
	};

	const handleOpenLink = () => {
		window.open(demoLink, "_blank", "noopener,noreferrer");
	};

	const data = [
		{"title": "Sign-in", "desc": "Preview your application’s hosted sign-in flow."},
		{"title": "Sign-up", "desc": "Preview your application’s hosted sign-up flow."},
		{"title": "User profile", "desc": "Preview your application’s hosted user profile page."},
		{"title": "Unauthorized sign in", "desc": "Preview your application’s hosted unauthorized sign-in page."},
		{"title": "Organization profile", "desc": "Preview your application’s hosted organization profile page."},
		{"title": "Create organization", "desc": "Preview your application’s hosted create organization flow."}
	]

	return (
		<div>
			<Heading>Account Portal</Heading>
			<div className="mt-8 space-y-10">
				<section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
					<div className="space-y-1 col-span-2">
						<Subheading>
							<Strong>Page</Strong>
						</Subheading>
						<Text>
							Wacht’s Account Portal offers the fastest and most seamless way to integrate authentication and user management into your application. Our fully managed, hosted solution runs directly on your domain, ensuring security and ease of use.
						</Text>
					</div>
				</section>

				<div className="grid gap-6 md:grid-cols-2">
				{data.map((item, index) => (
					<div key={index} className="p-4 bg-white rounded-lg shadow-md space-y-2">
						<Subheading>{item.title}</Subheading>
						<Text>{item.desc}</Text>
						<div className="relative flex items-center gap-3">
							<Input
								type="text"
								value={demoLink}
								readOnly
								className="w-full pr-24 py-2 px-4 text-sm rounded-lg shadow-sm focus:ring-0"
							/>
							<div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
								<Tooltip message="Copied!" trigger={copied}>
									<button
										onClick={handleCopy}
										className="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
									>
										<ClipboardIcon className="w-5 h-5" />
									</button>
								</Tooltip>
								<button
									onClick={handleOpenLink}
									className="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
								>
									<ArrowTopRightOnSquareIcon className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
				
			</div>
		</div>
	);
}

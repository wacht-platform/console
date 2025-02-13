import { Heading, Subheading } from "@/components/ui/heading";
import { Strong, Text } from "@/components/ui/text";
import { ArrowTopRightOnSquareIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { Divider } from "@/components/ui/divider";
import { Button } from "@/components/ui/button";

export default function PortalPage() {
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [primaryColor, setPrimaryColor] = useState("#1E40AF");
	const [backgroundColor, setBackgroundColor] = useState("#F3F4F6");
	const [borderColor, setBorderColor] = useState("#D1D5DB");

	const data = [
		{ index: 1, title: "Sign-in", desc: "Preview your application’s hosted sign-in flow.", demoLink: "https://example.com/sign-in" },
		{ index: 2, title: "Sign-up", desc: "Preview your application’s hosted sign-up flow.", demoLink: "https://example.com/sign-up" },
		{ index: 3, title: "User profile", desc: "Preview your application’s hosted user profile page.", demoLink: "https://example.com/profile" },
		{ index: 4, title: "Unauthorized sign in", desc: "Preview your application’s hosted unauthorized sign-in page.", demoLink: "https://example.com/unauthorized" },
		{ index: 5, title: "Organization profile", desc: "Preview your application’s hosted organization profile page.", demoLink: "https://example.com/organization" },
		{ index: 6, title: "Create organization", desc: "Preview your application’s hosted create organization flow.", demoLink: "https://example.com/create-organization" },
	];

	const data2 = [
		{ "title": "After sign-up fallback", "desc": "Specify where to send a user if it cannot be determined from the redirect_url query parameter.", "demoLink": "https://example.com/sign-up" },
		{ "title": "After sign-in fallback", "desc": "Specify where to send a user if it cannot be determined from the redirect_url query parameter.", "demoLink": "https://example.com/sign-in" },
		{ "title": "After logo click", "desc": "Specify where to send a user after they click your application’s logo.", "demoLink": "https://example.com/sign-in" },
	]

	const data3 = [
		{
			index: 1, title: "After create organization", desc: "Specify where to send a user after they create an organization. (Leave blank to redirect to the host’s root.)", demoLink: "https://example.com/sign-out"
		},
		{
			index: 2, title: "After leave organization", desc: "Specify where to send a user after they leave an organization. (Leave blank to redirect to the host's root)", demoLink: "https://example.com/password-reset"
		}
	]


	const handleCopy = (link: string, index: number): void => {
		navigator.clipboard.writeText(link);
		setCopiedIndex(index);
	};

	const handleOpenLink = (link: string): void => {
		window.open(link, "_blank", "noopener,noreferrer");
	};


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
						<div key={index} className="p-4 bg-white rounded-lg shadow-md space-y-2 border border-gray-100">
							<Subheading>{item.title}</Subheading>
							<Text>{item.desc}</Text>
							<div className="relative flex items-center gap-3">
								<input
									type="text"
									value={item.demoLink}
									readOnly
									className="w-full pr-24 py-3 px-4 text-sm rounded-lg shadow-sm  focus:outline-none focus:ring-0 "
								/>
								<div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
									<Tooltip message="Copied!" trigger={copiedIndex === index}>
										<button
											onClick={() => handleCopy(item.demoLink, index)}
											className="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
										>
											<ClipboardIcon className="w-5 h-5" />
										</button>
									</Tooltip>
									<button
										onClick={() => handleOpenLink(item.demoLink)}
										className="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
									>
										<ArrowTopRightOnSquareIcon className="w-5 h-5" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				<Divider className="my-8" soft />

				<section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
					<div className="space-y-1 col-span-2">
						<Subheading>
							<Strong>User redirects</Strong>
						</Subheading>
						<Text>
							The Account Portal requires a destination to redirect your users after they complete key actions. By default, we've set your development host, but you can customize the paths to suit your needs.
						</Text>
					</div>
				</section>

				<div className="grid gap-6 md:grid-cols-2">
					{data2.map((item, index) => (
						<div key={index} className="p-4 bg-white rounded-lg shadow-md space-y-2 border border-gray-100">
							<Subheading>{item.title}</Subheading>
							<Text>{item.desc}</Text>
							<div className="relative flex items-center gap-3">
								<input
									type="text"
									placeholder="/path"
									className="w-full pr-24 py-3 px-4 text-sm rounded-lg shadow-sm focus:outline-none focus:ring-0"
								/>
								<Button type="button" color="zinc">Add</Button>
							</div>
						</div>
					))}
				</div>

				<Divider className="my-8" soft />

				<section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
					<div className="space-y-1 col-span-2">
						<Subheading>
							<Strong>Organization redirects</Strong>
						</Subheading>
						<Text>
							The Account Portal requires a destination to redirect users after key actions. By default, we've set your development host, but you can customize the paths to fit your needs.
						</Text>
					</div>
				</section>

				<div className="grid gap-6 md:grid-cols-2">
					{data3.map((item, index) => (
						<div key={index} className="p-4 bg-white rounded-lg shadow-md space-y-2 border border-gray-100">
							<Subheading>{item.title}</Subheading>
							<Text>{item.desc}</Text>
							<div className="relative flex items-center gap-3">
								<input
									type="text"
									placeholder="/path"
									className="w-full pr-24 py-3 px-4 text-sm rounded-lg shadow-sm focus:outline-none focus:ring-0"
								/>
								<Button type="button" color="zinc">Add</Button>
							</div>
						</div>
					))}
				</div>

				<Divider className="my-8" soft />

				<section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
					<div className="space-y-1 col-span-2">
						<Subheading>
							<Strong>Colors</Strong>
						</Subheading>
						<Text>
							Set color for customize your Account Portal.
						</Text>
					</div>
				</section>

				<div className="grid gap-6 md:grid-cols-3 mt-4">

					<div className="p-4 bg-white rounded-lg shadow-md space-y-2 border border-gray-100">
							<Subheading>Primary Color</Subheading>
							<div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
								<input
									type="color"
									value={primaryColor}
									onChange={(e) => setPrimaryColor(e.target.value)}
									className="w-12 h-12 cursor-pointer rounded-md border border-gray-100"
								/>
								<Text className="text-gray-700 font-medium">{primaryColor}</Text>
							</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow-md space-y-2 border border-gray-100">
						<Subheading>Background Color</Subheading>
						<div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
							<input
								type="color"
								value={backgroundColor}
								onChange={(e) => setBackgroundColor(e.target.value)}
								className="w-12 h-12 cursor-pointer rounded-md border border-gray-100"
							/>
							<Text className="text-gray-700 font-medium">{backgroundColor}</Text>
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow-md space-y-2 border border-gray-100">
						<Subheading>Border Color</Subheading>
						<div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
							<input
								type="color"
								value={borderColor}
								onChange={(e) => setBorderColor(e.target.value)}
								className="w-12 h-12 cursor-pointer rounded-md border border-gray-100"
							/>
							<Text className="text-gray-700 font-medium">{borderColor}</Text>
						</div>
					</div>
				</div>

				<Divider className="my-8" soft />

				<section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
					<div className="space-y-1 col-span-2">
						<Subheading>
							<Strong>Disable Account Portal</Strong>
						</Subheading>
						<Text>
							Turn off all pages hosted by Clerk in the Account Portal.
						</Text>
					</div>
					<div>
						<Button type="button" color="red">Disable Account Portal</Button>
					</div>
				</section>
			</div>
		</div>
	);
}

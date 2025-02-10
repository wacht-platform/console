import { useState, useEffect } from "react";
import { OrganizationsTabs, type Tab } from "@/components/organizations-tabs";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/fieldset";
import { Radio, RadioField, RadioGroup } from "@/components/ui/radio";
import { OrganizationRolesTab} from "@/pages/roles-organization";


export default function ManageOrganizationsPage() {
	const [isOrganizationEnabled, setIsOrganizationEnabled] = useState(() => {
		return JSON.parse(localStorage.getItem("organization_enabled") || "false");
	});

	const [allowCreation, setAllowCreation] = useState(true);
	const [creationLimit, setCreationLimit] = useState("unlimited");
	const [membershipLimit, setMembershipLimit] = useState<string | number>(1);
	const [limitedCreationLimit, setLimitedCreationLimit] = useState<string | number>("");

	const handleAllowCreationChange = () => {
		setAllowCreation((prev) => {
			const newState = !prev;
			if (!newState) setCreationLimit("");
			return newState;
		});
	};

	const handleMembershipChange = (value: string) => {
		setCreationLimit(value);
		if (value === "unlimited") {
			setMembershipLimit("");
		}
	};

	const handleMembershipLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		if (!isNaN(value) && value >= 0) {
			setMembershipLimit(value);
		}
	}

	const handleLimitedCreationLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		if (!isNaN(value) && value >= 0) {
			setLimitedCreationLimit(value);
		}
	};

	//Temporary using this line to avoid the value to be false every time the page is refreshed change this to the above line after the function is implemented
	useEffect(() => {
		localStorage.setItem("organization_enabled", JSON.stringify(isOrganizationEnabled));
	}, [isOrganizationEnabled]);

	const tabs: Tab[] = [
		{ name: "Settings", href: "/organizations", current: true },
		{ name: "Roles", href: "/organizations/roles", current: false },
		{ name: "Permissions", href: "/organizations/permissions", current: false },
	];

	return (
		<div className="flex flex-col gap-2 mb-2">
			<Heading className="mb-8">Manage Organizations</Heading>

			<div className="flex items-start justify-between">
				<div>
					<h2 className="text-base font-medium">Enable organizations</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Intended for B2B SaaS products, this feature allows users to create Organizations, invite their team, and assign roles.
					</p>
				</div>
				<Switch
					name="organization_enabled"
					checked={isOrganizationEnabled}
					onChange={setIsOrganizationEnabled}
				/>
			</div>

			{isOrganizationEnabled && (
				<div>
					<OrganizationsTabs tabs={tabs} className="my-10" />

					<div className="space-y-28">
						<div className="space-y-6">
							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Default role for members</Strong></Subheading>
									<Text>Choose the role that users are initially assigned as a new organization member.</Text>
								</div>
								<div>
									<Select aria-label="Roles" name="roles" defaultValue="member">
										<option value="member">Member</option>
										<option value="admin">Admin</option>
									</Select>
								</div>
							</section>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Creator’s initial role</Strong></Subheading>
									<Text>Choose the role that users are initially assigned after creating an organization.</Text>
								</div>
								<div>
									<Select aria-label="Roles" name="roles" defaultValue="admin">
										<option value="admin">Admin</option>
									</Select>
								</div>
							</section>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Default membership limit</Strong></Subheading>
									<Text>Set the default number of users allowed in an organization.</Text>
								</div>
								<div className="space-y-4">
									<RadioGroup name="membership" value={creationLimit} onChange={handleMembershipChange}>
										<RadioField>
											<Radio value="unlimited" />
											<Label>Unlimited membership</Label>
										</RadioField>
										<Text>Organizations can have an unlimited number of members and pending invitations.</Text>
										<RadioField>
											<Radio value="limited" />
											<Label>Limited membership</Label>
										</RadioField>
										<Text>Organizations are limited to the following number of members, including pending invitations.</Text>
										<Input
											type="number"
											value={membershipLimit}
											onChange={handleMembershipLimitChange}
											placeholder="Enter limit"
											className="w-16"
											disabled={creationLimit === "unlimited"}
										/>
									</RadioGroup>
								</div>
							</section>


							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Default ability to delete</Strong></Subheading>
									<Text>If organizations are deletable, any member with the <Strong>“Delete organization”</Strong> permission can self-serve delete the organization.</Text>
								</div>

								<CheckboxField>
									<Checkbox name="deletable" defaultChecked />
									<Label>Upon creation, organizations are deletable by any member with the <Strong>“Delete organization”</Strong>permission</Label>
								</CheckboxField>
							</section>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Verified domains</Strong></Subheading>
									<Text>Verified domains can be used to streamline enrollment into an organization.</Text>
								</div>
								<CheckboxField>
									<Checkbox name="deletable" defaultChecked />
									<Label>Upon creation, organizations are deletable by any member with the <Strong>“Delete organization”</Strong>permission</Label>
								</CheckboxField>
							</section>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Limit creation</Strong></Subheading>
									<Text>Configure whether new users are able to create new organizations.</Text>
								</div>
								<div className="space-y-4">
									<CheckboxField>
										<Checkbox name="allow_creation_org" checked={allowCreation} onChange={handleAllowCreationChange} />
										<Label>Allow users to create organizations</Label>
									</CheckboxField>

									<RadioGroup value={creationLimit} onChange={setCreationLimit}>
										<RadioField>
											<Radio value="unlimited" disabled={!allowCreation} />
											<Label className="font-semibold">Users can create unlimited organizations</Label>
										</RadioField>
										<RadioField>
											<Radio value="limited" disabled={!allowCreation} />
											<Label>Users can create a limited number of organizations</Label>
										</RadioField>
									</RadioGroup>

									<Input
										type="number"
										placeholder="Number of organizations"
										className="w-48"
										disabled={!allowCreation}
										value={limitedCreationLimit}
										onChange={handleLimitedCreationLimitChange}
									/>
								</div>
							</section>

							<Divider className="my-10" soft />

							<div className="flex justify-end gap-4">
								<Button type="reset" plain>Reset</Button>
								<Button type="submit">Save changes</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
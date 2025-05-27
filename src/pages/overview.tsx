import { FingerPrintIcon } from "@heroicons/react/24/outline";
import { Heading, Subheading } from "../components/ui/heading";
import { Select } from "../components/ui/select";
import { Stat } from "../components/stat";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../components/ui/table";
import { DnsVerificationPanel } from "../components/dns-verification-panel";
import { useProjects } from "../lib/api/hooks/use-projects";
import { useVerifyDnsRecords } from "../lib/api/hooks/use-dns-verification";

interface User {
	name: string;
	email: string;
	date: string;
}

const recentSignups: User[] = [
	{
		name: "Chris evans",
		email: "kezeunnicolqui-6787@yopmail.com",
		date: "Thu Jan 23, 17:51",
	},
	{
		name: "Kane William",
		email: "kavi150607@gmail.com",
		date: "Mon Jan 13, 20:02",
	},
	{
		name: "Kavi Nesh",
		email: "ranjithkavi@outlook.com",
		date: "Mon Jan 13, 19:48",
	},
	{
		name: "John David",
		email: "rkgdr05@outlook.com",
		date: "Mon Jan 13, 19:31",
	},
];

export default function OverviewPage() {
	const { selectedDeployment } = useProjects();
	const { mutate: verifyDnsRecords, isPending: isVerifying } =
		useVerifyDnsRecords();

	const handleVerifyDns = () => {
		if (selectedDeployment?.id) {
			verifyDnsRecords({ deploymentId: selectedDeployment.id });
		}
	};

	// Check if we need to show DNS verification
	const shouldShowDnsVerification = () => {
		if (selectedDeployment?.mode !== "production") return false;

		const domainRecords = [
			...(selectedDeployment.domain_verification_records
				?.cloudflare_verification || []),
			...(selectedDeployment.domain_verification_records
				?.custom_hostname_verification || []),
		];

		const emailRecords = [
			...(selectedDeployment.email_verification_records?.ses_verification ||
				[]),
			...(selectedDeployment.email_verification_records
				?.mail_from_verification || []),
			...(selectedDeployment.email_verification_records?.dkim_records || []),
		];

		const allRecords = [...domainRecords, ...emailRecords];

		// Show if there are records and any are not verified
		return (
			allRecords.length > 0 && allRecords.some((record) => !record.verified)
		);
	};

	return (
		<div>
			<Heading>Good afternoon, Saurav</Heading>

			{/* DNS Verification Section - Show when pending */}
			{shouldShowDnsVerification() && (
				<div className="mt-8">
					<DnsVerificationPanel
						domainRecords={selectedDeployment?.domain_verification_records}
						emailRecords={selectedDeployment?.email_verification_records}
						onVerify={handleVerifyDns}
						isVerifying={isVerifying}
						compact={true}
					/>
				</div>
			)}

			<div className="mt-8 flex items-end justify-between">
				<Subheading>Overview</Subheading>
				<div>
					<Select name="period">
						<option value="last_week">Today</option>
						<option value="last_two">Yesterday</option>
						<option value="last_month">This week</option>
						<option value="last_quarter">This month</option>
					</Select>
				</div>
			</div>
			<div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
				<Stat title="Sign in" value="100" change="+4.5%" />
				<Stat title="New Users" value="50" change="-0.5%" />
				<Stat title="New Organizations" value="150" change="+4.5%" />
				<Stat title="New Workspaces" value="823,067" change="+21.2%" />
			</div>

			<Subheading className="mt-14">Recent Signups</Subheading>
			<Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
				<TableHead>
					<TableRow>
						<TableHeader>Name</TableHeader>
						<TableHeader>Email</TableHeader>
						<TableHeader>Method</TableHeader>
						<TableHeader>Date</TableHeader>
					</TableRow>
				</TableHead>
				<TableBody>
					{recentSignups.map((user) => (
						<TableRow key={user.email}>
							<TableCell>
								<span>{user.name}</span>
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<FingerPrintIcon className="size-4" />
									<span>Email</span>
								</div>
							</TableCell>
							<TableCell>{user.date}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

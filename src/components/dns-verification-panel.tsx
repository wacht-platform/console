import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircleIcon,
	XCircleIcon,
	ClockIcon,
	DocumentDuplicateIcon,
	ArrowPathIcon,
	ChevronRightIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import type {
	DnsRecord,
	DomainVerificationRecords,
	EmailVerificationRecords,
} from "@/types/deployment";

function DnsRecordRow({ record }: { record: DnsRecord }) {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const getStatusIcon = () => {
		if (record.verified) {
			return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
		}
		if (record.verification_attempted_at) {
			return <XCircleIcon className="h-5 w-5 text-red-500" />;
		}
		return <ClockIcon className="h-5 w-5 text-yellow-500" />;
	};

	const getStatusBadge = () => {
		if (record.verified) {
			return <Badge color="green">Configured</Badge>;
		}
		if (record.verification_attempted_at) {
			return <Badge color="red">Failed</Badge>;
		}
		return <Badge color="yellow">Pending</Badge>;
	};

	return (
		<TableRow>
			<TableCell className="font-mono text-sm w-[20%] min-w-[120px] max-w-0">
				<div className="truncate" title={record.name}>
					{record.name}
				</div>
			</TableCell>
			<TableCell className="w-[10%] min-w-[60px]">
				<Badge color="zinc">{record.record_type}</Badge>
			</TableCell>
			<TableCell className="w-[45%] min-w-[200px] max-w-0">
				<div className="flex items-center space-x-2 min-w-0">
					<Button
						outline
						onClick={() => copyToClipboard(record.value)}
						className="p-1 h-6 w-6 flex-shrink-0"
						title="Copy to clipboard"
					>
						<DocumentDuplicateIcon className="h-3 w-3" />
					</Button>
					<div className="min-w-0 flex-1">
						<code
							className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block truncate w-full"
							title={record.value}
						>
							{record.value}
						</code>
					</div>
				</div>
				{copied && <Text className="text-xs text-green-600 mt-1">Copied!</Text>}
			</TableCell>
			<TableCell className="w-[15%] min-w-[100px]">
				<div className="flex items-center space-x-1">
					{getStatusIcon()}
					{getStatusBadge()}
				</div>
			</TableCell>
			<TableCell className="text-sm text-gray-500 w-[10%] min-w-[80px] max-w-0">
				<div className="truncate" title={
					record.last_verified_at
						? new Date(record.last_verified_at).toLocaleString()
						: record.verification_attempted_at
							? new Date(record.verification_attempted_at).toLocaleString()
							: "Never"
				}>
					{record.last_verified_at
						? new Date(record.last_verified_at).toLocaleDateString()
						: record.verification_attempted_at
							? new Date(record.verification_attempted_at).toLocaleDateString()
							: "Never"}
				</div>
			</TableCell>
		</TableRow>
	);
}

function DnsRecordSection({
	title,
	description,
	records,
}: {
	title: string;
	description: string;
	records: DnsRecord[];
}) {
	if (!records || records.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-medium">{title}</h3>
				<Text className="text-sm text-gray-500">{description}</Text>
			</div>

			<div className="w-full max-w-full overflow-hidden">
				<div className="overflow-x-auto">
					<Table className="table-fixed w-full min-w-full">
						<TableHead>
							<TableRow>
								<TableHeader className="w-[20%] min-w-[120px]">Name</TableHeader>
								<TableHeader className="w-[10%] min-w-[60px]">Type</TableHeader>
								<TableHeader className="w-[45%] min-w-[200px]">Value</TableHeader>
								<TableHeader className="w-[15%] min-w-[100px]">Status</TableHeader>
								<TableHeader className="w-[10%] min-w-[80px]">Last Checked</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{records.map((record, index) => (
								<DnsRecordRow key={`${record.name}-${index}`} record={record} />
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}

interface DnsVerificationPanelCompactProps {
	domainRecords?: DomainVerificationRecords;
	emailRecords?: EmailVerificationRecords;
	verificationStatus?: string;
	onVerify?: () => void;
	isVerifying?: boolean;
	compact?: boolean;
}

export function DnsVerificationPanel({
	domainRecords,
	emailRecords,
	verificationStatus,
	onVerify,
	isVerifying = false,
	compact = false,
}: DnsVerificationPanelCompactProps) {
	const allDomainRecords = [
		...(domainRecords?.cloudflare_verification || []),
		...(domainRecords?.custom_hostname_verification || []),
	];

	const allEmailRecords = [
		...(emailRecords?.dkim_records || []),
		...(emailRecords?.return_path_records || []),
	];

	const totalRecords = allDomainRecords.length + allEmailRecords.length;
	const verifiedRecords = [...allDomainRecords, ...allEmailRecords].filter(
		(r) => r.verified,
	).length;

	const getVerificationStatusBadge = () => {
		switch (verificationStatus) {
			case "verified":
				return (
					<Badge color="green" className="text-sm">
						<CheckCircleIcon className="h-4 w-4 mr-1" />
						Configured
					</Badge>
				);
			case "in_progress":
				return (
					<Badge color="yellow" className="text-sm">
						<ClockIcon className="h-4 w-4 mr-1" />
						In Progress
					</Badge>
				);
			case "failed":
				return (
					<Badge color="red" className="text-sm">
						<ExclamationTriangleIcon className="h-4 w-4 mr-1" />
						Failed
					</Badge>
				);
			case "pending":
			default:
				return (
					<Badge color="zinc" className="text-sm">
						<ClockIcon className="h-4 w-4 mr-1" />
						Pending
					</Badge>
				);
		}
	};

	if (compact) {
		return (
			<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
				<div className="flex items-start justify-between">
					<div className="flex items-start space-x-3">
						<div className="flex-shrink-0">
							<ClockIcon className="h-6 w-6 text-yellow-600" />
						</div>
						<div>
							<Heading className="text-lg">DNS Configuration Required</Heading>
							<Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
								Your production deployment requires DNS configuration to be
								fully functional.
							</Text>
							<div className="mt-2 flex items-center space-x-3">
								<Badge color="yellow" className="text-sm">
									{verifiedRecords} of {totalRecords} records configured
								</Badge>
								<Link
									to="dns-verification"
									className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
								>
									<span>View Details</span>
									<ChevronRightIcon className="h-3 w-3" />
								</Link>
							</div>
						</div>
					</div>
					<Button
						onClick={onVerify}
						disabled={isVerifying}
						className="flex items-center space-x-2"
					>
						<ArrowPathIcon
							className={`h-4 w-4 ${isVerifying ? "animate-spin" : ""}`}
						/>
						<span>{isVerifying ? "Checking..." : "Check Records"}</span>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Heading>DNS Configuration</Heading>
					<Text className="text-sm text-gray-500 mt-1">
						Configure these DNS records to enable your domain and email
						functionality
					</Text>
				</div>

				<div className="flex items-center space-x-4">
					{getVerificationStatusBadge()}
					{verificationStatus !== "verified" && (
						<Badge color="zinc" className="text-sm">
							{verifiedRecords} of {totalRecords} records configured
						</Badge>
					)}

					<Button
						onClick={onVerify}
						disabled={isVerifying}
						className="flex items-center space-x-2"
					>
						<ArrowPathIcon
							className={`h-4 w-4 ${isVerifying ? "animate-spin" : ""}`}
						/>
						<span>{isVerifying ? "Checking..." : "Check Records"}</span>
					</Button>
				</div>
			</div>

			{allDomainRecords.length > 0 && (
				<DnsRecordSection
					title="Domain Configuration Records"
					description="Add these DNS records to enable your custom domain"
					records={allDomainRecords}
				/>
			)}

			{allEmailRecords.length > 0 && (
				<DnsRecordSection
					title="Email Configuration Records"
					description="Add these DNS records to enable email delivery functionality"
					records={allEmailRecords}
				/>
			)}

			{allDomainRecords.length === 0 && allEmailRecords.length === 0 && (
				<div className="text-center py-12">
					<Text className="text-gray-500">
						No DNS records found. Create a production deployment to generate
						configuration records.
					</Text>
				</div>
			)}
		</div>
	);
}

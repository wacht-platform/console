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
			return <Badge color="green">Verified</Badge>;
		}
		if (record.verification_attempted_at) {
			return <Badge color="red">Failed</Badge>;
		}
		return <Badge color="yellow">Pending</Badge>;
	};

	return (
		<TableRow>
			<TableCell className="font-mono text-sm">{record.name}</TableCell>
			<TableCell>
				<Badge color="zinc">{record.record_type}</Badge>
			</TableCell>
			<TableCell className="max-w-xs">
				<div className="flex items-center space-x-2">
					<code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate">
						{record.value}
					</code>
					<Button
						outline
						onClick={() => copyToClipboard(record.value)}
						className="p-1 h-8 w-8"
					>
						<DocumentDuplicateIcon className="h-4 w-4" />
					</Button>
				</div>
				{copied && <Text className="text-xs text-green-600 mt-1">Copied!</Text>}
			</TableCell>
			<TableCell>
				<div className="flex items-center space-x-2">
					{getStatusIcon()}
					{getStatusBadge()}
				</div>
			</TableCell>
			<TableCell className="text-sm text-gray-500">
				{record.last_verified_at
					? new Date(record.last_verified_at).toLocaleString()
					: record.verification_attempted_at
						? new Date(record.verification_attempted_at).toLocaleString()
						: "Not attempted"}
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

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Value</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Last Checked</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{records.map((record, index) => (
						<DnsRecordRow key={`${record.name}-${index}`} record={record} />
					))}
				</TableBody>
			</Table>
		</div>
	);
}

interface DnsVerificationPanelCompactProps {
	domainRecords?: DomainVerificationRecords;
	emailRecords?: EmailVerificationRecords;
	onVerify?: () => void;
	isVerifying?: boolean;
	compact?: boolean;
}

export function DnsVerificationPanel({
	domainRecords,
	emailRecords,
	onVerify,
	isVerifying = false,
	compact = false,
}: DnsVerificationPanelCompactProps) {
	const allDomainRecords = [
		...(domainRecords?.cloudflare_verification || []),
		...(domainRecords?.custom_hostname_verification || []),
	];

	const allEmailRecords = [
		...(emailRecords?.ses_verification || []),
		...(emailRecords?.mail_from_verification || []),
		...(emailRecords?.dkim_records || []),
	];

	const domainVerified = allDomainRecords.every((record) => record.verified);
	const emailVerified = allEmailRecords.every((record) => record.verified);
	const allVerified = domainVerified && emailVerified;

	const totalRecords = allDomainRecords.length + allEmailRecords.length;
	const verifiedRecords = [...allDomainRecords, ...allEmailRecords].filter(
		(r) => r.verified,
	).length;

	if (compact) {
		return (
			<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
				<div className="flex items-start justify-between">
					<div className="flex items-start space-x-3">
						<div className="flex-shrink-0">
							<ClockIcon className="h-6 w-6 text-yellow-600" />
						</div>
						<div>
							<Heading className="text-lg">DNS Verification Required</Heading>
							<Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
								Your production deployment requires DNS configuration to be
								fully functional.
							</Text>
							<div className="mt-2 flex items-center space-x-3">
								<Badge color="yellow" className="text-sm">
									{verifiedRecords} of {totalRecords} records verified
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
						<span>{isVerifying ? "Verifying..." : "Verify Records"}</span>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Heading>DNS Verification</Heading>
					<Text className="text-sm text-gray-500 mt-1">
						Configure these DNS records to verify your domain and enable email
						delivery
					</Text>
				</div>

				<div className="flex items-center space-x-4">
					{allVerified && (
						<Badge color="green" className="text-sm">
							<CheckCircleIcon className="h-4 w-4 mr-1" />
							All Records Verified
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
						<span>{isVerifying ? "Verifying..." : "Verify Records"}</span>
					</Button>
				</div>
			</div>

			{allDomainRecords.length > 0 && (
				<DnsRecordSection
					title="Domain Verification Records"
					description="Add these DNS records to verify ownership of your domain"
					records={allDomainRecords}
				/>
			)}

			{allEmailRecords.length > 0 && (
				<DnsRecordSection
					title="Email Verification Records"
					description="Add these DNS records to enable email delivery through AWS SES"
					records={allEmailRecords}
				/>
			)}

			{allDomainRecords.length === 0 && allEmailRecords.length === 0 && (
				<div className="text-center py-12">
					<Text className="text-gray-500">
						No DNS records found. Create a production deployment to generate
						verification records.
					</Text>
				</div>
			)}
		</div>
	);
}

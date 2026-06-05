import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxField } from "@/components/ui/app-checkbox";
import { Label, Field } from "@/components/ui/fieldset";
import {
	CheckCircleIcon,
	XCircleIcon,
	ClockIcon,
	DocumentDuplicateIcon,
	ArrowPathIcon,
	ChevronRightIcon,
	ExclamationTriangleIcon,
	ServerIcon,
	EnvelopeIcon,
	PlayIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/app-table";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { PageHead } from "@/components/ui/page-head";
import { cn } from "@/lib/utils";
import type {
	DnsRecord,
	DomainVerificationRecords,
	EmailVerificationRecords,
	CustomSmtpConfig,
	SmtpConfigRequest,
	EmailProvider,
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
			return <Pill tone="ok">Configured</Pill>;
		}
		if (record.verification_attempted_at) {
			return <Pill tone="err">Failed</Pill>;
		}
		return <Pill tone="warn">Pending</Pill>;
	};

	return (
		<TableRow>
			<TableCell className="text-sm w-[20%] min-w-[120px] max-w-0">
				<div className="truncate" title={record.name}>
					{record.name}
				</div>
			</TableCell>
			<TableCell className="w-[10%] min-w-[60px]">
				<Tag>{record.record_type}</Tag>
			</TableCell>
			<TableCell className="w-[45%] min-w-[200px] max-w-0">
				<div className="flex min-w-0 items-center gap-2">
					<code
						className="block flex-1 truncate rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-[12px] text-secondary-foreground"
						title={record.value}
					>
						{record.value}
					</code>
					<Button
						variant="outline"
						size="icon-xs"
						onClick={() => copyToClipboard(record.value)}
						className="shrink-0"
						title="Copy to clipboard"
					>
						<DocumentDuplicateIcon className="h-3 w-3" />
					</Button>
				</div>
				{copied && (
					<span className="mt-1 block font-mono text-[10px] text-emerald-600">
						copied
					</span>
				)}
			</TableCell>
			<TableCell className="w-[15%] min-w-[100px]">
				<div className="flex items-center space-x-1">
					{getStatusIcon()}
					{getStatusBadge()}
				</div>
			</TableCell>
			<TableCell className="text-sm text-muted-foreground w-[10%] min-w-[80px] max-w-0">
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

	const configured = records.filter((r) => r.verified).length;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<h2 className="text-base font-medium tracking-tight text-foreground">
						{title}
					</h2>
					<Tag>
						{configured} of {records.length} configured
					</Tag>
				</div>
				<span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
					{description}
				</span>
			</div>

			<Table className="table-fixed w-full">
				<TableHeader>
					<TableRow>
						<TableHead className="w-[20%] min-w-[120px]">Name</TableHead>
						<TableHead className="w-[10%] min-w-[60px]">Type</TableHead>
						<TableHead className="w-[45%] min-w-[200px]">Value</TableHead>
						<TableHead className="w-[15%] min-w-[100px]">Status</TableHead>
						<TableHead className="w-[10%] min-w-[80px]">Last Checked</TableHead>
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

interface SmtpConfigFormProps {
	onSubmit: (config: SmtpConfigRequest) => void;
	onVerify: (config: SmtpConfigRequest) => void;
	onRemove: () => void;
	existingConfig?: CustomSmtpConfig | null;
	isSubmitting?: boolean;
	isVerifying?: boolean;
	isRemoving?: boolean;
}

function SmtpConfigForm({
	onSubmit,
	onVerify,
	onRemove,
	existingConfig,
	isSubmitting = false,
	isVerifying = false,
	isRemoving = false,
}: SmtpConfigFormProps) {
	const [host, setHost] = useState(existingConfig?.host || "");
	const [port, setPort] = useState(existingConfig?.port?.toString() || "587");
	const [username, setUsername] = useState(existingConfig?.username || "");
	const [password, setPassword] = useState("");
	const [fromEmail, setFromEmail] = useState(existingConfig?.from_email || "");
	const [useTls, setUseTls] = useState(existingConfig?.use_tls ?? true);

	const getConfig = (): SmtpConfigRequest => ({
		host,
		port: parseInt(port, 10),
		username,
		password,
		from_email: fromEmail,
		use_tls: useTls,
	});

	const isFormValid = host && port && username && password && fromEmail;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field>
					<Label>SMTP Host</Label>
					<Input
						type="text"
						value={host}
						onChange={(e) => setHost(e.target.value)}
						placeholder="smtp.example.com"
					/>
				</Field>
				<Field>
					<Label>Port</Label>
					<Input
						type="number"
						value={port}
						onChange={(e) => setPort(e.target.value)}
						placeholder="587"
					/>
				</Field>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field>
					<Label>Username</Label>
					<Input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="your-username"
					/>
				</Field>
				<Field>
					<Label>Password</Label>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={existingConfig ? "••••••••" : "Enter password"}
					/>
				</Field>
			</div>

			<Field>
				<Label>From Email</Label>
				<Input
					type="email"
					value={fromEmail}
					onChange={(e) => setFromEmail(e.target.value)}
					placeholder="noreply@example.com"
				/>
				<Text className="text-xs text-muted-foreground mt-1">
					Emails will be sent from this address
				</Text>
			</Field>

			<CheckboxField>
				<Checkbox
					checked={useTls}
					onCheckedChange={(checked) => setUseTls(checked === true)}
				/>
				<Label>Use TLS (STARTTLS)</Label>
			</CheckboxField>

			<div className="flex items-center space-x-3 pt-2">
				<Button
					onClick={() => onVerify(getConfig())}
					disabled={!isFormValid || isVerifying}
					variant="outline"
					className="gap-1.5"
				>
					<PlayIcon className="h-4 w-4" />
					{isVerifying ? "Testing..." : "Test Connection"}
				</Button>
				<Button
					onClick={() => onSubmit(getConfig())}
					disabled={!isFormValid || isSubmitting}
					className="gap-1.5"
				>
					<CheckIcon className="h-4 w-4" />
					{isSubmitting ? "Saving..." : existingConfig ? "Update Configuration" : "Save Configuration"}
				</Button>
				<div className="flex-1" />
				{existingConfig && (
					<Button
						onClick={onRemove}
						disabled={isRemoving}
						variant="destructive"
					>
						{isRemoving ? "Removing..." : "Remove & Use Postmark"}
					</Button>
				)}
			</div>
		</div>
	);
}

type EmailConfigMode = "postmark" | "smtp";

interface DnsVerificationPanelCompactProps {
	domainRecords?: DomainVerificationRecords;
	emailRecords?: EmailVerificationRecords;
	verificationStatus?: string;
	onVerify?: () => void;
	isVerifying?: boolean;
	compact?: boolean;
	emailProvider?: EmailProvider;
	smtpConfig?: CustomSmtpConfig | null;
	onSmtpSubmit?: (config: SmtpConfigRequest) => void;
	onSmtpVerify?: (config: SmtpConfigRequest) => void;
	onSmtpRemove?: () => void;
	isSmtpSubmitting?: boolean;
	isSmtpVerifying?: boolean;
	isSmtpRemoving?: boolean;
}

export function DnsVerificationPanel({
	domainRecords,
	emailRecords,
	verificationStatus,
	onVerify,
	isVerifying = false,
	compact = false,
	emailProvider,
	smtpConfig,
	onSmtpSubmit,
	onSmtpVerify,
	onSmtpRemove,
	isSmtpSubmitting = false,
	isSmtpVerifying = false,
	isSmtpRemoving = false,
}: DnsVerificationPanelCompactProps) {
	const [emailConfigMode, setEmailConfigMode] = useState<EmailConfigMode>(
		emailProvider === "custom_smtp" ? "smtp" : "postmark"
	);

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
					<Pill tone="ok">
						<CheckCircleIcon className="h-4 w-4 mr-1" />
						Configured
					</Pill>
				);
			case "in_progress":
				return (
					<Pill tone="warn">
						<ClockIcon className="h-4 w-4 mr-1" />
						In Progress
					</Pill>
				);
			case "failed":
				return (
					<Pill tone="err">
						<ExclamationTriangleIcon className="h-4 w-4 mr-1" />
						Failed
					</Pill>
				);
			case "pending":
			default:
				return (
					<Pill tone="mute">
						<ClockIcon className="h-4 w-4 mr-1" />
						Pending
					</Pill>
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
							<Text className="text-sm text-muted-foreground mt-1">
								Your production deployment requires DNS configuration to be
								fully functional.
							</Text>
							<div className="mt-2 flex items-center space-x-3">
								<Pill tone="warn">
									{verifiedRecords} of {totalRecords} records configured
								</Pill>
								<Link
									to="go-live"
									className="text-sm text-primary hover:text-primary dark:text-primary dark:hover:text-primary flex items-center space-x-1"
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
		<div className="flex flex-col gap-8">
			<PageHead
				className="mb-0"
				eyebrow="Production"
				title="Go live"
				sub="Configure DNS records and email delivery so Wacht can serve your custom domain."
				actions={
					<>
						{getVerificationStatusBadge()}
						{verificationStatus !== "verified" && (
							<Pill tone="mute">
								{verifiedRecords} of {totalRecords} records configured
							</Pill>
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
					</>
				}
			/>

			{allDomainRecords.length > 0 && (
				<DnsRecordSection
					title="Domain configuration"
					description="Add these records to enable your custom domain"
					records={allDomainRecords}
				/>
			)}

			{/* Email delivery */}
			<div className="flex flex-col gap-4">
				<div className="flex items-baseline justify-between gap-3">
					<h2 className="text-base font-medium tracking-tight text-foreground">
						Email delivery
					</h2>
					<span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
						required for verification &amp; magic links
					</span>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<button
						type="button"
						onClick={() => setEmailConfigMode("postmark")}
						className={cn(
							"rounded-lg border p-4 text-left transition-all",
							emailConfigMode === "postmark"
								? "border-primary ring-3 ring-primary/15"
								: "border-border bg-card hover:border-muted-foreground/40",
						)}
					>
						<div className="mb-1.5 flex items-center gap-3">
							<EnvelopeIcon
								className={cn(
									"h-[18px] w-[18px] shrink-0",
									emailConfigMode === "postmark"
										? "text-primary"
										: "text-muted-foreground",
								)}
							/>
							<span className="text-sm font-medium text-foreground">
								Postmark
							</span>
							<Tag>required</Tag>
							<div className="flex-1" />
							<Pill tone={emailProvider === "postmark" ? "ok" : "mute"}>
								{emailProvider === "postmark" ? "active" : "not set"}
							</Pill>
						</div>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Add DNS records and let Wacht handle delivery from
							postmarkapp.com.
						</p>
					</button>

					<button
						type="button"
						onClick={() => setEmailConfigMode("smtp")}
						className={cn(
							"rounded-lg border p-4 text-left transition-all",
							emailConfigMode === "smtp"
								? "border-primary ring-3 ring-primary/15"
								: "border-border bg-card hover:border-muted-foreground/40",
						)}
					>
						<div className="mb-1.5 flex items-center gap-3">
							<ServerIcon
								className={cn(
									"h-[18px] w-[18px] shrink-0",
									emailConfigMode === "smtp"
										? "text-primary"
										: "text-muted-foreground",
								)}
							/>
							<span className="text-sm font-medium text-foreground">
								Custom SMTP
							</span>
							<Tag>optional</Tag>
							<div className="flex-1" />
							<Pill tone={emailProvider === "custom_smtp" ? "ok" : "mute"}>
								{emailProvider === "custom_smtp" ? "active" : "not set"}
							</Pill>
						</div>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Use your own SMTP server. Best for vanity from-addresses.
						</p>
					</button>
				</div>

				{/* Postmark DNS Records */}
				{emailConfigMode === "postmark" && allEmailRecords.length > 0 && (
					<DnsRecordSection
						title="Email DNS records"
						description="Add these records to enable email delivery via Postmark"
						records={allEmailRecords}
					/>
				)}

				{/* SMTP Configuration Form */}
				{emailConfigMode === "smtp" && onSmtpSubmit && onSmtpVerify && onSmtpRemove && (
					<div className="bg-card rounded-lg border border-border p-5">
						<SmtpConfigForm
							existingConfig={smtpConfig}
							onSubmit={onSmtpSubmit}
							onVerify={onSmtpVerify}
							onRemove={onSmtpRemove}
							isSubmitting={isSmtpSubmitting}
							isVerifying={isSmtpVerifying}
							isRemoving={isSmtpRemoving}
						/>
					</div>
				)}
			</div>

			{allDomainRecords.length === 0 && allEmailRecords.length === 0 && emailConfigMode === "postmark" && (
				<div className="text-center py-12">
					<Text className="text-muted-foreground">
						No DNS records found. Create a production deployment to generate
						configuration records.
					</Text>
				</div>
			)}
		</div>
	);
}

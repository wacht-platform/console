import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface BackupCodesModalProps {
	isOpen: boolean;
	onClose: () => void;
	codes: string[];
}

export function BackupCodesModal({
	isOpen,
	onClose,
	codes,
}: BackupCodesModalProps) {
	const [copied, setCopied] = useState(false);

	const copyAll = async () => {
		try {
			await navigator.clipboard.writeText(codes.join("\n"));
			setCopied(true);
			toast.success("Backup codes copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New backup codes</DialogTitle>
					<DialogDescription>
						Save these codes somewhere safe. They will not be shown again.
						Each code is single-use.
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-secondary/50 p-4 font-mono text-sm dark:border-border dark:bg-primary/50">
					{codes.map((code) => (
						<div key={code} className="text-foreground">
							{code}
						</div>
					))}
				</div>
				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={copyAll}>
						{copied ? "Copied" : "Copy all"}
					</Button>
					<Button onClick={onClose}>Done</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

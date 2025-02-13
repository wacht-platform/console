import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Strong, Text } from "@/components/ui/text";

export default function EmailsPage() {
	return (
		<div className="flex flex-col gap-2 mb-2">
			<Heading>E-mails Templates</Heading>
			<div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm w-64">
				<div className="space-y-2">
					<Strong>Invitation</Strong>
					<Text className="text-gray-500">Never modified</Text>
					<Button outline className="text-xs pointer-events-none">
						Default
					</Button>
				</div>
			</div>
		</div>
	);
}

import { useState, useEffect } from "react";
import { useUpdateOrganization } from "@/lib/api/hooks/use-organization-mutations";
import {
	Dialog,
	DialogTitle,
	DialogBody,
	DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/fieldset";

interface EditOrganizationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	organization: {
		id: string;
		name: string;
		description: string;
		image_url: string;
		public_metadata: Record<string, unknown>;
		private_metadata: Record<string, unknown>;
	};
}

export function EditOrganizationDialog({
	isOpen,
	onClose,
	organization,
}: EditOrganizationDialogProps) {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		image_url: "",
	});

	const updateOrganization = useUpdateOrganization();

	useEffect(() => {
		if (organization) {
			setFormData({
				name: organization.name,
				description: organization.description,
				image_url: organization.image_url,
			});
		}
	}, [organization]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await updateOrganization.mutateAsync({
				organizationId: organization.id,
				data: {
					name: formData.name !== organization.name ? formData.name : undefined,
					description:
						formData.description !== organization.description
							? formData.description
							: undefined,
					image_url:
						formData.image_url !== organization.image_url
							? formData.image_url
							: undefined,
				},
			});
			onClose();
		} catch (error) {
			console.error("Failed to update organization:", error);
		}
	};

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle>Edit Organization</DialogTitle>

			<DialogBody>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Organization Name</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => handleChange("name", e.target.value)}
								placeholder="Enter organization name"
								required
							/>
						</div>

						<div>
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => handleChange("description", e.target.value)}
								placeholder="Enter organization description"
								rows={3}
							/>
						</div>

						<div>
							<Label htmlFor="image_url">Logo URL</Label>
							<Input
								id="image_url"
								value={formData.image_url}
								onChange={(e) => handleChange("image_url", e.target.value)}
								placeholder="Enter logo URL"
								type="url"
							/>
						</div>
					</div>
				</form>
			</DialogBody>

			<DialogActions>
				<Button
					type="button"
					outline
					onClick={onClose}
					disabled={updateOrganization.isPending}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					onClick={handleSubmit}
					disabled={updateOrganization.isPending}
				>
					{updateOrganization.isPending ? "Updating..." : "Update Organization"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

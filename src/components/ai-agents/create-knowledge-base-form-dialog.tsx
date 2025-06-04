import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, FieldGroup, Fieldset, Label } from "../ui/fieldset";
import {
	Dialog,
	DialogActions,
	DialogBody,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";

interface CreateKnowledgeBaseFormDialogProps {
	open: boolean;
	onClose: () => void;
	onCreate: (name: string, description?: string) => Promise<void>;
}

interface KnowledgeBaseFormData {
	name: string;
	description: string;
}

export function CreateKnowledgeBaseFormDialog({
	open,
	onClose,
	onCreate,
}: CreateKnowledgeBaseFormDialogProps) {
	const [formData, setFormData] = useState<KnowledgeBaseFormData>({
		name: "",
		description: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onCreate(formData.name.trim(), formData.description.trim() || undefined);
			setFormData({ name: "", description: "" });
		} catch (error) {
			console.error("Error creating knowledge base:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData({ name: "", description: "" });
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} size="lg">
			<DialogTitle>Create Knowledge Base</DialogTitle>
			<DialogDescription>
				Create a new knowledge base to organize and store documents that AI agents can reference.
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody>
					<Fieldset>
						<FieldGroup className="space-y-4">
							<Field>
								<Label>Name</Label>
								<Input
									required
									placeholder="Enter knowledge base name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe the purpose of this knowledge base"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</Field>
						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={handleClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={!formData.name.trim() || isSubmitting}
					>
						{isSubmitting ? "Creating..." : "Create Knowledge Base"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

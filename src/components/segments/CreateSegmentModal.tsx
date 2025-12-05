import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorMessage } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSegment, useUpdateSegment } from "@/lib/api/hooks/use-segments";
import { Segment, SegmentType } from "@/types/segment";

interface CreateSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentToEdit?: Segment | null;
}

export function CreateSegmentModal({
  isOpen,
  onClose,
  segmentToEdit,
}: CreateSegmentModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<SegmentType>("user");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createSegmentMutation = useCreateSegment();
  const updateSegmentMutation = useUpdateSegment();

  useEffect(() => {
    if (segmentToEdit) {
      setName(segmentToEdit.name);
      setDescription(segmentToEdit.description || "");
      setType(segmentToEdit.type);
    } else {
      setName("");
      setDescription("");
      setType("user");
    }
    setErrors({});
  }, [segmentToEdit, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Segment name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (segmentToEdit) {
        await updateSegmentMutation.mutateAsync({
            segmentId: segmentToEdit.id,
            data: {
                name: name.trim(),
                description: description.trim(),
            }
        });
      } else {
        await createSegmentMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          type,
        });
      }

      handleClose();
    } catch (error) {
      console.error("Error saving segment:", error);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setErrors({});
    onClose();
  };

  const isPending = createSegmentMutation.isPending || updateSegmentMutation.isPending;

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>{segmentToEdit ? "Edit Segment" : "Create Segment"}</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label>Segment Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter segment name"
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </Field>

          <Field>
            <Label>Type</Label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as SegmentType)}
              disabled={!!segmentToEdit}
            >
              <option value="user">User</option>
              <option value="organization">Organization</option>
              <option value="workspace">Workspace</option>
            </Select>
          </Field>

          <Field>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter segment description"
              rows={3}
            />
          </Field>
        </form>
      </DialogBody>
      <DialogActions>
        <Button outline onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending
            ? (segmentToEdit ? "Updating..." : "Creating...")
            : (segmentToEdit ? "Update Segment" : "Create Segment")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

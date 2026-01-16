import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{segmentToEdit ? "Edit Segment" : "Create Segment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter segment name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as SegmentType)}
                disabled={!!segmentToEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="workspace">Workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter segment description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? (segmentToEdit ? "Updating..." : "Creating...")
                : (segmentToEdit ? "Update Segment" : "Create Segment")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

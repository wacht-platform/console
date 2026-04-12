import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import type { AiTool } from "../../types/ai-tool";
import { ToolEditorForm } from "./tool-editor-form";

interface CreateToolDialogProps {
    open: boolean;
    onClose: () => void;
    tool?: AiTool;
}

export function CreateToolDialog({
    open,
    onClose,
    tool,
}: CreateToolDialogProps) {
    const isEditing = !!tool;

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-6xl max-h-[92vh] flex flex-col gap-0 p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{isEditing ? "Edit Tool" : "Create Tool"}</DialogTitle>
                    <DialogDescription>
                        Configure a tool for your AI agents to use.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                    <ToolEditorForm
                        tool={tool}
                        onSaved={() => onClose()}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

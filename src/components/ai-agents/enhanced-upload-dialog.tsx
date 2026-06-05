import { useState, useRef } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "../ui/dialog";
import {
    CloudArrowUpIcon,
    XMarkIcon,
    DocumentIcon,
} from "@heroicons/react/24/outline";
import { useUploadDocument } from "../../lib/api/hooks/use-knowledge-bases";
import { toast } from "sonner";

interface EnhancedUploadDialogProps {
    open: boolean;
    onClose: () => void;
    knowledgeBaseId: string;
}

export function EnhancedUploadDialog({
    open,
    onClose,
    knowledgeBaseId,
}: EnhancedUploadDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const uploadDocumentMutation = useUploadDocument(knowledgeBaseId);

    const resetForm = () => {
        setFiles([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (files.length === 0) {
            return;
        }

        const uploadPromise = async () => {
            for (const file of files) {
                const uploadFormData = new FormData();
                const title = file.name.replace(/\.[^/.]+$/, "");
                uploadFormData.append("title", title);
                uploadFormData.append("file", file);

                await uploadDocumentMutation.mutateAsync(uploadFormData);
            }
        };

        try {
            await toast.promise(uploadPromise(), {
                loading:
                    files.length === 1
                        ? "Uploading document..."
                        : `Uploading ${files.length} documents...`,
                success:
                    files.length === 1
                        ? "Document uploaded successfully!"
                        : `${files.length} documents uploaded successfully!`,
                error: "Failed to upload documents. Please try again.",
            });
            handleClose();
        } catch (error) {
            console.error("Error uploading:", error);
        }
    };

    const handleFileSelect = (fileList: FileList) => {
        const newFiles = Array.from(fileList);
        setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList && fileList.length > 0) {
            handleFileSelect(fileList);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const fileList = e.dataTransfer.files;
        if (fileList && fileList.length > 0) {
            handleFileSelect(fileList);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const isUploading = uploadDocumentMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-2">
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted hover:border-foreground/25 hover:bg-secondary"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-primary/10 p-4 rounded-full">
                                    <CloudArrowUpIcon className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Maximum file size 10MB
                                    </p>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                accept=".pdf,.md,.markdown,.txt,.json"
                                onChange={handleFileInputChange}
                            />
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {files.length}{" "}
                                        {files.length === 1 ? "file" : "files"}{" "}
                                        selected
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFiles([])}
                                        className="h-auto p-0 text-xs text-destructive hover:text-destructive hover:bg-transparent"
                                    >
                                        Clear all
                                    </Button>
                                </div>

                                <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-background group"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-muted p-2 rounded">
                                                    <DocumentIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate">
                                                        {file.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatFileSize(
                                                            file.size,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    removeFile(index)
                                                }
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUploading || files.length === 0}
                            className="min-w-[100px]"
                        >
                            {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

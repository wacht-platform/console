import { Button } from "@/components/ui/button";

interface SavePopupProps {
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
    /** Label for the primary button (defaults to "Save changes"). */
    saveLabel?: string;
}

export default function SavePopup({ isDirty, isSaving, onSave, onCancel, saveLabel = "Save changes" }: SavePopupProps) {
    if (!isDirty) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-card/80 py-2 pl-4 pr-2 shadow-xl ring-1 ring-black/5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200 dark:ring-white/10">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/70" />
                        <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                    </span>
                    Unsaved changes
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Discard
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving…" : saveLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
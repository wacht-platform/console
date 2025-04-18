import { Button } from "@/components/ui/button";

interface SavePopupProps {
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export default function SavePopup({ isDirty, isSaving, onSave, onCancel }: SavePopupProps) {
    if (!isDirty) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    You have unsaved changes.
                </p>
                <div className="flex gap-3">
                    <Button
                        outline
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
} 
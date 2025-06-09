import { useState } from 'react';
import { useAuthSettingsStore } from '@/lib/store/auth-settings-store';
import { useUpdateDeploymentAuthSettings } from './use-update-deployment-auth-settings';
import { toast } from 'sonner';

/**
 * Hook for saving auth settings with loading state
 */
export function useSaveAuthSettings() {
    const [isSaving, setIsSaving] = useState(false);
    const { isDirty, saveSettings, resetSettings } = useAuthSettingsStore();
    const updateMutation = useUpdateDeploymentAuthSettings();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveSettings();
            toast.success("Authentication settings saved successfully!");
            return true;
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save authentication settings. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        resetSettings();
    };

    return {
        isDirty,
        isSaving,
        saveSettings: handleSave,
        resetSettings: handleReset,
        isError: updateMutation.isError,
        error: updateMutation.error
    };
} 
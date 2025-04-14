import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { DeploymentAuthSettings } from "@/types/deployment";

// Types to match the backend schema
interface NameSettings {
    first_name_enabled: boolean;
    first_name_required: boolean;
    last_name_enabled: boolean;
    last_name_required: boolean;
}

interface AuthenticationFactorSettings {
    sso_enabled?: boolean;
    web3_wallet_enabled?: boolean;
    magic_link?: {
        enabled: boolean;
        require_same_device: boolean;
    };
    email_otp_enabled?: boolean;
    phone_otp_enabled?: boolean;
    passkey?: {
        enabled: boolean;
        allow_autofill: boolean;
    };
    second_factor_phone_otp_enabled?: boolean;
    second_factor_authenticator_enabled?: boolean;
    second_factor_backup_code_enabled?: boolean;
}

interface DeploymentAuthSettingsUpdates {
    email?: {
        enabled: boolean;
        required: boolean;
        verify_signup?: boolean;
        otp_verification_allowed?: boolean;
        magic_link_verification_allowed?: boolean;
    };
    phone?: {
        enabled: boolean;
        required: boolean;
        verify_signup?: boolean;
        sms_verification_allowed?: boolean;
        whatsapp_verification_allowed?: boolean;
    };
    username?: {
        enabled: boolean;
        required: boolean;
        min_length?: number;
        max_length?: number;
    };
    password?: {
        enabled: boolean;
        min_length?: number;
        require_lowercase?: boolean;
        require_uppercase?: boolean;
        require_number?: boolean;
        require_special?: boolean;
    };
    name?: NameSettings;
    authentication_factors?: AuthenticationFactorSettings;
    restrictions?: {
        blocked_country_codes: string[];
        banned_keywords: string[];
        email_allowlist: string[];
        email_blocklist: string[];
        block_voip_numbers: boolean;
        restrict_signup: boolean;
        block_temporary_emails: boolean;
        block_special_characters_in_email: boolean;
    };
    social_connections?: Array<{
        provider?: string;
        id?: string;
        client_id: string;
        client_secret: string;
        enabled?: boolean;
    }>;
    session?: {
        max_session_age?: number;
        inactivity_timeout?: number;
        allow_multi_account_session?: boolean;
        default_jwt_template?: string;
    };
}

async function updateDeploymentAuthSettings(
    deploymentId: string,
    settings: DeploymentAuthSettingsUpdates
): Promise<void> {

    await apiClient.patch(
        `/deployments/${deploymentId}/settings/auth-settings`,
        settings
    );
}

export function useUpdateDeploymentAuthSettings() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    const mutation = useMutation({
        mutationFn: (settings: DeploymentAuthSettings) => {
            if (!selectedDeployment) {
                throw new Error("No deployment selected");
            }
            return updateDeploymentAuthSettings(selectedDeployment.id, settings);
        },
        onSuccess: () => {
            // Invalidate deployment settings query to refresh data
            if (selectedDeployment) {
                queryClient.invalidateQueries({
                    queryKey: ["deploymentSettings", selectedDeployment.id],
                });
            }
        },
    });

    return mutation;
} 
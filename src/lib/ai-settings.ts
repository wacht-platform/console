export interface AIStorageSettingsSummary {
    provider: "s3";
    bucket: string | null;
    endpoint: string | null;
    access_key_id_set: boolean;
    secret_access_key_set: boolean;
}

export interface AISettingsSummary {
    gemini_api_key_set: boolean;
    openai_api_key_set: boolean;
    openrouter_api_key_set: boolean;
    storage: AIStorageSettingsSummary;
}

export function hasProviderApiKey(settings?: AISettingsSummary) {
    return (
        !!settings?.gemini_api_key_set ||
        !!settings?.openai_api_key_set ||
        !!settings?.openrouter_api_key_set
    );
}

export function isS3StorageConfigured(settings?: {
    storage?: AIStorageSettingsSummary;
}) {
    const storage = settings?.storage;

    return Boolean(
        storage?.provider === "s3" &&
            storage.bucket &&
            storage.endpoint &&
            storage.access_key_id_set &&
            storage.secret_access_key_set,
    );
}

import { create } from "zustand";
import type {
  DeploymentAuthSettings,
  IndividualAuthSettings,
  EmailSettings,
  PhoneSettings,
  UsernameSettings,
  PasswordSettings,
  EmailLinkSettings,
  PasskeySettings,
  AuthFactorsEnabled,
  MultiSessionSupport,
} from "@/types/deployment"; // Import full types
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentAuthSettings } from "@/lib/api/hooks/use-update-deployment-auth-settings";
import { UseMutationResult } from "@tanstack/react-query"; // Import useMutation
import {
  AuthenticationFactorSettings,
  DeploymentAuthSettingsUpdates,
} from "@/types/project";

let originalSettings: DeploymentAuthSettings | null = null;

interface AuthSettingsState {
  settings: DeploymentAuthSettings;
  isLoaded: boolean;
  isDirty: boolean;

  initializeSettings: (settings: DeploymentAuthSettings) => void;
  updateEmailSettings: (settings: Partial<EmailSettings>) => void;
  updateMultiSessionSupport: (settings: Partial<MultiSessionSupport>) => void;
  updateSessionTokenLifetime: (settings: number) => void;
  updateSessionValidityPeriod: (settings: number) => void;
  updateSessionInactiveTimeout: (settings: number) => void;
  updatePhoneSettings: (settings: Partial<PhoneSettings>) => void;
  updateUsernameSettings: (settings: Partial<UsernameSettings>) => void;
  updatePasswordSettings: (settings: Partial<PasswordSettings>) => void;
  updateFirstNameSettings: (settings: Partial<IndividualAuthSettings>) => void;
  updateLastNameSettings: (settings: Partial<IndividualAuthSettings>) => void;
  updateMagicLinkSettings: (settings: Partial<EmailLinkSettings>) => void;
  updatePasskeySettings: (settings: Partial<PasskeySettings>) => void;
  updateSecondFactorPolicy: (
    policy: DeploymentAuthSettings["second_factor_policy"]
  ) => void;
  updateAuthFactorsEnabled: (settings: Partial<AuthFactorsEnabled>) => void;
  updateWeb3WalletSettings: (settings: Partial<IndividualAuthSettings>) => void;
  saveSettings: () => Promise<boolean>;
  resetSettings: () => void;
}

let updateAuthSettingsMethod:
  | null
  | ((payload: DeploymentAuthSettingsUpdates) => Promise<void>) = null;

export const setUpdateAuthSettingsMethod = (
  method: UseMutationResult<void, Error, DeploymentAuthSettingsUpdates, unknown>
) => {
  updateAuthSettingsMethod = (payload: DeploymentAuthSettingsUpdates) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log("payload", payload);
        method.mutate(payload, {
          onSuccess: () => resolve(),
          onError: (error: Error) => reject(error),
        });
      } catch (error) {
        reject(error);
      }
    });
  };
};

const getNested = <T, K extends keyof T>(
  obj: T,
  path: K[]
): T[K] | undefined => {
  let current: unknown = obj; // Start with the object, typed as unknown
  for (const key of path) {
    if (current && typeof current === "object" && key in current) {
      current = (current as any)[key]; // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      return undefined; // Path not found or not an object
    }
  }
  return current as T[K]; // Assert the final type
};

export const useAuthSettingsStore = create<AuthSettingsState>((set, get) => ({
  settings: {} as DeploymentAuthSettings,
  isLoaded: false,
  isDirty: false,

  initializeSettings: (settings) => {
    originalSettings = JSON.parse(JSON.stringify(settings));
    set(() => ({
      settings,
      isLoaded: true,
      isDirty: false,
    }));
  },

  updateEmailSettings: (emailSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        email_address: {
          ...state.settings.email_address,
          ...emailSettings,
        } as EmailSettings,
      },
      isDirty: true,
    }));
  },

  updateMultiSessionSupport: (
    multiSessionSupport: Partial<MultiSessionSupport>
  ) => {
    set((state) => ({
      settings: {
        ...state.settings,
        multi_session_support: {
          ...state.settings.multi_session_support,
          ...multiSessionSupport,
        } as MultiSessionSupport,
      },
      isDirty: true,
    }));
  },

  updateSessionTokenLifetime: (sessionTokenLifetime: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        session_token_lifetime: sessionTokenLifetime,
      },
      isDirty: true,
    }));
  },

  updateSessionValidityPeriod: (sessionValidityPeriod: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        session_validity_period: sessionValidityPeriod,
      },
      isDirty: true,
    }));
  },

  updateSessionInactiveTimeout: (sessionInactiveTimeout: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        session_inactive_timeout: sessionInactiveTimeout,
      },
      isDirty: true,
    }));
  },

  updatePhoneSettings: (phoneSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        phone_number: {
          ...state.settings.phone_number,
          ...phoneSettings,
        } as PhoneSettings,
      },
      isDirty: true,
    }));
  },

  updateUsernameSettings: (usernameSettings) => {
    const cleanSettings = { ...usernameSettings };
    if (cleanSettings.min_length === undefined)
      cleanSettings.min_length = undefined;
    if (cleanSettings.max_length === undefined)
      cleanSettings.max_length = undefined;

    set((state) => ({
      settings: {
        ...state.settings,
        username: {
          ...state.settings.username,
          ...cleanSettings,
        } as UsernameSettings,
      },
      isDirty: true,
    }));
  },

  updatePasswordSettings: (passwordSettings) => {
    const cleanSettings = { ...passwordSettings };
    if (cleanSettings.min_length === undefined)
      cleanSettings.min_length = undefined;

    set((state) => ({
      settings: {
        ...state.settings,
        password: {
          ...state.settings.password,
          ...cleanSettings,
        } as PasswordSettings,
      },
      isDirty: true,
    }));
  },

  updateFirstNameSettings: (firstNameSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        first_name: {
          ...state.settings.first_name,
          ...firstNameSettings,
        } as IndividualAuthSettings,
      },
      isDirty: true,
    }));
  },

  updateLastNameSettings: (lastNameSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        last_name: {
          ...state.settings.last_name,
          ...lastNameSettings,
        } as IndividualAuthSettings,
      },
      isDirty: true,
    }));
  },

  updateMagicLinkSettings: (magicLinkSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        magic_link: {
          ...state.settings.magic_link,
          ...magicLinkSettings,
        } as EmailLinkSettings,
      },
      isDirty: true,
    }));
  },

  updatePasskeySettings: (passkeySettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        passkey: {
          ...state.settings.passkey,
          ...passkeySettings,
        } as PasskeySettings,
      },
      isDirty: true,
    }));
  },

  updateSecondFactorPolicy: (policy) => {
    set((state) => ({
      settings: {
        ...state.settings,
        second_factor_policy: policy,
      },
      isDirty: true,
    }));
  },

  updateAuthFactorsEnabled: (authFactorsSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        auth_factors_enabled: {
          ...state.settings.auth_factors_enabled,
          ...authFactorsSettings,
        } as AuthFactorsEnabled,
      },
      isDirty: true,
    }));
  },

  updateWeb3WalletSettings: (web3WalletSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        web3_wallet: {
          ...state.settings.web3_wallet,
          ...web3WalletSettings,
        } as IndividualAuthSettings,
      },
      isDirty: true,
    }));
  },

  saveSettings: async (): Promise<boolean> => {
    if (!get().isDirty) {
      console.log("Form is not dirty, skipping save.");
      return true;
    }

    const currentSettings = get().settings;
    if (!originalSettings) {
      console.error("Original settings not available for comparison.");
      return false;
    }
    if (!updateAuthSettingsMethod) {
      console.error("Update method not set");
      return false;
    }

    const updates: DeploymentAuthSettingsUpdates = {};
    let hasChanges = false;

    const areDifferent = (path: string[]) => {
      const currentVal = getNested(
        currentSettings,
        path as unknown as (keyof DeploymentAuthSettings)[]
      );
      const originalVal = getNested(
        originalSettings,
        path as unknown as never[]
      );
      return JSON.stringify(currentVal) !== JSON.stringify(originalVal);
    };

    if (areDifferent(["email_address"])) {
      updates.email = { ...currentSettings.email_address };
      hasChanges = true;
    }
    if (areDifferent(["phone_number"])) {
      updates.phone = { ...currentSettings.phone_number };
      hasChanges = true;
    }
    if (areDifferent(["username"])) {
      updates.username = {
        enabled: currentSettings.username?.enabled,
        required: currentSettings.username?.required,
        min_length: currentSettings.username?.min_length ?? undefined,
        max_length: currentSettings.username?.max_length ?? undefined,
      };
      hasChanges = true;
    }
    if (areDifferent(["password"])) {
      updates.password = {
        enabled: currentSettings.password?.enabled,
        min_length: currentSettings.password?.min_length ?? undefined,
        require_lowercase: currentSettings.password?.require_lowercase,
        require_uppercase: currentSettings.password?.require_uppercase,
        require_number: currentSettings.password?.require_number,
        require_special: currentSettings.password?.require_special,
      };
      hasChanges = true;
    }
    if (areDifferent(["backup_code"])) {
      updates.backup_code = { ...currentSettings.backup_code };
      hasChanges = true;
    }
    if (areDifferent(["web3_wallet"])) {
      updates.web3_wallet = { ...currentSettings.web3_wallet };
      hasChanges = true;
    }

    if (areDifferent(["first_name"]) || areDifferent(["last_name"])) {
      updates.name = {
        first_name_enabled: currentSettings.first_name?.enabled,
        first_name_required: !!currentSettings.first_name?.required,
        last_name_enabled: currentSettings.last_name?.enabled,
        last_name_required: !!currentSettings.last_name?.required,
      };
      hasChanges = true;
    }

    const authFactorsPayload: AuthenticationFactorSettings = {};
    let authFactorsHasChanges = false;

    if (areDifferent(["auth_factors_enabled", "sso"])) {
      authFactorsPayload.sso_enabled =
        currentSettings.auth_factors_enabled?.sso;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["auth_factors_enabled", "web3_wallet"])) {
      authFactorsPayload.web3_wallet_enabled =
        currentSettings.auth_factors_enabled?.web3_wallet;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["auth_factors_enabled", "email_otp"])) {
      authFactorsPayload.email_otp_enabled =
        currentSettings.auth_factors_enabled?.email_otp;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["auth_factors_enabled", "phone_otp"])) {
      authFactorsPayload.phone_otp_enabled =
        currentSettings.auth_factors_enabled?.phone_otp;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["auth_factors_enabled", "authenticator"])) {
      authFactorsPayload.second_factor_authenticator_enabled =
        currentSettings.auth_factors_enabled?.authenticator;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["auth_factors_enabled", "backup_code"])) {
      authFactorsPayload.second_factor_backup_code_enabled =
        currentSettings.auth_factors_enabled?.backup_code;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["magic_link"])) {
      authFactorsPayload.magic_link = {
        ...currentSettings.magic_link,
      } as EmailLinkSettings;
      authFactorsHasChanges = true;
    }
    if (areDifferent(["passkey"])) {
      authFactorsPayload.passkey = {
        ...currentSettings.passkey,
      } as PasskeySettings;
      authFactorsHasChanges = true;
    }

    if (authFactorsHasChanges) {
      updates.authentication_factors =
        authFactorsPayload as unknown as AuthenticationFactorSettings;
      hasChanges = true;
    }

    if (areDifferent(["second_factor_policy"])) {
      updates.second_factor_policy = currentSettings.second_factor_policy;
      hasChanges = true;
    }

    if (areDifferent(["multi_session_support"])) {
      updates.multi_session_support = currentSettings.multi_session_support;
      hasChanges = true;
    }

    if (areDifferent(["session_token_lifetime"])) {
      updates.session_token_lifetime = currentSettings.session_token_lifetime;
      hasChanges = true;
    }

    if (areDifferent(["session_validity_period"])) {
      updates.session_validity_period = currentSettings.session_validity_period;
      hasChanges = true;
    }

    if (areDifferent(["session_inactive_timeout"])) {
      updates.session_inactive_timeout =
        currentSettings.session_inactive_timeout;
      hasChanges = true;
    }

    if (!hasChanges && get().isDirty) {
      console.warn(
        "Form is dirty, but no specific changes detected by diffing logic. Sending empty update."
      );
    }

    try {
      await updateAuthSettingsMethod(updates);
      originalSettings = JSON.parse(JSON.stringify(get().settings));
      set({ isDirty: false });
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  },

  resetSettings: () => {
    if (originalSettings) {
      set({
        settings: JSON.parse(JSON.stringify(originalSettings)),
        isDirty: false,
      });
    }
  },
}));

export const useInitializeAuthSettings = () => {
  const { deploymentSettings, isLoading } = useCurrentDeployemnt();
  const { initializeSettings, isLoaded } = useAuthSettingsStore();
  const updateMutation = useUpdateDeploymentAuthSettings();

  if (updateMutation && !updateAuthSettingsMethod) {
    setUpdateAuthSettingsMethod(updateMutation);
  }

  if (!isLoading && deploymentSettings?.auth_settings && !isLoaded) {
    initializeSettings(deploymentSettings.auth_settings);
  }

  return { isLoading };
};

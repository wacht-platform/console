import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/fieldset";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Switch } from "@/components/ui/switch";
import {
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthSettingsStore, useInitializeAuthSettings } from "@/lib/store/auth-settings-store";
import { useSaveAuthSettings } from "@/lib/api/hooks/use-save-auth-settings";
import { Spinner } from "@/components/ui/spinner";


export default function SessionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading } = useInitializeAuthSettings();
  const { 
    settings, 
    isDirty,
    updateSessionValidityPeriod,
    updateSessionInactiveTimeout,
    updateSessionTokenLifetime,
    updateMultiSessionSupport
  } = useAuthSettingsStore();
  const { isSaving, saveSettings, resetSettings } = useSaveAuthSettings();

  // Form state
  const [sessionValidityValue, setSessionValidityValue] = useState(30);
  const [sessionValidityUnit, setSessionValidityUnit] = useState("days");
  const [inactivityTimeoutValue, setInactivityTimeoutValue] = useState(7);
  const [inactivityTimeoutUnit, setInactivityTimeoutUnit] = useState("days");
  const [tokenExpirationValue, setTokenExpirationValue] = useState(30);
  const [tokenExpirationUnit, setTokenExpirationUnit] = useState("minutes");
  const [multiSessionEnabled, setMultiSessionEnabled] = useState(false);
  const [maxAccountsPerSession, setMaxAccountsPerSession] = useState(1);
  const [maxSessionsPerAccount, setMaxSessionsPerAccount] = useState(1);
  
  // Flag to prevent store updates during form reset
  const [isResetting, setIsResetting] = useState(false);

  // Load data from backend when available
  useEffect(() => {
    if (isDirty) return; // Don't override user changes
    if (settings) {
      setIsResetting(true); // Prevent store updates during reset

      // Convert session_validity_period from seconds to appropriate unit (matching auth settings logic)
      const validitySeconds = settings.session_validity_period || 2592000; // 30 days default
      const validityUnit = validitySeconds / 86400 > 1 ? "days" : validitySeconds / 3600 > 1 ? "hours" : "minutes";

      if (validityUnit === "days") {
        setSessionValidityValue(Math.floor(validitySeconds / 86400));
        setSessionValidityUnit("days");
      } else if (validityUnit === "hours") {
        setSessionValidityValue(Math.floor(validitySeconds / 3600));
        setSessionValidityUnit("hours");
      } else {
        setSessionValidityValue(Math.floor(validitySeconds / 60));
        setSessionValidityUnit("minutes");
      }

      // Convert session_inactive_timeout from seconds to appropriate unit (matching auth settings logic)
      const inactivitySeconds = settings.session_inactive_timeout || 604800; // 7 days default
      const inactivityUnit = inactivitySeconds / 86400 > 1 ? "days" : inactivitySeconds / 3600 > 1 ? "hours" : "minutes";

      if (inactivityUnit === "days") {
        setInactivityTimeoutValue(Math.floor(inactivitySeconds / 86400));
        setInactivityTimeoutUnit("days");
      } else if (inactivityUnit === "hours") {
        setInactivityTimeoutValue(Math.floor(inactivitySeconds / 3600));
        setInactivityTimeoutUnit("hours");
      } else {
        setInactivityTimeoutValue(Math.floor(inactivitySeconds / 60));
        setInactivityTimeoutUnit("minutes");
      }

      // Convert session_token_lifetime from seconds to appropriate unit (matching auth settings logic)
      const tokenSeconds = settings.session_token_lifetime || 1800; // 30 minutes default
      const tokenUnit = tokenSeconds / 3600 > 1 ? "hours" : "minutes"; // Note: token lifetime only uses hours/minutes

      if (tokenUnit === "hours") {
        setTokenExpirationValue(Math.floor(tokenSeconds / 3600));
        setTokenExpirationUnit("hours");
      } else {
        setTokenExpirationValue(Math.floor(tokenSeconds / 60));
        setTokenExpirationUnit("minutes");
      }

      // Multi-session settings
      setMultiSessionEnabled(settings.multi_session_support?.enabled || false);
      setMaxAccountsPerSession(settings.multi_session_support?.max_accounts_per_session || 1);
      setMaxSessionsPerAccount(settings.multi_session_support?.max_sessions_per_account || 1);
      
      // Re-enable store updates after reset is complete
      setTimeout(() => setIsResetting(false), 0);
    }
  }, [settings, isDirty]);

  const convertToSeconds = (value: number, unit: string): number => {
    switch (unit) {
      case "minutes": return value * 60;
      case "hours": return value * 3600;
      case "days": return value * 86400;
      default: return value * 60;
    }
  };

  // Update store when form values change
  const handleSessionValidityChange = (value: number, unit: string) => {
    setSessionValidityValue(value);
    setSessionValidityUnit(unit);
    if (!isResetting) {
      updateSessionValidityPeriod(convertToSeconds(value, unit));
    }
  };

  const handleInactivityTimeoutChange = (value: number, unit: string) => {
    setInactivityTimeoutValue(value);
    setInactivityTimeoutUnit(unit);
    if (!isResetting) {
      updateSessionInactiveTimeout(convertToSeconds(value, unit));
    }
  };

  const handleTokenExpirationChange = (value: number, unit: string) => {
    setTokenExpirationValue(value);
    setTokenExpirationUnit(unit);
    if (!isResetting) {
      updateSessionTokenLifetime(convertToSeconds(value, unit));
    }
  };

  const handleMultiSessionChange = (enabled: boolean) => {
    setMultiSessionEnabled(enabled);
    if (!isResetting) {
      updateMultiSessionSupport({ enabled });
    }
  };

  const handleMaxAccountsChange = (maxAccounts: number) => {
    setMaxAccountsPerSession(maxAccounts);
    if (!isResetting) {
      updateMultiSessionSupport({ max_accounts_per_session: maxAccounts });
    }
  };

  const handleMaxSessionsChange = (maxSessions: number) => {
    setMaxSessionsPerAccount(maxSessions);
    if (!isResetting) {
      updateMultiSessionSupport({ max_sessions_per_account: maxSessions });
    }
  };

  const handleSave = async () => {
    await saveSettings();
  };

  const handleReset = () => {
    resetSettings();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading session settings...</span>
        </div>
      </div>
    );
  }





  return (
    <div>
      <Heading>Sessions</Heading>
      <div className="mt-8 space-y-10">
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>Session Validity</Subheading>
            <Text>
              The maximum lifetime of a session, regardless of user activity.
              After that, the session will be expired and the user will need to
              log in again.
            </Text>
          </div>
          <Field className="flex items-center gap-x-4">
            <FieldGroup>
              <Input
                aria-label="Duration"
                name="sessionValidityValue"
                inputClassName="text-right"
                type="number"
                min="1"
                value={sessionValidityValue}
                onChange={(e) => handleSessionValidityChange(parseInt(e.target.value) || 1, sessionValidityUnit)}
              />
            </FieldGroup>
            <FieldGroup className="flex-1">
              <Listbox name="sessionValidityUnit" value={sessionValidityUnit} onChange={(unit) => handleSessionValidityChange(sessionValidityValue, unit)}>
                <ListboxOption value="minutes">
                  <ListboxLabel>Minutes</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="hours">
                  <ListboxLabel>Hours</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="days">
                  <ListboxLabel>Days</ListboxLabel>
                </ListboxOption>
              </Listbox>
            </FieldGroup>
          </Field>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>Inactivity Timeout</Subheading>
            <Text>
              The maximum period of inactivity after which a session is
              terminated.
            </Text>
          </div>
          <Field className="flex items-center gap-x-4">
            <FieldGroup>
              <Input
                aria-label="Duration"
                inputClassName="text-right"
                name="inactivityTimeoutValue"
                type="number"
                min="1"
                value={inactivityTimeoutValue}
                onChange={(e) => handleInactivityTimeoutChange(parseInt(e.target.value) || 1, inactivityTimeoutUnit)}
              />
            </FieldGroup>
            <FieldGroup className="flex-1">
              <Listbox name="inactivityTimeoutUnit" value={inactivityTimeoutUnit} onChange={(unit) => handleInactivityTimeoutChange(inactivityTimeoutValue, unit)}>
                <ListboxOption value="minutes">
                  <ListboxLabel>Minutes</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="hours">
                  <ListboxLabel>Hours</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="days">
                  <ListboxLabel>Days</ListboxLabel>
                </ListboxOption>
              </Listbox>
            </FieldGroup>
          </Field>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>Token Expiration</Subheading>
            <Text>
              The maximum lifetime of a token. After that, the token will be
              expired and the token with be revalidated.
            </Text>
          </div>
          <Field className="flex items-center gap-x-4">
            <FieldGroup>
              <Input
                aria-label="Duration"
                name="tokenExpirationValue"
                inputClassName="text-right"
                type="number"
                min="1"
                value={tokenExpirationValue}
                onChange={(e) => handleTokenExpirationChange(parseInt(e.target.value) || 1, tokenExpirationUnit)}
              />
            </FieldGroup>
            <FieldGroup className="flex-1">
              <Listbox name="tokenExpirationUnit" value={tokenExpirationUnit} onChange={(unit) => handleTokenExpirationChange(tokenExpirationValue, unit)}>
                <ListboxOption value="minutes">
                  <ListboxLabel>Minutes</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="hours">
                  <ListboxLabel>Hours</ListboxLabel>
                </ListboxOption>
              </Listbox>
            </FieldGroup>
          </Field>
        </section>
      </div>

      <Divider className="my-10" soft />

      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Subheading className="text-sm font-medium">
              Multi Session Support
            </Subheading>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Enable multi-session support to allow users to have multiple
              sessions at the same time.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              plain
              type="button"
              onClick={() => setIsOpen(true)}
              disabled={!multiSessionEnabled}
            >
              <Cog6ToothIcon />
            </Button>
            <Dialog
              open={isOpen}
              onClose={setIsOpen}
              className="rounded-xl p-6"
            >
              <>
                <DialogTitle className="mb-2">
                  Customize session token
                </DialogTitle>
                <DialogDescription className="mb-6">
                  Customize the session token to include additional information.
                </DialogDescription>
                <DialogBody className="space-y-8">
                  <section className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Subheading>Maximum accounts per session</Subheading>
                      <Text>
                        Limit the number of accounts that can be active within a
                        single session.
                      </Text>
                    </div>
                    <div className="space-y-4">
                      <Field className="flex items-center gap-4">
                        <FieldGroup>
                          <Input
                            aria-label="Max accounts"
                            name="maxAccounts"
                            inputClassName="text-right"
                            type="number"
                            min="1"
                            max="10"
                            value={maxAccountsPerSession}
                            onChange={(e) => handleMaxAccountsChange(parseInt(e.target.value) || 1)}
                          />
                        </FieldGroup>
                      </Field>
                      <Text>Set a value between 1 and 10.</Text>
                    </div>
                  </section>

                  <Divider className="my-8" soft />

                  <section className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Subheading>Maximum user logins</Subheading>
                      <Text>
                        Set the maximum number of active sessions a user can
                        have at the same time.
                      </Text>
                    </div>
                    <div className="space-y-4">
                      <Field className="flex items-center gap-4">
                        <FieldGroup>
                          <Input
                            aria-label="Max user logins"
                            name="maxUserLogins"
                            inputClassName="text-right"
                            type="number"
                            min="1"
                            max="10"
                            value={maxSessionsPerAccount}
                            onChange={(e) => handleMaxSessionsChange(parseInt(e.target.value) || 1)}
                          />
                        </FieldGroup>
                      </Field>
                      <Text>Set a value between 1 and 10.</Text>
                    </div>
                  </section>

                  <Divider className="my-8" soft />
                </DialogBody>
                <DialogActions className="flex justify-end gap-4 mt-6">
                  <Button plain onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>Submit</Button>
                </DialogActions>
              </>
            </Dialog>
            <Switch
              name="multi_session_enabled"
              checked={multiSessionEnabled}
              onChange={handleMultiSessionChange}
            />
          </div>
        </div>
      </section>

      <Divider className="my-10" soft />

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              You have unsaved changes.
            </p>
            <div className="flex gap-3">
              <Button outline onClick={handleReset} disabled={isSaving}>
                Discard
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

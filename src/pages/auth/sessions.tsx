import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/fieldset";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthSettingsStore, useInitializeAuthSettings } from "@/lib/store/auth-settings-store";
import { useSaveAuthSettings } from "@/lib/api/hooks/use-save-auth-settings";
import { InlineLoader } from "@/components/ui/loading-screen";


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
      const validityUnit = validitySeconds / 86400 >= 1 ? "days" : validitySeconds / 3600 >= 1 ? "hours" : "minutes";

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
      const inactivityUnit = inactivitySeconds / 86400 >= 1 ? "days" : inactivitySeconds / 3600 >= 1 ? "hours" : "minutes";

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
      const tokenUnit = tokenSeconds / 3600 >= 1 ? "hours" : "minutes"; // Note: token lifetime only uses hours/minutes

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
    return <InlineLoader />;
  }

  return (
    <div>
      <div className="mb-6">
        <Heading>Sessions</Heading>
      </div>

      <div className="space-y-10">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-1">
            <Subheading>Session Validity</Subheading>
            <Text>
              The maximum lifetime of a session, regardless of user activity.
              After that, the session will be expired and the user will need to
              log in again.
            </Text>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              aria-label="Duration"
              name="sessionValidityValue"
              className="w-20 text-right"
              type="number"
              min="1"
              value={sessionValidityValue}
              onChange={(e) => handleSessionValidityChange(parseInt(e.target.value) || 1, sessionValidityUnit)}
            />
            <Select
              value={sessionValidityUnit}
              onValueChange={(unit) => handleSessionValidityChange(sessionValidityValue, unit)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-1">
            <Subheading>Inactivity Timeout</Subheading>
            <Text>
              The maximum period of inactivity after which a session is
              terminated.
            </Text>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              aria-label="Duration"
              className="w-20 text-right"
              name="inactivityTimeoutValue"
              type="number"
              min="1"
              value={inactivityTimeoutValue}
              onChange={(e) => handleInactivityTimeoutChange(parseInt(e.target.value) || 1, inactivityTimeoutUnit)}
            />
            <Select
              value={inactivityTimeoutUnit}
              onValueChange={(unit) => handleInactivityTimeoutChange(inactivityTimeoutValue, unit)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-1">
            <Subheading>Token Expiration</Subheading>
            <Text>
              The maximum lifetime of a token. After that, the token will be
              expired and the token with be revalidated.
            </Text>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              aria-label="Duration"
              name="tokenExpirationValue"
              className="w-20 text-right"
              type="number"
              min="1"
              value={tokenExpirationValue}
              onChange={(e) => handleTokenExpirationChange(parseInt(e.target.value) || 1, tokenExpirationUnit)}
            />
            <Select
              value={tokenExpirationUnit}
              onValueChange={(unit) => handleTokenExpirationChange(tokenExpirationValue, unit)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>

      <Divider className="my-10" soft />

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-1">
            <Subheading>Multi Session Support</Subheading>
            <Text>
              Enable multi-session support to allow users to have multiple
              sessions at the same time.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsOpen(true)}
              disabled={!multiSessionEnabled}
            >
              <Cog6ToothIcon />
            </Button>
            <Dialog
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    Customize session token
                  </DialogTitle>
                  <DialogDescription>
                    Customize the session token to include additional information.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-8 py-4">
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
                            className="w-20 text-right"
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
                            className="w-20 text-right"
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
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Switch
              name="multi_session_enabled"
              checked={multiSessionEnabled}
              onCheckedChange={handleMultiSessionChange}
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
              <Button variant="outline" onClick={handleReset} disabled={isSaving}>
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

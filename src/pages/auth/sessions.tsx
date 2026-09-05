import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { Input } from "@/components/ui/input";
import { Description, Field, Label } from "@/components/ui/fieldset";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
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
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <SectionLabel>Sessions</SectionLabel>
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 sm:max-w-md">
              <div className="text-sm font-medium text-foreground">
                Session validity
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The maximum lifetime of a session, regardless of activity.
                After that, the user must sign in again.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 sm:max-w-md">
              <div className="text-sm font-medium text-foreground">
                Inactivity timeout
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The maximum period of inactivity after which a session is
                terminated.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 sm:max-w-md">
              <div className="text-sm font-medium text-foreground">
                Token expiration
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The maximum lifetime of a token. After that, the token is
                revalidated.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">
              Multi-session support
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Allow users to have multiple sessions at the same time.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              type="button"
              onClick={() => setIsOpen(true)}
              disabled={!multiSessionEnabled}
            >
              <Cog6ToothIcon className="size-4" />
            </Button>
            <Dialog
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Multi-session limits
                  </DialogTitle>
                  <DialogDescription>
                    Cap how many accounts and logins can be active at once.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Field>
                    <Label>Accounts per session</Label>
                    <Description>1–10 accounts in a single session.</Description>
                    <Input
                      aria-label="Max accounts"
                      name="maxAccounts"
                      className="w-full"
                      type="number"
                      min="1"
                      max="10"
                      value={maxAccountsPerSession}
                      onChange={(e) => handleMaxAccountsChange(parseInt(e.target.value) || 1)}
                    />
                  </Field>
                  <Field>
                    <Label>Logins per user</Label>
                    <Description>1–10 active sessions at the same time.</Description>
                    <Input
                      aria-label="Max user logins"
                      name="maxUserLogins"
                      className="w-full"
                      type="number"
                      min="1"
                      max="10"
                      value={maxSessionsPerAccount}
                      onChange={(e) => handleMaxSessionsChange(parseInt(e.target.value) || 1)}
                    />
                  </Field>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>Done</Button>
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
        </div>
      </section>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">
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

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Divider } from "@/components/ui/divider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Description,
  Field,
  FieldGroup,
  Label,
} from "@/components/ui/fieldset";
import { SwitchField, SwitchGroup } from "@/components/ui/switch";
import { Heading, Subheading } from "@/components/ui/heading";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import type { DeploymentAuthSettings } from "@/types/deployment";
import {
  useAuthSettingsStore,
  useInitializeAuthSettings,
} from "@/lib/store/auth-settings-store";
import { useSaveAuthSettings } from "@/lib/api/hooks/use-save-auth-settings";
import { Text } from "@/components/ui/text";

interface DialogProps {
  open: boolean;
  onClose: () => void;
}

function MultiSessionSettingsDialog({ open, onClose }: DialogProps) {
  const { settings, updateMultiSessionSupport } = useAuthSettingsStore();
  const [maxAccountsPerSession, setMaxAccountsPerSession] = useState("0");
  const [maxSessionsPerAccount, setMaxSessionsPerAccount] = useState("0");

  useEffect(() => {
    setMaxAccountsPerSession(
      settings.multi_session_support.max_accounts_per_session.toString(),
    );
    setMaxSessionsPerAccount(
      settings.multi_session_support.max_sessions_per_account.toString(),
    );
  }, [settings]);

  const handleSubmit = () => {
    // check if the values are valid
    if (
      parseInt(maxAccountsPerSession) < 0 ||
      parseInt(maxSessionsPerAccount) < 0
    ) {
      return;
    }

    updateMultiSessionSupport({
      max_accounts_per_session: parseInt(maxAccountsPerSession),
      max_sessions_per_account: parseInt(maxSessionsPerAccount),
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="p-6">
        <DialogHeader>
          <DialogTitle className="mb-2">Customize session token</DialogTitle>
          <DialogDescription className="mb-6">
            Customize the session token to include additional information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-8">
          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Subheading>Maximum accounts per session</Subheading>
              <Text>
                Limit the number of accounts that can be active within a single
                session.
              </Text>
            </div>
            <div className="space-y-4">
              <Field className="flex items-center gap-4">
                <FieldGroup>
                  <Input
                    aria-label="Max accounts"
                    name="maxAccounts"
                    value={maxAccountsPerSession}
                    onChange={(e) => setMaxAccountsPerSession(e.target.value)}
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
                Set the maximum number of active sessions a user can have at the
                same time.
              </Text>
            </div>
            <div className="space-y-4">
              <Field className="flex items-center gap-4">
                <FieldGroup>
                  <Input
                    aria-label="Max user logins"
                    name="maxUserLogins"
                    className="text-right"
                    value={maxSessionsPerAccount}
                    onChange={(e) => setMaxSessionsPerAccount(e.target.value)}
                  />
                </FieldGroup>
              </Field>
              <Text>Set a value between 1 and 10.</Text>
            </div>
          </section>

          <Divider className="my-8" soft />
        </div>
        <DialogFooter className="flex justify-end gap-4 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmailSettingsDialog({ open, onClose }: DialogProps) {
  const { settings } = useAuthSettingsStore();
  const { updateEmailSettings } = useAuthSettingsStore();

  const handleEmailSettingChange = (settingName: string, value: boolean) => {
    const updateData: { [key: string]: boolean } = {};
    updateData[settingName] = value;
    updateEmailSettings(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email address</DialogTitle>
          <DialogDescription>Configure email address attribute</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SwitchGroup className="space-y-0">
            <SwitchField>
              <Label>Enable</Label>
              <Description>
                Users can add email addresses to their account
              </Description>
              <Switch
                name="email_enabled"
                checked={settings.email_address?.enabled}
                onCheckedChange={(checked) =>
                  handleEmailSettingChange("enabled", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Require</Label>
              <Description>
                Users must provide an email address to sign up, and must maintain
                one on their account at all times
              </Description>
              <Switch
                name="email_required"
                checked={settings.email_address?.required}
                onCheckedChange={(checked) =>
                  handleEmailSettingChange("required", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Verify at sign-up</Label>
              <Description>
                Require users to verify their email addresses before they can sign
                up
              </Description>
              <Switch
                name="email_verify_signup"
                checked={settings.email_address?.verify_signup}
                onCheckedChange={(checked) =>
                  handleEmailSettingChange("verify_signup", checked)
                }
              />
            </SwitchField>
          </SwitchGroup>

          <Divider soft />

          <div>
            <h3 className="text-sm font-medium mb-2">Verification methods</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Select how users can verify an email address
            </p>
            <SwitchGroup>
              <SwitchField>
                <Label>Email verification link</Label>
                <Description>
                  Verify by clicking a link sent to the email address
                </Description>
                <Switch
                  name="email_verify_link"
                  checked={
                    settings.email_address?.magic_link_verification_allowed
                  }
                  onCheckedChange={(checked) =>
                    handleEmailSettingChange(
                      "magic_link_verification_allowed",
                      checked,
                    )
                  }
                />
              </SwitchField>
              <SwitchField>
                <Label>Email verification code</Label>
                <Description>
                  Verify by entering a one-time passcode sent to the email address
                </Description>
                <Switch
                  name="email_verify_code"
                  checked={settings.email_address?.otp_verification_allowed}
                  onCheckedChange={(checked) =>
                    handleEmailSettingChange("otp_verification_allowed", checked)
                  }
                />
              </SwitchField>
            </SwitchGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhoneSettingsDialog({ open, onClose }: DialogProps) {
  const { settings, updatePhoneSettings } = useAuthSettingsStore();

  const handlePhoneSettingChange = (settingName: string, value: boolean) => {
    const updateData: { [key: string]: boolean } = {};
    updateData[settingName] = value;
    updatePhoneSettings(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phone number</DialogTitle>
          <DialogDescription>Configure phone number attribute</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <SwitchGroup>
            <SwitchField>
              <Label>Enable</Label>
              <Description>
                Users can add phone numbers to their account
              </Description>
              <Switch
                name="phone_enabled"
                checked={settings.phone_number?.enabled}
                onCheckedChange={(checked) =>
                  handlePhoneSettingChange("enabled", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Require</Label>
              <Description>
                Users must provide a phone number to sign up, and must maintain
                one on their account at all times
              </Description>
              <Switch
                name="phone_required"
                checked={settings.phone_number?.required}
                onCheckedChange={(checked) =>
                  handlePhoneSettingChange("required", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Verify at sign-up</Label>
              <Description>
                Require users to verify their phone numbers before they can sign
                up
              </Description>
              <Switch
                name="phone_verify_signup"
                checked={settings.phone_number?.verify_signup}
                onCheckedChange={(checked) =>
                  handlePhoneSettingChange("verify_signup", checked)
                }
              />
            </SwitchField>
          </SwitchGroup>

          <Divider soft />

          <div>
            <h3 className="text-sm font-medium mb-2">Verification methods</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select how users can verify a phone number
            </p>
            <SwitchGroup>
              <SwitchField>
                <Label>SMS verification code</Label>
                <Description>
                  Verify by entering a one-time verification code sent via SMS to
                  the phone number
                </Description>
                <Switch
                  name="phone_sms_verification"
                  checked={settings.phone_number?.sms_verification_allowed}
                  onCheckedChange={(checked) =>
                    handlePhoneSettingChange("sms_verification_allowed", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>WhatsApp verification code</Label>
                <Description>
                  Verify by entering a one-time verification code sent via
                  WhatsApp to the phone number
                </Description>
                <Switch
                  name="phone_whatsapp_verification"
                  checked={settings.phone_number?.whatsapp_verification_allowed}
                  onCheckedChange={(checked) =>
                    handlePhoneSettingChange(
                      "whatsapp_verification_allowed",
                      checked,
                    )
                  }
                />
              </SwitchField>
            </SwitchGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsernameSettingsDialog({ open, onClose }: DialogProps) {
  const { settings, updateUsernameSettings } = useAuthSettingsStore();

  const handleUsernameSettingChange = (settingName: string, value: boolean) => {
    const updateData: { [key: string]: boolean } = {};
    updateData[settingName] = value;
    updateUsernameSettings(updateData);
  };

  const handleUsernameMinLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 64) {
      updateUsernameSettings({ min_length: value });
    } else if (e.target.value === "") {
      updateUsernameSettings({ min_length: undefined });
    }
  };

  const handleUsernameMaxLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 64) {
      updateUsernameSettings({ max_length: value });
    } else if (e.target.value === "") {
      updateUsernameSettings({ max_length: undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Username</DialogTitle>
          <DialogDescription>Configure username attribute</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <SwitchField>
            <Label>Require</Label>
            <Description>Users must provide a username to sign up</Description>
            <Switch
              name="username_required"
              checked={settings.username?.required}
              onCheckedChange={(checked) =>
                handleUsernameSettingChange("required", checked)
              }
            />
          </SwitchField>

          <Divider soft />

          <div>
            <h3 className="text-sm font-medium mb-2">Rules</h3>
            <div className="space-y-4">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Enforce minimum username length
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Usernames must contain 1 or more characters. Select a higher
                  value to increase the minimum length, up to 64 characters.
                </p>
                <Input
                  type="number"
                  value={settings.username?.min_length ?? ""}
                  onChange={handleUsernameMinLengthChange}
                  min={1}
                  max={64}
                  className="w-20"
                />{" "}
                characters
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium">
                  Enforce maximum username length
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Usernames must contain up to 64 characters. Select a lower value
                  to decrease the maximum length, but it must be at least 1
                  characters.
                </p>
                <Input
                  type="number"
                  value={settings.username?.max_length ?? ""}
                  onChange={handleUsernameMaxLengthChange}
                  min={1}
                  max={64}
                  className="w-20"
                />{" "}
                characters
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordSettingsDialog({ open, onClose }: DialogProps) {
  const { settings, updatePasswordSettings } = useAuthSettingsStore();

  const handlePasswordSettingChange = (settingName: string, value: boolean) => {
    const updateData: { [key: string]: boolean | number } = {};
    updateData[settingName] = value;
    updatePasswordSettings(updateData);
  };

  const handlePasswordMinLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 6 && value <= 128) {
      updatePasswordSettings({ min_length: value });
    } else if (e.target.value === "") {
      updatePasswordSettings({ min_length: undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password policies</DialogTitle>
          <DialogDescription>
            Configure strength and complexity requirements for user passwords
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <SwitchField>
            <Label>Enable</Label>
            <Description>Users can sign in with a password</Description>
            <Switch
              name="password_enabled"
              checked={settings.password?.enabled}
              onCheckedChange={(checked) =>
                handlePasswordSettingChange("enabled", checked)
              }
            />
          </SwitchField>

          <Divider soft />

          <div className="flex-1 mb-4">
            <p className="text-sm font-medium">Minimum password length</p>
            <p className="text-sm text-muted-foreground mb-2">
              Set the minimum required length for passwords
            </p>
            <Input
              type="number"
              value={settings.password?.min_length ?? ""}
              onChange={handlePasswordMinLengthChange}
              min={6}
              max={128}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Rules</h3>
            <SwitchGroup>
              <SwitchField>
                <Label>Require at least 1 lowercase character</Label>
                <Switch
                  name="password_lowercase"
                  checked={settings.password?.require_lowercase || false}
                  onCheckedChange={(checked) =>
                    handlePasswordSettingChange("require_lowercase", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Require at least 1 uppercase character</Label>
                <Switch
                  name="password_uppercase"
                  checked={settings.password?.require_uppercase || false}
                  onCheckedChange={(checked) =>
                    handlePasswordSettingChange("require_uppercase", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Require at least 1 number</Label>
                <Switch
                  name="password_number"
                  checked={settings.password?.require_number || false}
                  onCheckedChange={(checked) =>
                    handlePasswordSettingChange("require_number", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Require at least 1 special character</Label>
                <Switch
                  name="password_special"
                  checked={settings.password?.require_special || false}
                  onCheckedChange={(checked) =>
                    handlePasswordSettingChange("require_special", checked)
                  }
                />
              </SwitchField>
            </SwitchGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FirstNameSettings({ open, onClose }: DialogProps) {
  const { settings, updateFirstNameSettings } = useAuthSettingsStore();

  const handleFirstNameSettingChange = (
    settingName: string,
    value: boolean,
  ) => {
    const updateData: { [key: string]: boolean } = {};
    updateData[settingName] = value;
    updateFirstNameSettings(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>First name</DialogTitle>
          <DialogDescription>Configure first name attribute</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <SwitchGroup>
            <SwitchField>
              <Label>Enable</Label>
              <Description>
                Users can add first names to their account
              </Description>
              <Switch
                name="first_name_enabled"
                checked={settings.first_name?.enabled}
                onCheckedChange={(checked) =>
                  handleFirstNameSettingChange("enabled", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Require</Label>
              <Description>
                Users must provide a first name to sign up
              </Description>
              <Switch
                name="first_name_required"
                checked={settings.first_name?.required}
                onCheckedChange={(checked) =>
                  handleFirstNameSettingChange("required", checked)
                }
              />
            </SwitchField>
          </SwitchGroup>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LastNameSettings({ open, onClose }: DialogProps) {
  const { settings, updateLastNameSettings } = useAuthSettingsStore();

  const handleLastNameSettingChange = (settingName: string, value: boolean) => {
    const updateData: { [key: string]: boolean } = {};
    updateData[settingName] = value;
    updateLastNameSettings(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Last name</DialogTitle>
          <DialogDescription>Configure last name attribute</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <SwitchGroup>
            <SwitchField>
              <Label>Enable</Label>
              <Description>Users can add last names to their account</Description>
              <Switch
                name="last_name_enabled"
                checked={settings.last_name?.enabled}
                onCheckedChange={(checked) =>
                  handleLastNameSettingChange("enabled", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Require</Label>
              <Description>Users must provide a last name to sign up</Description>
              <Switch
                name="last_name_required"
                checked={settings.last_name?.required}
                onCheckedChange={(checked) =>
                  handleLastNameSettingChange("required", checked)
                }
              />
            </SwitchField>
          </SwitchGroup>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmailLinkSettingsDialog({ open, onClose }: DialogProps) {
  const { settings } = useAuthSettingsStore();
  const { updateMagicLinkSettings } = useAuthSettingsStore();

  const handleMagicLinkSettingChange = (
    settingName: string,
    value: boolean,
  ) => {
    const updateData: { [key: string]: boolean } = {};
    updateData[settingName] = value;
    updateMagicLinkSettings(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Link Configuration</DialogTitle>
          <DialogDescription>
            Configure email link security settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pb-4">
          <SwitchGroup>
            <SwitchField>
              <Label>Enable</Label>
              <Description>
                Users can sign in with an email verification link
              </Description>
              <Switch
                name="email_link_enabled"
                checked={settings.magic_link?.enabled}
                onCheckedChange={(checked) =>
                  handleMagicLinkSettingChange("enabled", checked)
                }
              />
            </SwitchField>

            <SwitchField>
              <Label>Require same device and browser</Label>
              <Description>
                Enable to ensure email link verification happens from the same
                device and browser on which the sign-in or sign-up was initiated.
              </Description>
              <Switch
                name="email_link_same_device"
                checked={settings.magic_link?.require_same_device}
                onCheckedChange={(checked) =>
                  handleMagicLinkSettingChange("require_same_device", checked)
                }
              />
            </SwitchField>
          </SwitchGroup>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasskeySettingsDialog({ open, onClose }: DialogProps) {
  const { settings } = useAuthSettingsStore();
  const { updatePasskeySettings } = useAuthSettingsStore();

  const handlePasskeyEnabledChange = (checked: boolean) => {
    updatePasskeySettings({ enabled: checked });
  };

  const handlePasskeyPromptRegistrationChange = (checked: boolean) => {
    updatePasskeySettings({ prompt_registration_on_auth: checked });
  };

  const handlePasskeyAutofillChange = (checked: boolean) => {
    updatePasskeySettings({ allow_autofill: checked });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passkey Configuration</DialogTitle>
          <DialogDescription>
            Configure passkey authentication settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <SwitchGroup>
            <SwitchField>
              <Label>Enable</Label>
              <Description>Enable passkey authentication</Description>
              <Switch
                name="passkey_enabled"
                checked={settings.passkey?.enabled}
                onCheckedChange={handlePasskeyEnabledChange}
              />
            </SwitchField>

            <SwitchField>
              <Label>Prompt registration after login</Label>
              <Description>
                Prompt users to register a passkey after they sign in with another method.
              </Description>
              <Switch
                name="passkey_prompt_registration"
                checked={settings.passkey?.prompt_registration_on_auth}
                onCheckedChange={handlePasskeyPromptRegistrationChange}
              />
            </SwitchField>

            <SwitchField>
              <Label>Allow autofill</Label>
              <Description>
                Enable to allow users to autofill passkey credentials in the
                browser.
              </Description>
              <Switch
                name="passkey_autofill"
                checked={settings.passkey?.allow_autofill}
                onCheckedChange={handlePasskeyAutofillChange}
              />
            </SwitchField>
          </SwitchGroup>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FirstFactorDialog({ open, onClose }: DialogProps) {
  const { settings } = useAuthSettingsStore();
  const { updateFirstFactor } = useAuthSettingsStore();

  const handleFirstFactorChange = (
    factor: DeploymentAuthSettings["first_factor"],
  ) => {
    updateFirstFactor(factor);
  };

  // Build list of available options based on what's enabled
  const availableOptions = [];

  // Check if email_password is enabled (toggle is on)
  if (settings.auth_factors_enabled?.email_password) {
    availableOptions.push({
      value: "email_password",
      label: "Email + Password",
      description: "Users sign in with email and password",
    });
  }

  // Check if username_password is enabled (toggle is on)
  if (settings.auth_factors_enabled?.username_password) {
    availableOptions.push({
      value: "username_password",
      label: "Username + Password",
      description: "Users sign in with username and password",
    });
  }

  // Check if email_otp is enabled (toggle is on)
  if (settings.auth_factors_enabled?.email_otp) {
    availableOptions.push({
      value: "email_otp",
      label: "Email OTP",
      description: "Users sign in with email and receive a one-time password",
    });
  }

  // Check if email_magic_link is enabled (toggle is on)
  if (settings.auth_factors_enabled?.email_magic_link) {
    availableOptions.push({
      value: "email_magic_link",
      label: "Email Magic Link",
      description: "Users sign in by clicking a link sent to their email",
    });
  }

  // Check if phone_otp is enabled (toggle is on)
  if (settings.auth_factors_enabled?.phone_otp) {
    availableOptions.push({
      value: "phone_otp",
      label: "Phone OTP",
      description: "Users sign in with phone number and receive an SMS code",
    });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Default Sign-in Method</DialogTitle>
          <DialogDescription>
            Select which authentication method users will see by default. Only
            enabled methods are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {availableOptions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No authentication methods are currently enabled. Please enable at
                least one method first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableOptions.map((option) => (
                <div key={option.value} className="relative">
                  <div
                    className="flex items-start space-x-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                    onClick={() =>
                      handleFirstFactorChange(
                        option.value as DeploymentAuthSettings["first_factor"],
                      )
                    }
                  >
                    <input
                      type="radio"
                      id={option.value}
                      name="first_factor"
                      checked={settings.first_factor === option.value}
                      onChange={() =>
                        handleFirstFactorChange(
                          option.value as DeploymentAuthSettings["first_factor"],
                        )
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
                      >
                        {option.label}
                      </label>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} disabled={availableOptions.length === 0}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SecondFactorPolicyDialog({ open, onClose }: DialogProps) {
  const { settings } = useAuthSettingsStore();
  const { updateSecondFactorPolicy } = useAuthSettingsStore();

  const handlePolicyChange = (
    policy: DeploymentAuthSettings["second_factor_policy"],
  ) => {
    updateSecondFactorPolicy(policy);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enforce Second Factor on Account</DialogTitle>
          <DialogDescription>
            Configure whether second factors are optional or enforced
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Policy
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="none"
                  name="second_factor_policy"
                  checked={settings.second_factor_policy === "none"}
                  onChange={() => handlePolicyChange("none")}
                />
                <label
                  htmlFor="none"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  None
                </label>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-6 mb-2">
                Don't allow second factors
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="optional"
                  name="second_factor_policy"
                  checked={settings.second_factor_policy === "optional"}
                  onChange={() => handlePolicyChange("optional")}
                />
                <label
                  htmlFor="optional"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Optional
                </label>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-6 mb-2">
                Allow users to optionally set up second factors
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="enforced"
                  name="second_factor_policy"
                  checked={settings.second_factor_policy === "enforced"}
                  onChange={() => handlePolicyChange("enforced")}
                />
                <label
                  htmlFor="enforced"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Enforced
                </label>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-6">
                Require users to set up second factors
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SchemaFactorsPage() {
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
  const [phoneSettingsOpen, setPhoneSettingsOpen] = useState(false);
  const [usernameSettingsOpen, setUsernameSettingsOpen] = useState(false);
  const [passwordSettingsOpen, setPasswordSettingsOpen] = useState(false);
  const [firstNameSettingsOpen, setFirstNameSettingsOpen] = useState(false);
  const [lastNameSettingsOpen, setLastNameSettingsOpen] = useState(false);
  const [emailLinkSettingsOpen, setEmailLinkSettingsOpen] = useState(false);
  const [passkeySettingsOpen, setPasskeySettingsOpen] = useState(false);
  const [firstFactorOpen, setFirstFactorOpen] = useState(false);
  const [secondFactorPolicyOpen, setSecondFactorPolicyOpen] = useState(false);
  const [multiSessionSettingsOpen, setMultiSessionSettingsOpen] =
    useState(false);

  const { isLoading } = useInitializeAuthSettings();
  const { settings, isDirty: isFormDirty } = useAuthSettingsStore();
  const { isSaving, saveSettings, resetSettings } = useSaveAuthSettings();

  // Use isDirty directly from the store for reactive updates
  const isDirty = isFormDirty;

  const {
    updateEmailSettings,
    updatePasswordSettings,
    updatePhoneSettings,
    updateUsernameSettings,
    updateFirstNameSettings,
    updateLastNameSettings,
    updateAuthFactorsEnabled,
    updatePasskeySettings,
    updateMagicLinkSettings,
    updateMultiSessionSupport,
  } = useAuthSettingsStore();

  const handleToggle = (settingType: string, value: boolean) => {
    switch (settingType) {
      case "email_enabled":
        updateEmailSettings({ enabled: value });
        break;
      case "password_enabled":
        updatePasswordSettings({ enabled: value });
        break;
      case "phone_enabled":
        updatePhoneSettings({ enabled: value });
        break;
      case "username_enabled":
        updateUsernameSettings({ enabled: value });
        break;
      case "first_name_enabled":
        updateFirstNameSettings({ enabled: value });
        break;
      case "last_name_enabled":
        updateLastNameSettings({ enabled: value });
        break;
      case "email_password_enabled":
        updateAuthFactorsEnabled({ email_password: value });
        break;
      case "username_password_enabled":
        updateAuthFactorsEnabled({ username_password: value });
        break;
      case "email_link_enabled":
        updateAuthFactorsEnabled({ email_magic_link: value });
        // Also update magic_link settings to ensure they're in sync
        updateMagicLinkSettings({ enabled: value });
        break;
      case "email_otp_enabled":
        updateAuthFactorsEnabled({ email_otp: value });
        break;
      case "phone_otp_enabled":
        updateAuthFactorsEnabled({ phone_otp: value });
        break;
      case "passkey_enabled":
        updatePasskeySettings({ enabled: value });
        // Also update auth_factors_enabled to ensure they're in sync
        updateAuthFactorsEnabled({ passkey: value });
        break;
      case "sso_enabled":
        updateAuthFactorsEnabled({ sso: value });
        break;
      case "web3_wallet_enabled":
        updateAuthFactorsEnabled({ web3_wallet: value });
        break;
      case "second_factor_authenticator_enabled":
        updateAuthFactorsEnabled({ authenticator: value });
        break;
      case "second_factor_phone_otp_enabled":
        updateAuthFactorsEnabled({ phone_otp: value });
        break;
      case "second_factor_backup_code_enabled":
        updateAuthFactorsEnabled({ backup_code: value });
        break;
      case "multi_session_support_enabled":
        updateMultiSessionSupport({ enabled: value });
        break;
      default:
        console.warn(`Unhandled setting type: ${settingType}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const success = await saveSettings();
      if (!success) {
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleResetSettings = () => {
    resetSettings();
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  return (
    <>
      <EmailSettingsDialog
        open={emailSettingsOpen}
        onClose={() => setEmailSettingsOpen(false)}
      />
      <PhoneSettingsDialog
        open={phoneSettingsOpen}
        onClose={() => setPhoneSettingsOpen(false)}
      />
      <UsernameSettingsDialog
        open={usernameSettingsOpen}
        onClose={() => setUsernameSettingsOpen(false)}
      />
      <PasswordSettingsDialog
        open={passwordSettingsOpen}
        onClose={() => setPasswordSettingsOpen(false)}
      />
      <FirstNameSettings
        open={firstNameSettingsOpen}
        onClose={() => setFirstNameSettingsOpen(false)}
      />
      <LastNameSettings
        open={lastNameSettingsOpen}
        onClose={() => setLastNameSettingsOpen(false)}
      />
      <EmailLinkSettingsDialog
        open={emailLinkSettingsOpen}
        onClose={() => setEmailLinkSettingsOpen(false)}
      />
      <PasskeySettingsDialog
        open={passkeySettingsOpen}
        onClose={() => setPasskeySettingsOpen(false)}
      />
      <FirstFactorDialog
        open={firstFactorOpen}
        onClose={() => setFirstFactorOpen(false)}
      />
      <SecondFactorPolicyDialog
        open={secondFactorPolicyOpen}
        onClose={() => setSecondFactorPolicyOpen(false)}
      />
      <MultiSessionSettingsDialog
        open={multiSessionSettingsOpen}
        onClose={() => setMultiSessionSettingsOpen(false)}
      />

      <div>
        <div className="mb-6">
          <Heading>Authentication Configuration</Heading>
        </div>

        <div className="space-y-16">
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-medium">User Schema</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Configure the required fields and verification policies for your
                users
              </p>
            </div>

            <Divider soft />

            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">Email address</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can add email addresses to their account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setEmailSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="email_enabled"
                    checked={settings.email_address?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("email_enabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="gap-x-8 gap-y-1 flex flex-col">
                  <h3 className="text-sm font-medium">Password</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can set a password for their account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setPasswordSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="password_enabled"
                    checked={settings.password?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("password_enabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="gap-x-8 gap-y-1 flex flex-col">
                  <h3 className="text-sm font-medium">Phone number</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can add phone numbers to their account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setPhoneSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="phone_enabled"
                    checked={settings.phone_number?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("phone_enabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="gap-x-8 gap-y-1 flex flex-col">
                  <h3 className="text-sm font-medium">Username</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can set a unique username for their account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setUsernameSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="username_enabled"
                    checked={settings.username?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("username_enabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="gap-x-8 gap-y-1 flex flex-col">
                  <h3 className="text-sm font-medium">First name</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can set their first name
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setFirstNameSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="first_name_enabled"
                    checked={settings.first_name?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("first_name_enabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="gap-x-8 gap-y-1 flex flex-col">
                  <h3 className="text-sm font-medium">Last name</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can set their last name
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setLastNameSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="last_name_enabled"
                    checked={settings.last_name?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("last_name_enabled", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="gap-x-8 gap-y-1 flex flex-col">
              <h2 className="text-base font-medium">
                First Factor Authentication
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Select the authentication methods to present when a user signs
                in
              </p>
            </div>

            <Divider soft />

            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Default Sign-in Method
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Choose which method is shown by default
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {settings.first_factor
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                      "Email Password"}
                  </span>
                  <Button variant="ghost" onClick={() => setFirstFactorOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                </div>
              </div>

              <SwitchField>
                <Label>Email Password</Label>
                <Description>
                  Users can sign in with an email password
                </Description>
                <Switch
                  name="email_password_enabled"
                  checked={settings.auth_factors_enabled?.email_password}
                  onCheckedChange={(checked) =>
                    handleToggle("email_password_enabled", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Username Password</Label>
                <Description>
                  Users can sign in with a username password
                </Description>
                <Switch
                  name="username_password_enabled"
                  checked={settings.auth_factors_enabled?.username_password}
                  onCheckedChange={(checked) =>
                    handleToggle("username_password_enabled", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>SSO Authentication</Label>
                <Description>Users can sign in external accounts</Description>
                <Switch
                  name="sso_enabled"
                  checked={settings.auth_factors_enabled?.sso}
                  onCheckedChange={(checked) => handleToggle("sso_enabled", checked)}
                />
              </SwitchField>

              {/*<SwitchField>
                <Label>Web3 Wallet</Label>
                <Description>Users can sign in with a Web3 wallet</Description>
                <Switch
                  name="web3_wallet_enabled"
                  checked={settings.auth_factors_enabled?.web3_wallet}
                  onCheckedChange={(checked) =>
                    handleToggle("web3_wallet_enabled", checked)
                  }
                />
              </SwitchField>*/}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">Email magic link</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Users can sign in with an email verification link
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setEmailLinkSettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="email_link_enabled"
                    checked={settings.auth_factors_enabled?.email_magic_link}
                    onCheckedChange={(checked) =>
                      handleToggle("email_link_enabled", checked)
                    }
                  />
                </div>
              </div>

              <SwitchField>
                <Label>Email OTP</Label>
                <Description>
                  Users can sign in with an email one-time password
                </Description>
                <Switch
                  name="email_otp_enabled"
                  checked={settings.auth_factors_enabled?.email_otp}
                  onCheckedChange={(checked) =>
                    handleToggle("email_otp_enabled", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Phone OTP</Label>
                <Description>
                  Users can sign in with a phone one-time password
                </Description>
                <Switch
                  name="phone_otp_enabled"
                  checked={settings.auth_factors_enabled?.phone_otp}
                  onCheckedChange={(checked) =>
                    handleToggle("phone_otp_enabled", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Passkeys</Label>
                <Description>
                  Users can sign in with a passkey
                </Description>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setPasskeySettingsOpen(true)}>
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name="passkey_enabled"
                    checked={settings.passkey?.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle("passkey_enabled", checked)
                    }
                  />
                </div>
              </SwitchField>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-medium">
                  Second Factor Authentication
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Allow users to select a second factor authentication method
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSecondFactorPolicyOpen(true)}>
                <Cog6ToothIcon />
              </Button>
            </div>

            <Divider soft />

            <div className="space-y-6">
              <SwitchField>
                <Label>Authenticator app</Label>
                <Description>
                  Users can verify with an authenticator app
                </Description>
                <Switch
                  name="2fa_authenticator_enabled"
                  checked={
                    settings.auth_factors_enabled?.authenticator || false
                  }
                  onCheckedChange={(checked) =>
                    handleToggle("second_factor_authenticator_enabled", checked)
                  }
                />
              </SwitchField>

              <SwitchField>
                <Label>Backup code</Label>
                <Description>Users can verify with a backup code</Description>
                <Switch
                  name="2fa_backup_code_enabled"
                  checked={settings.auth_factors_enabled?.backup_code || false}
                  onCheckedChange={(checked) =>
                    handleToggle("second_factor_backup_code_enabled", checked)
                  }
                />
              </SwitchField>
            </div>
          </div>
        </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              You have unsaved changes.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleResetSettings} disabled={isSaving}>
                Discard
              </Button>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

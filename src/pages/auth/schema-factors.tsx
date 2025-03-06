import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Description, Label } from "@/components/ui/fieldset";
import { SwitchField, SwitchGroup } from "@/components/ui/switch";
import { Heading } from "@/components/ui/heading";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useDeploymentSettings } from "@/lib/api/hooks/use-deployment-settings";

interface DialogProps {
  open: boolean;
  onClose: () => void;
}

function EmailSettingsDialog({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  console.log(deploymentSettings);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Email address</DialogTitle>
      <DialogDescription>Configure email address attribute</DialogDescription>
      <DialogBody className="space-y-4">
        <SwitchGroup className="space-y-0">
          {/* <SwitchField>
            <Label>Enable</Label>
            <Description>
              Users can add email addresses to their account
            </Description>
            <Switch name="email_enabled" defaultChecked={deploymentSettings?.auth_settings?.email_address?.enabled} />
          </SwitchField> */}

          <SwitchField>
            <Label>Require</Label>
            <Description>
              Users must provide an email address to sign up, and must maintain
              one on their account at all times
            </Description>
            <Switch name="email_required" defaultChecked={deploymentSettings?.auth_settings?.email_address?.required} />
          </SwitchField>

          <SwitchField>
            <Label>Verify at sign-up</Label>
            <Description>
              Require users to verify their email addresses before they can sign
              up
            </Description>
            <Switch name="email_verify_signup" defaultChecked={deploymentSettings?.auth_settings?.email_address?.verify_signup} />
          </SwitchField>
        </SwitchGroup>

        <Divider soft />

        <div>
          <h3 className="text-sm font-medium mb-2">Verification methods</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            Select how users can verify an email address
          </p>
          <SwitchGroup>
            <SwitchField>
              <Label>Email verification link</Label>
              <Description>
                Verify by clicking a link sent to the email address
              </Description>
              <Switch name="email_verify_link" defaultChecked={deploymentSettings?.auth_settings?.email_address?.magic_link_verification_allowed} />
            </SwitchField>
            <SwitchField>
              <Label>Email verification code</Label>
              <Description>
                Verify by entering a one-time passcode sent to the email address
              </Description>
              <Switch name="email_verify_code" defaultChecked={deploymentSettings?.auth_settings?.email_address?.otp_verification_allowed} />
            </SwitchField>
          </SwitchGroup>
        </div>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function PhoneSettingsDialog({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Phone number</DialogTitle>
      <DialogDescription>Configure phone number attribute</DialogDescription>
      <DialogBody className="space-y-3">
        <SwitchGroup>
          {/* <SwitchField>
            <Label>Enable</Label>
            <Description>
              Users can add phone numbers to their account
            </Description>
            <Switch name="phone_enabled" defaultChecked={deploymentSettings?.auth_settings?.phone_number.enabled} />
          </SwitchField> */}

          <SwitchField>
            <Label>Require</Label>
            <Description>
              Users must provide a phone number to sign up, and must maintain
              one on their account at all times
            </Description>
            <Switch name="phone_required" defaultChecked={deploymentSettings?.auth_settings?.phone_number.required} />
          </SwitchField>

          <SwitchField>
            <Label>Verify at sign-up</Label>
            <Description>
              Require users to verify their phone numbers before they can sign
              up
            </Description>
            <Switch name="phone_verify_signup" defaultChecked={deploymentSettings?.auth_settings?.phone_number.verify_signup} />
          </SwitchField>
        </SwitchGroup>

        <Divider soft />

        <div>
          <h3 className="text-sm font-medium mb-2">Verification methods</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            Select how users can verify a phone number
          </p>
          <SwitchGroup>
            <SwitchField>
              <Label>SMS verification code</Label>
              <Description>
                Verify by entering a one-time verification code sent via SMS to
                the phone number
              </Description>
              <Switch name="phone_sms_verification" defaultChecked={deploymentSettings?.auth_settings?.phone_number.otp_verification_allowed} />
            </SwitchField>

            <SwitchField>
              <Label>WhatsApp verification code</Label>
              <Description>
                Verify by entering a one-time verification code sent via
                WhatsApp to the phone number
              </Description>
              <Switch name="phone_whatsapp_verification" defaultChecked={deploymentSettings?.auth_settings?.phone_number.whatsapp_verification_allowed} />
            </SwitchField>
          </SwitchGroup>
        </div>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function UsernameSettingsDialog({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Username</DialogTitle>
      <DialogDescription>Configure username attribute</DialogDescription>
      <DialogBody className="space-y-3">
        <SwitchField>
          <Label>Require</Label>
          <Description>Users must provide a username to sign up</Description>
          <Switch name="username_required" defaultChecked={deploymentSettings?.auth_settings?.username?.required} />
        </SwitchField>

        <Divider soft />

        <div>
          <h3 className="text-sm font-medium mb-2">Rules</h3>
          <div className="space-y-4">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Enforce minimum username length
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Usernames must contain 1 or more characters. Select a higher
                value to increase the minimum length, up to 64 characters.
              </p>
              <Input
                type="number"
                defaultValue={4}
                min={1}
                max={64}
                className="w-20"
                value={deploymentSettings?.auth_settings?.username?.min_length}
              />{" "}
              characters
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium">
                Enforce maximum username length
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Usernames must contain up to 64 characters. Select a lower value
                to decrease the maximum length, but it must be at least 1
                characters.
              </p>
              <Input
                type="number"
                defaultValue={64}
                min={1}
                max={64}
                className="w-20"
                value={deploymentSettings?.auth_settings?.username?.max_length}
              />{" "}
              characters
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function PasswordSettingsDialog({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Password policies</DialogTitle>
      <DialogDescription>
        Configure strength and complexity requirements for user passwords
      </DialogDescription>
      <DialogBody className="space-y-3">
        <div>
          <h3 className="text-sm font-medium mb-2">Rules</h3>
          <SwitchGroup>
            <SwitchField>
              <Label>Require at least 1 lowercase character</Label>
              <Switch name="password_lowercase" defaultChecked={deploymentSettings?.auth_settings?.password.require_lowercase} />
            </SwitchField>

            <SwitchField>
              <Label>Require at least 1 uppercase character</Label>
              <Switch name="password_uppercase" defaultChecked={deploymentSettings?.auth_settings?.password.require_uppercase} />
            </SwitchField>

            <SwitchField>
              <Label>Require at least 1 number</Label>
              <Switch name="password_number" defaultChecked={deploymentSettings?.auth_settings?.password?.require_number} />
            </SwitchField>

            <SwitchField>
              <Label>Require at least 1 special character</Label>
              <Switch name="password_special" defaultChecked={deploymentSettings?.auth_settings?.password.require_special} />
            </SwitchField>

            <SwitchField>
              <Label>Require at least 8 characters</Label>
              <Switch name="password_min_length" defaultChecked={deploymentSettings?.auth_settings?.password.min_length} />
            </SwitchField>

          </SwitchGroup>


        </div>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function FirstNameSettings({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>First name</DialogTitle>
      <DialogDescription>Configure first name attribute</DialogDescription>
      <DialogBody className="space-y-3">
        <SwitchGroup>
          <SwitchField>
            <Label>Enable</Label>
            <Description>
              Users can add first names to their account
            </Description>
            <Switch
              name="first_name_enabled"
              defaultChecked={deploymentSettings?.auth_settings?.first_name.enabled}
            />
          </SwitchField>

          <SwitchField>
            <Label>Require</Label>
            <Description>
              Users must provide a first name to sign up
            </Description>
            <Switch
              name="first_name_required"
              defaultChecked={deploymentSettings?.auth_settings?.first_name.required}
            />
          </SwitchField>
        </SwitchGroup>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function LastNameSettings({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Last name</DialogTitle>
      <DialogDescription>Configure last name attribute</DialogDescription>
      <DialogBody className="space-y-3">
        <SwitchGroup>
          <SwitchField>
            <Label>Enable</Label>
            <Description>Users can add last names to their account</Description>
            <Switch name="last_name_enabled" defaultChecked={deploymentSettings?.auth_settings?.last_name.enabled} />
          </SwitchField>

          <SwitchField>
            <Label>Require</Label>
            <Description>Users must provide a last name to sign up</Description>
            <Switch name="last_name_required" defaultChecked={deploymentSettings?.auth_settings?.last_name.required} />
          </SwitchField>
        </SwitchGroup>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function EmailLinkSettingsDialog({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Email Link Configuration</DialogTitle>
      <DialogDescription>
        Configure email link security settings.
      </DialogDescription>
      <DialogBody className="space-y-3">
        <SwitchGroup>
          <SwitchField>
            <Label>Enable</Label>
            <Description>
              Users can sign in with an email verification link
            </Description>
            <Switch name="email_link_enabled" defaultChecked={deploymentSettings?.auth_settings?.auth_factors_enabled.email_magic_link} />
          </SwitchField>

          <SwitchField>
            <Label>Require same device and browser</Label>
            <Description>
              Enable to ensure email link verification happens from the same
              device and browser on which the sign-in or sign-up was initiated.
            </Description>
            <Switch name="email_link_same_device" defaultChecked={deploymentSettings?.auth_settings?.auth_factors_enabled?.email_magic_link} />
          </SwitchField>
        </SwitchGroup>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
    </Dialog>
  );
}

function PasskeySettingsDialog({ open, onClose }: DialogProps) {
  const { deploymentSettings } = useDeploymentSettings();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Passkey Configuration</DialogTitle>
      <DialogDescription>
        Choose experience of your end users.
      </DialogDescription>
      <DialogBody className="space-y-3">
        <SwitchGroup>
          <SwitchField>
            <Label>Enable</Label>
            <Description>Enable passkey authentication</Description>
            <Switch
              name="passkey_enabled"
              defaultChecked={deploymentSettings?.auth_settings?.auth_factors_enabled?.passkey}
            />
          </SwitchField>

          <SwitchField>
            <Label>Allow autofill</Label>
            <Description>
              Enable to allow users to autofill passkey credentials in the
              browser.
            </Description>
            <Switch name="passkey_autofill" /> // Not added yet
          </SwitchField>
        </SwitchGroup>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Continue</Button>
      </DialogActions>
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

  const { deploymentSettings, isLoading } = useDeploymentSettings();

  return (
    isLoading ? (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-500" />
        </div>
      </div>
    ) : (
      <div>
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

        <div>
          <Heading className="mb-8">Schema and Factors</Heading>

          <div className="space-y-28">
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
                    <Button plain onClick={() => setEmailSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="email_address_enabled" defaultChecked={deploymentSettings?.auth_settings?.email_address?.enabled} />
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Password</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can sign in with a password
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setPasswordSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="password_enabled" defaultChecked={deploymentSettings?.auth_settings?.password.enabled} />
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Phone number</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can add phone numbers to their account
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setPhoneSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="phone_enabled" defaultChecked={deploymentSettings?.auth_settings?.phone_number.enabled} />
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Username</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can set a unique username for their account
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setUsernameSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="username_enabled" />
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">First name</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can add first names to their account
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setFirstNameSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch
                      name="first_name_enable"
                      defaultChecked={deploymentSettings?.auth_settings?.first_name.enabled}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Last name</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can set their last name
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setLastNameSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="last_name_enabled" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
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
                <SwitchField>
                  <Label>SSO</Label>
                  <Description>
                    Users can sign in with SSO/Social Providers
                  </Description>
                  <Switch name="sso_enabled" />
                </SwitchField>

                <SwitchField>
                  <Label>Web3 Wallet</Label>
                  <Description>Users can sign in with a Web3 wallet</Description>
                  <Switch name="web3_wallet_enabled" />
                </SwitchField>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Email magic link</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can sign in with an email verification link
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setEmailLinkSettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="email_link_enabled" />
                  </div>
                </div>

                <SwitchField>
                  <Label>Email OTP</Label>
                  <Description>
                    Users can sign in with an email one-time password
                  </Description>
                  <Switch name="email_otp_enabled" />
                </SwitchField>

                <SwitchField>
                  <Label>Phone OTP</Label>
                  <Description>
                    Users can sign in with a phone one-time password
                  </Description>
                  <Switch name="phone_otp_enabled" />
                </SwitchField>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Passkeys</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Users can sign in with a passkey
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => setPasskeySettingsOpen(true)}>
                      <Cog6ToothIcon />
                    </Button>
                    <Switch name="passkey_enabled" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-base font-medium">
                  Second Factor Authentication
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Allow users to select a second factor authentication method
                </p>
              </div>

              <Divider soft />

              <div className="space-y-6">
                <SwitchGroup>
                  <SwitchField>
                    <Label>Phone OTP</Label>
                    <Description>
                      Users can verify their phone number with a one-time password
                    </Description>
                    <Switch name="2fa_phone_otp_enabled" />
                  </SwitchField>

                  <SwitchField>
                    <Label>Authenticator app</Label>
                    <Description>
                      Users can verify with an authenticator app
                    </Description>
                    <Switch name="2fa_authenticator_enabled" />
                  </SwitchField>

                  <SwitchField>
                    <Label>Backup code</Label>
                    <Description>Users can verify with a backup code</Description>
                    <Switch name="2fa_backup_code_enabled" />
                  </SwitchField>
                </SwitchGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

  );
}

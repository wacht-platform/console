import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
    Description as BaseDescription,
    Field,
    FieldGroup,
    Label,
} from "@/components/ui/fieldset";
import { SwitchField } from "@/components/ui/switch";
import { Heading } from "@/components/ui/heading";
import { Cog6ToothIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import type { DeploymentAuthSettings } from "@/types/deployment";
import {
    useAuthSettingsStore,
    useInitializeAuthSettings,
} from "@/lib/store/auth-settings-store";
import { useSaveAuthSettings } from "@/lib/api/hooks/use-save-auth-settings";

const Description = ({ children }: { children: React.ReactNode }) => (
    <BaseDescription className="text-muted-foreground max-w-[90%]">
        {children}
    </BaseDescription>
);

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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Customize session token</DialogTitle>
                    <DialogDescription>
                        Customize the session token to include additional
                        information.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <Label>Maximum accounts per session</Label>
                            <Description>
                                Limit the number of accounts that can be active
                                within a single session. Set a value between 1
                                and 10.
                            </Description>
                            <Input
                                className="w-24"
                                aria-label="Max accounts"
                                name="maxAccounts"
                                value={maxAccountsPerSession}
                                onChange={(e) =>
                                    setMaxAccountsPerSession(e.target.value)
                                }
                            />
                        </Field>
                        <Field>
                            <Label>Maximum user logins</Label>
                            <Description>
                                Set the maximum number of active sessions a user
                                can have at the same time. Set a value between 1
                                and 10.
                            </Description>
                            <Input
                                aria-label="Max user logins"
                                name="maxUserLogins"
                                className="w-24"
                                value={maxSessionsPerAccount}
                                onChange={(e) =>
                                    setMaxSessionsPerAccount(e.target.value)
                                }
                            />
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Email address</DialogTitle>
                    <DialogDescription>
                        Configure email address attribute
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="email_enabled"
                                    checked={settings.email_address?.enabled}
                                    onCheckedChange={(checked) =>
                                        handleEmailSettingChange(
                                            "enabled",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Allow users to add and manage email addresses on
                                their account
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require</Label>
                                <Switch
                                    name="email_required"
                                    checked={settings.email_address?.required}
                                    onCheckedChange={(checked) =>
                                        handleEmailSettingChange(
                                            "required",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Users must provide a valid email address during
                                the sign-up process
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Verify at sign-up</Label>
                                <Switch
                                    name="email_verify_signup"
                                    checked={
                                        settings.email_address?.verify_signup
                                    }
                                    onCheckedChange={(checked) =>
                                        handleEmailSettingChange(
                                            "verify_signup",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Ensure the provided email is valid by requiring
                                verification before sign-up
                            </Description>
                        </Field>
                    </FieldGroup>

                    <FieldGroup className="">
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Email verification link</Label>
                                <Switch
                                    name="email_verify_link"
                                    checked={
                                        settings.email_address
                                            ?.magic_link_verification_allowed
                                    }
                                    onCheckedChange={(checked) =>
                                        handleEmailSettingChange(
                                            "magic_link_verification_allowed",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Send a secure, one-click confirmation link to
                                the user's inbox
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Email verification code</Label>
                                <Switch
                                    name="email_verify_code"
                                    checked={
                                        settings.email_address
                                            ?.otp_verification_allowed
                                    }
                                    onCheckedChange={(checked) =>
                                        handleEmailSettingChange(
                                            "otp_verification_allowed",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Send a 6-digit one-time passcode for manual
                                entry
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Phone number</DialogTitle>
                    <DialogDescription>
                        Configure phone number attribute
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="phone_enabled"
                                    checked={settings.phone_number?.enabled}
                                    onCheckedChange={(checked) =>
                                        handlePhoneSettingChange(
                                            "enabled",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Allow users to add and manage phone numbers on
                                their account
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require</Label>
                                <Switch
                                    name="phone_required"
                                    checked={settings.phone_number?.required}
                                    onCheckedChange={(checked) =>
                                        handlePhoneSettingChange(
                                            "required",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Users must provide a valid phone number during
                                the sign-up process
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Verify at sign-up</Label>
                                <Switch
                                    name="phone_verify_signup"
                                    checked={
                                        settings.phone_number?.verify_signup
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePhoneSettingChange(
                                            "verify_signup",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Ensure the provided phone is valid by requiring
                                verification before sign-up
                            </Description>
                        </Field>
                    </FieldGroup>

                    <FieldGroup className="pt-4">
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>SMS verification code</Label>
                                <Switch
                                    name="phone_sms_verification"
                                    checked={
                                        settings.phone_number
                                            ?.sms_verification_allowed
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePhoneSettingChange(
                                            "sms_verification_allowed",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Send a 6-digit one-time passcode via SMS message
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>WhatsApp verification code</Label>
                                <Switch
                                    name="phone_whatsapp_verification"
                                    checked={
                                        settings.phone_number
                                            ?.whatsapp_verification_allowed
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePhoneSettingChange(
                                            "whatsapp_verification_allowed",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Send a 6-digit one-time passcode via WhatsApp
                                message
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UsernameSettingsDialog({ open, onClose }: DialogProps) {
    const { settings, updateUsernameSettings } = useAuthSettingsStore();

    const handleUsernameSettingChange = (
        settingName: string,
        value: boolean,
    ) => {
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Username</DialogTitle>
                    <DialogDescription>
                        Configure username attribute
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require</Label>
                                <Switch
                                    name="username_required"
                                    checked={settings.username?.required}
                                    onCheckedChange={(checked) =>
                                        handleUsernameSettingChange(
                                            "required",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Users must choose a unique username during sign
                                up
                            </Description>
                        </Field>
                    </FieldGroup>

                    <FieldGroup className="pt-4">
                        <Field>
                            <Label>Minimum username length</Label>
                            <Description>
                                Usernames must contain at least this many
                                characters (1-64)
                            </Description>
                            <Input
                                type="number"
                                value={settings.username?.min_length ?? ""}
                                onChange={handleUsernameMinLengthChange}
                                min={1}
                                max={64}
                            />
                        </Field>
                        <Field>
                            <Label>Maximum username length</Label>
                            <Description>
                                Usernames cannot exceed this length (1-64)
                            </Description>
                            <Input
                                type="number"
                                value={settings.username?.max_length ?? ""}
                                onChange={handleUsernameMaxLengthChange}
                                min={1}
                                max={64}
                                className="w-24"
                            />
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PasswordSettingsDialog({ open, onClose }: DialogProps) {
    const { settings, updatePasswordSettings } = useAuthSettingsStore();

    const handlePasswordSettingChange = (
        settingName: string,
        value: boolean,
    ) => {
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Password policies</DialogTitle>
                    <DialogDescription>
                        Configure password strength and complexity requirements
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="password_enabled"
                                    checked={settings.password?.enabled}
                                    onCheckedChange={(checked) =>
                                        handlePasswordSettingChange(
                                            "enabled",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Allow users to sign in using their email and a
                                personal password
                            </Description>
                        </Field>
                    </FieldGroup>

                    <FieldGroup className="pt-4">
                        <Field>
                            <Label>Minimum password length</Label>
                            <Description>
                                Set the minimum number of characters required
                                for a valid password (6-128)
                            </Description>
                            <Input
                                type="number"
                                value={settings.password?.min_length ?? ""}
                                onChange={handlePasswordMinLengthChange}
                                min={6}
                                max={128}
                                className="w-24"
                            />
                        </Field>
                    </FieldGroup>

                    <FieldGroup className="pt-4">
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require lowercase</Label>
                                <Switch
                                    name="password_lowercase"
                                    checked={
                                        settings.password?.require_lowercase ||
                                        false
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePasswordSettingChange(
                                            "require_lowercase",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Passwords must contain at least one lowercase
                                letter (a-z)
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require uppercase</Label>
                                <Switch
                                    name="password_uppercase"
                                    checked={
                                        settings.password?.require_uppercase ||
                                        false
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePasswordSettingChange(
                                            "require_uppercase",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Passwords must contain at least one uppercase
                                letter (A-Z)
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require number</Label>
                                <Switch
                                    name="password_number"
                                    checked={
                                        settings.password?.require_number ||
                                        false
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePasswordSettingChange(
                                            "require_number",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Passwords must contain at least one numerical
                                digit (0-9)
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require special character</Label>
                                <Switch
                                    name="password_special"
                                    checked={
                                        settings.password?.require_special ||
                                        false
                                    }
                                    onCheckedChange={(checked) =>
                                        handlePasswordSettingChange(
                                            "require_special",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Passwords must contain at least one symbol
                                (!@#$%^&*)
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>First name</DialogTitle>
                    <DialogDescription>
                        Configure first name attribute
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="first_name_enabled"
                                    checked={settings.first_name?.enabled}
                                    onCheckedChange={(checked) =>
                                        handleFirstNameSettingChange(
                                            "enabled",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Collect and store user's first name
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require</Label>
                                <Switch
                                    name="first_name_required"
                                    checked={settings.first_name?.required}
                                    onCheckedChange={(checked) =>
                                        handleFirstNameSettingChange(
                                            "required",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Users must provide a first name to complete sign
                                up
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LastNameSettings({ open, onClose }: DialogProps) {
    const { settings, updateLastNameSettings } = useAuthSettingsStore();

    const handleLastNameSettingChange = (
        settingName: string,
        value: boolean,
    ) => {
        const updateData: { [key: string]: boolean } = {};
        updateData[settingName] = value;
        updateLastNameSettings(updateData);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Last name</DialogTitle>
                    <DialogDescription>
                        Configure last name attribute
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="last_name_enabled"
                                    checked={settings.last_name?.enabled}
                                    onCheckedChange={(checked) =>
                                        handleLastNameSettingChange(
                                            "enabled",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Collect and store user's last name
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require</Label>
                                <Switch
                                    name="last_name_required"
                                    checked={settings.last_name?.required}
                                    onCheckedChange={(checked) =>
                                        handleLastNameSettingChange(
                                            "required",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Users must provide a last name to complete sign
                                up
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Email Link Configuration</DialogTitle>
                    <DialogDescription>
                        Configure email link security settings
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="email_link_enabled"
                                    checked={settings.magic_link?.enabled}
                                    onCheckedChange={(checked) =>
                                        handleMagicLinkSettingChange(
                                            "enabled",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Allow users to sign in by receiving a secure
                                link via email
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Require same device</Label>
                                <Switch
                                    name="email_link_same_device"
                                    checked={
                                        settings.magic_link?.require_same_device
                                    }
                                    onCheckedChange={(checked) =>
                                        handleMagicLinkSettingChange(
                                            "require_same_device",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <Description>
                                Ensure the email link is opened on the same
                                device used for sign-in
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Passkey Configuration</DialogTitle>
                    <DialogDescription>
                        Configure passkey authentication settings
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <FieldGroup>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Enable</Label>
                                <Switch
                                    name="passkey_enabled"
                                    checked={settings.passkey?.enabled}
                                    onCheckedChange={handlePasskeyEnabledChange}
                                />
                            </div>
                            <Description>
                                Allow users to register and sign in using secure
                                biometric or hardware keys
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Prompt registration</Label>
                                <Switch
                                    name="passkey_prompt_registration"
                                    checked={
                                        settings.passkey
                                            ?.prompt_registration_on_auth
                                    }
                                    onCheckedChange={
                                        handlePasskeyPromptRegistrationChange
                                    }
                                />
                            </div>
                            <Description>
                                Gently encourage users to set up a passkey
                                immediately after a successful sign-in
                            </Description>
                        </Field>
                        <Field>
                            <div className="flex items-center justify-between">
                                <Label>Allow autofill</Label>
                                <Switch
                                    name="passkey_autofill"
                                    checked={settings.passkey?.allow_autofill}
                                    onCheckedChange={
                                        handlePasskeyAutofillChange
                                    }
                                />
                            </div>
                            <Description>
                                Let the browser automatically suggest available
                                passkeys for a faster sign-in experience
                            </Description>
                        </Field>
                    </FieldGroup>
                </div>
                <DialogFooter className="mt-2">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Continue
                    </Button>
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

    if (settings.auth_factors_enabled?.email_password) {
        availableOptions.push({
            value: "email_password",
            label: "Email + Password",
            description:
                "Users sign in with their email address and a password",
        });
    }

    if (settings.auth_factors_enabled?.username_password) {
        availableOptions.push({
            value: "username_password",
            label: "Username + Password",
            description: "Users sign in with a unique username and a password",
        });
    }

    if (settings.auth_factors_enabled?.email_otp) {
        availableOptions.push({
            value: "email_otp",
            label: "Email Code",
            description: "Users receive a one-time verification code via email",
        });
    }

    if (settings.auth_factors_enabled?.email_magic_link) {
        availableOptions.push({
            value: "email_magic_link",
            label: "Email Magic Link",
            description:
                "Users sign in by clicking a secure link sent to their email",
        });
    }

    if (settings.auth_factors_enabled?.phone_otp) {
        availableOptions.push({
            value: "phone_otp",
            label: "Phone Code",
            description: "Users receive a one-time verification code via SMS",
        });
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Default Sign-in Method</DialogTitle>
                    <DialogDescription>
                        Choose the primary authentication method presented to
                        users when they sign in.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 pt-2">
                    {availableOptions.length === 0 ? (
                        <div className="py-8 text-center">
                            <NoSymbolIcon className="mx-auto h-6 w-6 text-zinc-400 mb-2" />
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                No methods enabled
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                Enable at least one method to continue
                            </p>
                        </div>
                    ) : (
                        availableOptions.map((option) => {
                            const isSelected =
                                settings.first_factor === option.value;
                            return (
                                <label
                                    key={option.value}
                                    className={cn(
                                        "flex items-center justify-between rounded-lg cursor-pointer transition-colors",
                                        isSelected
                                            ? "bg-zinc-100 dark:bg-zinc-800"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                                    )}
                                >
                                    <div>
                                        <span className="block text-sm font-medium">
                                            {option.label}
                                        </span>
                                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            {option.description}
                                        </span>
                                    </div>
                                    <input
                                        type="radio"
                                        name="first_factor"
                                        checked={isSelected}
                                        onChange={() =>
                                            handleFirstFactorChange(
                                                option.value as DeploymentAuthSettings["first_factor"],
                                            )
                                        }
                                        className="sr-only"
                                    />
                                    <div
                                        className={cn(
                                            "w-4 h-4 rounded-full border-2 transition-colors",
                                            isSelected
                                                ? "border-primary bg-primary"
                                                : "border-zinc-300 dark:border-zinc-600",
                                        )}
                                    />
                                </label>
                            );
                        })
                    )}
                </div>
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

    const policies: {
        id: DeploymentAuthSettings["second_factor_policy"];
        label: string;
        description: string;
    }[] = [
        {
            id: "none",
            label: "Disabled",
            description:
                "Users cannot set up or use second factors for authentication",
        },
        {
            id: "optional",
            label: "Optional",
            description:
                "Users can choose to enable second factors for their accounts",
        },
    ];

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Second Factor Policy</DialogTitle>
                    <DialogDescription>
                        Configure how multi-factor authentication is applied
                        across your deployment.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 pt-2">
                    {policies.map((policy) => {
                        const isSelected =
                            settings.second_factor_policy === policy.id;
                        return (
                            <label
                                key={policy.id}
                                className={cn(
                                    "flex items-center justify-between rounded-lg cursor-pointer transition-colors",
                                    isSelected
                                        ? "bg-zinc-100 dark:bg-zinc-800"
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                                )}
                            >
                                <div>
                                    <span className="block text-sm font-medium">
                                        {policy.label}
                                    </span>
                                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {policy.description}
                                    </span>
                                </div>
                                <input
                                    type="radio"
                                    name="second_factor_policy"
                                    checked={isSelected}
                                    onChange={() =>
                                        handlePolicyChange(policy.id)
                                    }
                                    className="sr-only"
                                />
                                <div
                                    className={cn(
                                        "w-4 h-4 rounded-full border-2 transition-colors",
                                        isSelected
                                            ? "border-primary bg-primary"
                                            : "border-zinc-300 dark:border-zinc-600",
                                    )}
                                />
                            </label>
                        );
                    })}
                </div>
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
                            <h2 className="text-base font-medium">
                                User Schema
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Configure the required fields and verification
                                policies for your users
                            </p>
                        </div>

                        <Divider soft />

                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-sm font-medium">
                                        Email address
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can add email addresses to their
                                        account
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setEmailSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="email_enabled"
                                        checked={
                                            settings.email_address?.enabled
                                        }
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "email_enabled",
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="gap-x-8 gap-y-1 flex flex-col">
                                    <h3 className="text-sm font-medium">
                                        Password
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can set a password for their
                                        account
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setPasswordSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="password_enabled"
                                        checked={settings.password?.enabled}
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "password_enabled",
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="gap-x-8 gap-y-1 flex flex-col">
                                    <h3 className="text-sm font-medium">
                                        Phone number
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can add phone numbers to their
                                        account
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setPhoneSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="phone_enabled"
                                        checked={settings.phone_number?.enabled}
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "phone_enabled",
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="gap-x-8 gap-y-1 flex flex-col">
                                    <h3 className="text-sm font-medium">
                                        Username
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can set a unique username for
                                        their account
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setUsernameSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="username_enabled"
                                        checked={settings.username?.enabled}
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "username_enabled",
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="gap-x-8 gap-y-1 flex flex-col">
                                    <h3 className="text-sm font-medium">
                                        First name
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can set their first name
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setFirstNameSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="first_name_enabled"
                                        checked={settings.first_name?.enabled}
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "first_name_enabled",
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="gap-x-8 gap-y-1 flex flex-col">
                                    <h3 className="text-sm font-medium">
                                        Last name
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can set their last name
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setLastNameSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="last_name_enabled"
                                        checked={settings.last_name?.enabled}
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "last_name_enabled",
                                                checked,
                                            )
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
                                Select the authentication methods to present
                                when a user signs in
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
                                            .replace(/\b\w/g, (l) =>
                                                l.toUpperCase(),
                                            ) || "Email Password"}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setFirstFactorOpen(true)}
                                    >
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
                                    checked={
                                        settings.auth_factors_enabled
                                            ?.email_password
                                    }
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "email_password_enabled",
                                            checked,
                                        )
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
                                    checked={
                                        settings.auth_factors_enabled
                                            ?.username_password
                                    }
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "username_password_enabled",
                                            checked,
                                        )
                                    }
                                />
                            </SwitchField>

                            <SwitchField>
                                <Label>SSO Authentication</Label>
                                <Description>
                                    Users can sign in external accounts
                                </Description>
                                <Switch
                                    name="sso_enabled"
                                    checked={settings.auth_factors_enabled?.sso}
                                    onCheckedChange={(checked) =>
                                        handleToggle("sso_enabled", checked)
                                    }
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
                                    <h3 className="text-sm font-medium">
                                        Email magic link
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Users can sign in with an email
                                        verification link
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setEmailLinkSettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="email_link_enabled"
                                        checked={
                                            settings.auth_factors_enabled
                                                ?.email_magic_link
                                        }
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "email_link_enabled",
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <SwitchField>
                                <Label>Email OTP</Label>
                                <Description>
                                    Users can sign in with an email one-time
                                    password
                                </Description>
                                <Switch
                                    name="email_otp_enabled"
                                    checked={
                                        settings.auth_factors_enabled?.email_otp
                                    }
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "email_otp_enabled",
                                            checked,
                                        )
                                    }
                                />
                            </SwitchField>

                            <SwitchField>
                                <Label>Phone OTP</Label>
                                <Description>
                                    Users can sign in with a phone one-time
                                    password
                                </Description>
                                <Switch
                                    name="phone_otp_enabled"
                                    checked={
                                        settings.auth_factors_enabled?.phone_otp
                                    }
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "phone_otp_enabled",
                                            checked,
                                        )
                                    }
                                />
                            </SwitchField>

                            <SwitchField>
                                <Label>Passkeys</Label>
                                <Description>
                                    Users can sign in with a passkey
                                </Description>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setPasskeySettingsOpen(true)
                                        }
                                    >
                                        <Cog6ToothIcon />
                                    </Button>
                                    <Switch
                                        name="passkey_enabled"
                                        checked={settings.passkey?.enabled}
                                        onCheckedChange={(checked) =>
                                            handleToggle(
                                                "passkey_enabled",
                                                checked,
                                            )
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
                                    Allow users to select a second factor
                                    authentication method
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setSecondFactorPolicyOpen(true)}
                            >
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
                                        settings.auth_factors_enabled
                                            ?.authenticator || false
                                    }
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "second_factor_authenticator_enabled",
                                            checked,
                                        )
                                    }
                                />
                            </SwitchField>

                            <SwitchField>
                                <Label>Backup code</Label>
                                <Description>
                                    Users can verify with a backup code
                                </Description>
                                <Switch
                                    name="2fa_backup_code_enabled"
                                    checked={
                                        settings.auth_factors_enabled
                                            ?.backup_code || false
                                    }
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "second_factor_backup_code_enabled",
                                            checked,
                                        )
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
                            <Button
                                variant="outline"
                                onClick={handleResetSettings}
                                disabled={isSaving}
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

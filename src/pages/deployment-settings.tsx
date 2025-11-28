import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useMemo } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { Divider } from "@/components/ui/divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

import { Spinner } from "@/components/ui/spinner";
import {
  useUpdateDeploymentDisplaySettings,
  DeploymentDisplaySettingsUpdates,
} from "@/lib/api/hooks/use-update-deployment-display-settings";
import SavePopup from "@/components/save-popup";
import { ImageUpload } from "@/components/ui/image-upload";

interface ValidationErrors {
  appName?: string;
  privacyPolicyUrl?: string;
  tosPageUrl?: string;
  afterSignupRedirectUrl?: string;
  afterSigninRedirectUrl?: string;
  afterLogoClickUrl?: string;
  afterCreateOrganizationUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  afterSignOutOnePageUrl?: string;
  afterSignOutAllPageUrl?: string;
  defaultUserProfileImageUrl?: string;
  defaultOrganizationProfileImageUrl?: string;
  defaultWorkspaceProfileImageUrl?: string;
  signupTermsStatement?: string;
  darkModePrimaryColor?: string;
  darkModeBackgroundColor?: string;
  waitlistPageUrl?: string;
  supportPageUrl?: string;
}

export default function DeploymentSettingsPage() {
  const { deploymentSettings } = useCurrentDeployemnt();
  const updateDisplaySettings = useUpdateDeploymentDisplaySettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [appName, setAppName] = useState("");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [tosPageUrl, setTosPageUrl] = useState("");
  const [afterSignupRedirectUrl, setAfterSignupRedirectUrl] = useState("");
  const [afterSigninRedirectUrl, setAfterSigninRedirectUrl] = useState("");
  const [afterLogoClickUrl, setAfterLogoClickUrl] = useState("");
  const [afterCreateOrganizationUrl, setAfterCreateOrganizationUrl] =
    useState("");
  const [primaryColor, setPrimaryColor] = useState("#1E40AF");
  const [backgroundColor, setBackgroundColor] = useState("#F3F4F6");
  const [afterSignOutOnePageUrl, setAfterSignOutOnePageUrl] = useState("");
  const [afterSignOutAllPageUrl, setAfterSignOutAllPageUrl] = useState("");

  const [useInitialsForUserProfileImage, setUseInitialsForUserProfileImage] =
    useState(true);
  const [
    useInitialsForOrganizationProfileImage,
    setUseInitialsForOrganizationProfileImage,
  ] = useState(true);
  const [signupTermsStatement, setSignupTermsStatement] = useState("");
  const [signupTermsStatementShown, setSignupTermsStatementShown] =
    useState(true);
  const [darkModePrimaryColor, setDarkModePrimaryColor] = useState("#1E40AF");
  const [darkModeBackgroundColor, setDarkModeBackgroundColor] =
    useState("#111827");
  const [waitlistPageUrl, setWaitlistPageUrl] = useState("");
  const [supportPageUrl, setSupportPageUrl] = useState("");

  // Image URL states to track current values (null means use original, empty string means removed)
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [faviconImageUrl, setFaviconImageUrl] = useState<string | null>(null);
  const [userProfileImageUrl, setUserProfileImageUrl] = useState<string | null>(
    null,
  );
  const [orgProfileImageUrl, setOrgProfileImageUrl] = useState<string | null>(
    null,
  );
  const [workspaceProfileImageUrl, setWorkspaceProfileImageUrl] = useState<
    string | null
  >(null);

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const updateField = (
    setter: (value: string) => void,
    value: string,
    fieldName: keyof ValidationErrors,
  ) => {
    setter(value);
    setIsDirty(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for validation
    timeoutRef.current = setTimeout(() => {
      validateField(fieldName, value);
    }, 500);
  };

  const updateBooleanField = (
    setter: (value: boolean) => void,
    value: boolean,
  ) => {
    setter(value);
    setIsDirty(true);
  };

  const validateField = (fieldName: keyof ValidationErrors, value: string) => {
    const errors = { ...validationErrors };

    switch (fieldName) {
      case "appName":
        if (!value.trim()) {
          errors.appName = "App name is required";
        } else {
          delete errors.appName;
        }
        break;
      case "privacyPolicyUrl":
      case "tosPageUrl":
      case "afterSignupRedirectUrl":
      case "afterSigninRedirectUrl":
      case "afterLogoClickUrl":
      case "afterCreateOrganizationUrl":
      case "afterSignOutOnePageUrl":
      case "afterSignOutAllPageUrl":
      case "waitlistPageUrl":
      case "supportPageUrl":
        if (value && !isValidUrl(value)) {
          errors[fieldName] = "Please enter a valid URL";
        } else {
          delete errors[fieldName];
        }
        break;
      case "primaryColor":
      case "backgroundColor":
      case "darkModePrimaryColor":
      case "darkModeBackgroundColor":
        if (value && !isValidHexColor(value)) {
          errors[fieldName] = "Please enter a valid hex color";
        } else {
          delete errors[fieldName];
        }
        break;
      case "signupTermsStatement":
        // No validation needed for terms statement
        delete errors[fieldName];
        break;
    }

    setValidationErrors(errors);
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidHexColor = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (deploymentSettings?.ui_settings) {
      const settings = deploymentSettings.ui_settings;
      setAppName(settings.app_name || "");
      setPrivacyPolicyUrl(settings.privacy_policy_url || "");
      setTosPageUrl(settings.tos_page_url || "");
      setAfterSignupRedirectUrl(settings.after_signup_redirect_url || "");
      setAfterSigninRedirectUrl(settings.after_signin_redirect_url || "");
      setAfterLogoClickUrl(settings.after_logo_click_url || "");
      setAfterCreateOrganizationUrl(
        settings.after_create_organization_redirect_url || "",
      );
      setPrimaryColor(settings.light_mode_settings?.primary_color || "#1E40AF");
      setBackgroundColor(
        settings.light_mode_settings?.background_color || "#F3F4F6",
      );
      setAfterSignOutOnePageUrl(settings.after_sign_out_one_page_url || "");
      setAfterSignOutAllPageUrl(settings.after_sign_out_all_page_url || "");
      setUseInitialsForUserProfileImage(
        settings.use_initials_for_user_profile_image ?? true,
      );
      setUseInitialsForOrganizationProfileImage(
        settings.use_initials_for_organization_profile_image ?? true,
      );
      setSignupTermsStatement(settings.signup_terms_statement || "");
      setSignupTermsStatementShown(
        settings.signup_terms_statement_shown ?? true,
      );
      setDarkModePrimaryColor(
        settings.dark_mode_settings?.primary_color || "#1E40AF",
      );
      setDarkModeBackgroundColor(
        settings.dark_mode_settings?.background_color || "#111827",
      );
      setWaitlistPageUrl(settings.waitlist_page_url || "");
      setSupportPageUrl(settings.support_page_url || "");

      // Initialize image URLs (null means use original values)
      setLogoImageUrl(null);
      setFaviconImageUrl(null);
      setUserProfileImageUrl(null);
      setOrgProfileImageUrl(null);
      setWorkspaceProfileImageUrl(null);
    }
  }, [deploymentSettings]);

  const data = [
    {
      index: 1,
      title: "Sign-in",
      desc: "Preview your application's hosted sign-in flow.",
      demoLink: deploymentSettings?.ui_settings?.sign_in_page_url || "",
    },
    {
      index: 2,
      title: "Sign-up",
      desc: "Preview your application's hosted sign-up flow.",
      demoLink: deploymentSettings?.ui_settings?.sign_up_page_url || "",
    },
    {
      index: 3,
      title: "User profile",
      desc: "Preview your application's hosted user profile page.",
      demoLink: deploymentSettings?.ui_settings?.user_profile_url || "",
    },
    {
      index: 4,
      title: "Organization profile",
      desc: "Preview your application's hosted organization profile page.",
      demoLink: deploymentSettings?.ui_settings?.organization_profile_url || "",
    },
  ];

  const isFormValid = useMemo(() => {
    return !hasValidationErrors && appName.trim() !== "";
  }, [hasValidationErrors, appName]);

  if (!deploymentSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setShowValidationErrors(true);

    if (!isFormValid) {
      return;
    }

    setIsSaving(true);

    const updates: DeploymentDisplaySettingsUpdates = {
      app_name: appName,
      privacy_policy_url: privacyPolicyUrl,
      tos_page_url: tosPageUrl,
      after_signup_redirect_url: afterSignupRedirectUrl,
      after_signin_redirect_url: afterSigninRedirectUrl,
      after_logo_click_url: afterLogoClickUrl,
      after_create_organization_redirect_url: afterCreateOrganizationUrl,
      after_sign_out_one_page_url: afterSignOutOnePageUrl,
      after_sign_out_all_page_url: afterSignOutAllPageUrl,
      use_initials_for_user_profile_image: useInitialsForUserProfileImage,
      use_initials_for_organization_profile_image:
        useInitialsForOrganizationProfileImage,
      organization_profile_url:
        deploymentSettings?.ui_settings?.organization_profile_url || "",
      create_organization_url:
        deploymentSettings?.ui_settings?.create_organization_url || "",
      user_profile_url: deploymentSettings?.ui_settings?.user_profile_url || "",
      light_mode_settings: {
        primary_color: primaryColor,
        background_color: backgroundColor,
      },
      dark_mode_settings: {
        primary_color: darkModePrimaryColor,
        background_color: darkModeBackgroundColor,
      },
      signup_terms_statement: signupTermsStatement,
      signup_terms_statement_shown: signupTermsStatementShown,
      waitlist_page_url: waitlistPageUrl,
      support_page_url: supportPageUrl,

      // Include image URLs only if they have been changed
      ...(logoImageUrl !== null && { logo_image_url: logoImageUrl }),
      ...(faviconImageUrl !== null && { favicon_image_url: faviconImageUrl }),
      ...(userProfileImageUrl !== null && {
        default_user_profile_image_url: userProfileImageUrl,
      }),
      ...(orgProfileImageUrl !== null && {
        default_organization_profile_image_url: orgProfileImageUrl,
      }),
      ...(workspaceProfileImageUrl !== null && {
        default_workspace_profile_image_url: workspaceProfileImageUrl,
      }),
    };

    try {
      await updateDisplaySettings.mutateAsync(updates);
      setIsDirty(false);
      setShowValidationErrors(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (deploymentSettings?.ui_settings) {
      const settings = deploymentSettings.ui_settings;
      setAppName(settings.app_name || "");
      setPrivacyPolicyUrl(settings.privacy_policy_url || "");
      setTosPageUrl(settings.tos_page_url || "");
      setAfterSignupRedirectUrl(settings.after_signup_redirect_url || "");
      setAfterSigninRedirectUrl(settings.after_signin_redirect_url || "");
      setAfterLogoClickUrl(settings.after_logo_click_url || "");
      setAfterCreateOrganizationUrl(
        settings.after_create_organization_redirect_url || "",
      );
      setPrimaryColor(settings.light_mode_settings?.primary_color || "#1E40AF");
      setBackgroundColor(
        settings.light_mode_settings?.background_color || "#F3F4F6",
      );
      setAfterSignOutOnePageUrl(settings.after_sign_out_one_page_url || "");
      setAfterSignOutAllPageUrl(settings.after_sign_out_all_page_url || "");
      setUseInitialsForUserProfileImage(
        settings.use_initials_for_user_profile_image ?? true,
      );
      setUseInitialsForOrganizationProfileImage(
        settings.use_initials_for_organization_profile_image ?? true,
      );
      setSignupTermsStatement(settings.signup_terms_statement || "");
      setSignupTermsStatementShown(
        settings.signup_terms_statement_shown ?? true,
      );
      setDarkModePrimaryColor(
        settings.dark_mode_settings?.primary_color || "#1E40AF",
      );
      setDarkModeBackgroundColor(
        settings.dark_mode_settings?.background_color || "#111827",
      );
      setWaitlistPageUrl(settings.waitlist_page_url || "");
      setSupportPageUrl(settings.support_page_url || "");

      // Reset image URLs to null (use original values)
      setLogoImageUrl(null);
      setFaviconImageUrl(null);
      setUserProfileImageUrl(null);
      setOrgProfileImageUrl(null);
      setWorkspaceProfileImageUrl(null);

      setValidationErrors({});
      setShowValidationErrors(false);
      setIsDirty(false);
    }
  };

  return (
    <div>
      <Heading>Deployment Settings</Heading>
      <Text className="mt-2 text-zinc-500">
        Customize your deployment's UI settings and manage deployment options.
      </Text>

      <SavePopup
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSaveSettings}
        onCancel={handleResetSettings}
      />

      <div className="mt-8 space-y-10">
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>App Name</Subheading>
            <Text>The name of your application displayed to users.</Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="My Awesome App"
              value={appName}
              onChange={(e) =>
                updateField(setAppName, e.target.value, "appName")
              }
              className={
                validationErrors.appName && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.appName && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.appName}
              </span>
            )}
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Application Logo</Subheading>
            <Text>Upload your application's logo image.</Text>
          </div>
          <div className="space-y-1">
            <ImageUpload
              label=""
              imageType="logo"
              currentImageUrl={
                logoImageUrl !== null
                  ? logoImageUrl
                  : deploymentSettings?.ui_settings?.logo_image_url
              }
              onImageUploaded={(url) => {
                setLogoImageUrl(url);
                setIsDirty(true);
              }}
              variant="banner"
              required={true}
              imageClassName="object-contain"
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Favicon</Subheading>
            <Text>Upload your application's favicon image.</Text>
          </div>
          <div className="space-y-1">
            <ImageUpload
              label=""
              imageType="favicon"
              currentImageUrl={
                faviconImageUrl !== null
                  ? faviconImageUrl
                  : deploymentSettings?.ui_settings?.favicon_image_url
              }
              onImageUploaded={(url) => {
                setFaviconImageUrl(url);
                setIsDirty(true);
              }}
              variant="avatar"
              required={true}
            />
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Privacy Policy URL</Subheading>
            <Text>Link to your application's privacy policy.</Text>
          </div>
          <div className="space-y-1">
            <Input
              type="url"
              placeholder="https://example.com/privacy"
              value={privacyPolicyUrl}
              onChange={(e) =>
                updateField(
                  setPrivacyPolicyUrl,
                  e.target.value,
                  "privacyPolicyUrl",
                )
              }
              className={
                validationErrors.privacyPolicyUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.privacyPolicyUrl && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.privacyPolicyUrl}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Terms of Service URL</Subheading>
            <Text>Link to your application's terms of service.</Text>
          </div>
          <div className="space-y-1">
            <Input
              type="url"
              placeholder="https://example.com/terms"
              value={tosPageUrl}
              onChange={(e) =>
                updateField(setTosPageUrl, e.target.value, "tosPageUrl")
              }
              className={
                validationErrors.tosPageUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.tosPageUrl && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.tosPageUrl}
              </span>
            )}
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Primary Color</Subheading>
            <Text>The primary color for your application's UI.</Text>
          </div>
          <div className="space-y-1 flex items-center gap-3">
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) =>
                updateField(setPrimaryColor, e.target.value, "primaryColor")
              }
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              placeholder="#1E40AF"
              value={primaryColor}
              onChange={(e) =>
                updateField(setPrimaryColor, e.target.value, "primaryColor")
              }
              className={`flex-1 ${validationErrors.primaryColor && showValidationErrors
                ? "border-red-500"
                : ""
                }`}
            />
            {validationErrors.primaryColor && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.primaryColor}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Background Color</Subheading>
            <Text>The background color for your application's UI.</Text>
          </div>
          <div className="space-y-1 flex items-center gap-3">
            <Input
              type="color"
              value={backgroundColor}
              onChange={(e) =>
                updateField(
                  setBackgroundColor,
                  e.target.value,
                  "backgroundColor",
                )
              }
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              placeholder="#F3F4F6"
              value={backgroundColor}
              onChange={(e) =>
                updateField(
                  setBackgroundColor,
                  e.target.value,
                  "backgroundColor",
                )
              }
              className={`flex-1 ${validationErrors.backgroundColor && showValidationErrors
                ? "border-red-500"
                : ""
                }`}
            />
            {validationErrors.backgroundColor && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.backgroundColor}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Dark Mode Primary Color</Subheading>
            <Text>The primary color for your application's dark mode UI.</Text>
          </div>
          <div className="space-y-1 flex items-center gap-3">
            <Input
              type="color"
              value={darkModePrimaryColor}
              onChange={(e) =>
                updateField(
                  setDarkModePrimaryColor,
                  e.target.value,
                  "darkModePrimaryColor",
                )
              }
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              placeholder="#1E40AF"
              value={darkModePrimaryColor}
              onChange={(e) =>
                updateField(
                  setDarkModePrimaryColor,
                  e.target.value,
                  "darkModePrimaryColor",
                )
              }
              className={`flex-1 ${validationErrors.darkModePrimaryColor && showValidationErrors
                ? "border-red-500"
                : ""
                }`}
            />
            {validationErrors.darkModePrimaryColor && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.darkModePrimaryColor}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Dark Mode Background Color</Subheading>
            <Text>
              The background color for your application's dark mode UI.
            </Text>
          </div>
          <div className="space-y-1 flex items-center gap-3">
            <Input
              type="color"
              value={darkModeBackgroundColor}
              onChange={(e) =>
                updateField(
                  setDarkModeBackgroundColor,
                  e.target.value,
                  "darkModeBackgroundColor",
                )
              }
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              placeholder="#111827"
              value={darkModeBackgroundColor}
              onChange={(e) =>
                updateField(
                  setDarkModeBackgroundColor,
                  e.target.value,
                  "darkModeBackgroundColor",
                )
              }
              className={`flex-1 ${validationErrors.darkModeBackgroundColor && showValidationErrors
                ? "border-red-500"
                : ""
                }`}
            />
            {validationErrors.darkModeBackgroundColor &&
              showValidationErrors && (
                <span className="text-red-500 text-sm px-2">
                  {validationErrors.darkModeBackgroundColor}
                </span>
              )}
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>User Redirects</Subheading>
            <Text>
              The Account Portal requires a destination to redirect your users
              after they complete key actions. By default, we've set your
              development host, but you can customize the paths to suit your
              needs.
            </Text>
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>After sign-up fallback</Subheading>
            <Text>
              Specify where to send a user if it cannot be determined from the
              redirect_url query parameter.
            </Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/path"
              value={afterSignupRedirectUrl}
              onChange={(e) =>
                updateField(
                  setAfterSignupRedirectUrl,
                  e.target.value,
                  "afterSignupRedirectUrl",
                )
              }
              className={
                validationErrors.afterSignupRedirectUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.afterSignupRedirectUrl &&
              showValidationErrors && (
                <span className="text-red-500 text-sm px-2">
                  {validationErrors.afterSignupRedirectUrl}
                </span>
              )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>After sign-in fallback</Subheading>
            <Text>
              Specify where to send a user if it cannot be determined from the
              redirect_url query parameter.
            </Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/path"
              value={afterSigninRedirectUrl}
              onChange={(e) =>
                updateField(
                  setAfterSigninRedirectUrl,
                  e.target.value,
                  "afterSigninRedirectUrl",
                )
              }
              className={
                validationErrors.afterSigninRedirectUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.afterSigninRedirectUrl &&
              showValidationErrors && (
                <span className="text-red-500 text-sm px-2">
                  {validationErrors.afterSigninRedirectUrl}
                </span>
              )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>After logo click</Subheading>
            <Text>
              Specify where to send a user after they click your application's
              logo.
            </Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/path"
              value={afterLogoClickUrl}
              onChange={(e) =>
                updateField(
                  setAfterLogoClickUrl,
                  e.target.value,
                  "afterLogoClickUrl",
                )
              }
              className={
                validationErrors.afterLogoClickUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.afterLogoClickUrl && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.afterLogoClickUrl}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>After sign-out (one session)</Subheading>
            <Text>
              Specify where to send a user after they sign out of the current
              session.
            </Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/path"
              value={afterSignOutOnePageUrl}
              onChange={(e) =>
                updateField(
                  setAfterSignOutOnePageUrl,
                  e.target.value,
                  "afterSignOutOnePageUrl",
                )
              }
              className={
                validationErrors.afterSignOutOnePageUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.afterSignOutOnePageUrl &&
              showValidationErrors && (
                <span className="text-red-500 text-sm px-2">
                  {validationErrors.afterSignOutOnePageUrl}
                </span>
              )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>After sign-out (all sessions)</Subheading>
            <Text>
              Specify where to send a user after they sign out of all sessions.
            </Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/path"
              value={afterSignOutAllPageUrl}
              onChange={(e) =>
                updateField(
                  setAfterSignOutAllPageUrl,
                  e.target.value,
                  "afterSignOutAllPageUrl",
                )
              }
              className={
                validationErrors.afterSignOutAllPageUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.afterSignOutAllPageUrl &&
              showValidationErrors && (
                <span className="text-red-500 text-sm px-2">
                  {validationErrors.afterSignOutAllPageUrl}
                </span>
              )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>After create organization</Subheading>
            <Text>
              Specify where to send a user after they create an organization.
              (Leave blank to redirect to the host's root.)
            </Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/path"
              value={afterCreateOrganizationUrl}
              onChange={(e) =>
                updateField(
                  setAfterCreateOrganizationUrl,
                  e.target.value,
                  "afterCreateOrganizationUrl",
                )
              }
              className={
                validationErrors.afterCreateOrganizationUrl &&
                  showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.afterCreateOrganizationUrl &&
              showValidationErrors && (
                <span className="text-red-500 text-sm px-2">
                  {validationErrors.afterCreateOrganizationUrl}
                </span>
              )}
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Default User Profile Image</Subheading>
            <Text>
              Default profile image for users who haven't uploaded one.
            </Text>
          </div>
          <div className="space-y-1">
            <ImageUpload
              label=""
              imageType="user-profile"
              currentImageUrl={
                userProfileImageUrl !== null
                  ? userProfileImageUrl
                  : deploymentSettings?.ui_settings
                    ?.default_user_profile_image_url
              }
              onImageUploaded={(url) => {
                setUserProfileImageUrl(url);
                setIsDirty(true);
              }}
              variant="avatar"
              required={true}
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Default Organization Profile Image</Subheading>
            <Text>
              Default profile image for organizations that haven't uploaded one.
            </Text>
          </div>
          <div className="space-y-1">
            <ImageUpload
              label=""
              imageType="org-profile"
              currentImageUrl={
                orgProfileImageUrl !== null
                  ? orgProfileImageUrl
                  : deploymentSettings?.ui_settings
                    ?.default_organization_profile_image_url
              }
              onImageUploaded={(url) => {
                setOrgProfileImageUrl(url);
                setIsDirty(true);
              }}
              variant="avatar"
              required={true}
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Default Workspace Profile Image</Subheading>
            <Text>
              Default profile image for workspaces that haven't uploaded one.
            </Text>
          </div>
          <div className="space-y-1">
            <ImageUpload
              label=""
              imageType="workspace-profile"
              currentImageUrl={
                workspaceProfileImageUrl !== null
                  ? workspaceProfileImageUrl
                  : deploymentSettings?.ui_settings
                    ?.default_workspace_profile_image_url
              }
              onImageUploaded={(url) => {
                setWorkspaceProfileImageUrl(url);
                setIsDirty(true);
              }}
              variant="avatar"
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Use Initials for User Profile Images</Subheading>
            <Text>Show user initials when no profile image is available.</Text>
          </div>
          <div className="space-y-1 flex justify-end">
            <Switch
              name="use_initials_for_user_profile_image"
              checked={useInitialsForUserProfileImage}
              onChange={(checked) =>
                updateBooleanField(setUseInitialsForUserProfileImage, checked)
              }
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>
              Use Initials for Organization Profile Images
            </Subheading>
            <Text>
              Show organization initials when no profile image is available.
            </Text>
          </div>
          <div className="space-y-1 flex justify-end">
            <Switch
              name="use_initials_for_organization_profile_image"
              checked={useInitialsForOrganizationProfileImage}
              onChange={(checked) =>
                updateBooleanField(
                  setUseInitialsForOrganizationProfileImage,
                  checked,
                )
              }
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Signup Terms Statement</Subheading>
            <Text>Custom terms statement shown during signup process.</Text>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="By signing up, you agree to our terms..."
              value={signupTermsStatement}
              onChange={(e) =>
                updateField(
                  setSignupTermsStatement,
                  e.target.value,
                  "signupTermsStatement",
                )
              }
              className={
                validationErrors.signupTermsStatement && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.signupTermsStatement && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.signupTermsStatement}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Show Signup Terms Statement</Subheading>
            <Text>Display the terms statement during the signup process.</Text>
          </div>
          <div className="space-y-1 flex justify-end">
            <Switch
              name="signup_terms_statement_shown"
              checked={signupTermsStatementShown}
              onChange={(checked) =>
                updateBooleanField(setSignupTermsStatementShown, checked)
              }
            />
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Waitlist Page URL</Subheading>
            <Text>URL for your application's waitlist page.</Text>
          </div>
          <div className="space-y-1">
            <Input
              type="url"
              placeholder="https://example.com/waitlist"
              value={waitlistPageUrl}
              onChange={(e) =>
                updateField(
                  setWaitlistPageUrl,
                  e.target.value,
                  "waitlistPageUrl",
                )
              }
              className={
                validationErrors.waitlistPageUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.waitlistPageUrl && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.waitlistPageUrl}
              </span>
            )}
          </div>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Support Page URL</Subheading>
            <Text>URL for your application's support or help page.</Text>
          </div>
          <div className="space-y-1">
            <Input
              type="url"
              placeholder="https://example.com/support"
              value={supportPageUrl}
              onChange={(e) =>
                updateField(setSupportPageUrl, e.target.value, "supportPageUrl")
              }
              className={
                validationErrors.supportPageUrl && showValidationErrors
                  ? "border-red-500"
                  : ""
              }
            />
            {validationErrors.supportPageUrl && showValidationErrors && (
              <span className="text-red-500 text-sm px-2">
                {validationErrors.supportPageUrl}
              </span>
            )}
          </div>
        </section>

        <Divider className="my-8" soft />

        <section>
          <Subheading className="mb-4">Preview Links</Subheading>
          <Text className="mb-6">
            Preview your application's hosted authentication flows.
          </Text>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((item) => (
              <div
                key={item.index}
                className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip
                    message="Copied!"
                    trigger={copiedIndex === item.index}
                  >
                    <Button
                      outline
                      onClick={() => copyToClipboard(item.demoLink, item.index)}
                      className="p-2"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Button
                    outline
                    onClick={() => window.open(item.demoLink, "_blank")}
                    className="p-2"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

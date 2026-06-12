import {
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"
import { SectionLabel } from "@/components/ui/section-label";
import { FieldRow, FieldCard } from "@/components/ui/field-row";
import { cn } from "@/lib/utils";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

import { InlineLoader } from "@/components/ui/loading-screen";
import {
  useUpdateDeploymentDisplaySettings,
  DeploymentDisplaySettingsUpdates,
} from "@/lib/api/hooks/use-update-deployment-display-settings";
import SavePopup from "@/components/save-popup";
import { ImageUpload } from "@/components/ui/image-upload";

type ThemeMode = "light" | "dark";
type TokenKind = "color" | "length" | "font";

type TokenDef = {
  key: string;
  label: string;
  kind: TokenKind;
  light: string;
  dark: string;
};

const THEME_TOKEN_GROUPS: Array<{ title: string; tokens: TokenDef[] }> = [
  {
    title: "Surfaces",
    tokens: [
      { key: "surface", label: "Surface", kind: "color", light: "#ffffff", dark: "#131318" },
      { key: "surface_subtle", label: "Surface subtle", kind: "color", light: "#fafaf8", dark: "#101015" },
      { key: "background", label: "Background", kind: "color", light: "#f5f5f2", dark: "#0d0d10" },
      { key: "canvas", label: "Canvas", kind: "color", light: "#ebebe7", dark: "#050507" },
    ],
  },
  {
    title: "Text",
    tokens: [
      { key: "text", label: "Text", kind: "color", light: "#161618", dark: "#ececef" },
      { key: "text_secondary", label: "Text secondary", kind: "color", light: "#3b3b3f", dark: "#c5c5cb" },
      { key: "text_muted", label: "Text muted", kind: "color", light: "#76767c", dark: "#8a8a92" },
      { key: "text_faint", label: "Text faint", kind: "color", light: "#a8a8ad", dark: "#57575e" },
    ],
  },
  {
    title: "Lines",
    tokens: [
      { key: "border", label: "Border", kind: "color", light: "rgba(20, 20, 22, 0.08)", dark: "rgba(255, 255, 255, 0.07)" },
      { key: "border_strong", label: "Border strong", kind: "color", light: "rgba(20, 20, 22, 0.14)", dark: "rgba(255, 255, 255, 0.14)" },
    ],
  },
  {
    title: "Brand",
    tokens: [
      { key: "primary", label: "Primary", kind: "color", light: "#6b3df5", dark: "#9277ff" },
      { key: "primary_soft", label: "Primary soft", kind: "color", light: "rgba(107, 61, 245, 0.1)", dark: "rgba(146, 119, 255, 0.16)" },
      { key: "primary_foreground", label: "Primary foreground", kind: "color", light: "#ffffff", dark: "#ffffff" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { key: "success", label: "Success", kind: "color", light: "#0f8a4a", dark: "#0f8a4a" },
      { key: "success_soft", label: "Success soft", kind: "color", light: "rgba(15, 138, 74, 0.12)", dark: "rgba(15, 138, 74, 0.18)" },
      { key: "info", label: "Info", kind: "color", light: "#2f6fdb", dark: "#2f6fdb" },
      { key: "info_soft", label: "Info soft", kind: "color", light: "rgba(47, 111, 219, 0.1)", dark: "rgba(47, 111, 219, 0.18)" },
      { key: "warning", label: "Warning", kind: "color", light: "#a8650a", dark: "#a8650a" },
      { key: "warning_soft", label: "Warning soft", kind: "color", light: "rgba(168, 101, 10, 0.12)", dark: "rgba(168, 101, 10, 0.18)" },
      { key: "error", label: "Error", kind: "color", light: "#c4271f", dark: "#c4271f" },
      { key: "error_soft", label: "Error soft", kind: "color", light: "rgba(196, 39, 31, 0.1)", dark: "rgba(196, 39, 31, 0.18)" },
    ],
  },
  {
    title: "Shape & type",
    tokens: [
      { key: "radius", label: "Radius", kind: "length", light: "6px", dark: "6px" },
      { key: "radius_lg", label: "Radius large", kind: "length", light: "10px", dark: "10px" },
      { key: "font_sans", label: "Sans font family", kind: "font", light: "", dark: "" },
    ],
  },
];

interface ValidationErrors {
  [key: string]: string | undefined;
  globalSpaceUnit?: string;
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
  const [themeTokens, setThemeTokens] = useState<{
    light: Record<string, string>;
    dark: Record<string, string>;
  }>(() => ({ light: {}, dark: {} }));
  const setToken = (mode: ThemeMode, key: string, value: string) => {
    setThemeTokens((p) => ({ ...p, [mode]: { ...p[mode], [key]: value } }));
    setIsDirty(true);
  };
  const [appName, setAppName] = useState("");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [tosPageUrl, setTosPageUrl] = useState("");
  const [afterSignupRedirectUrl, setAfterSignupRedirectUrl] = useState("");
  const [afterSigninRedirectUrl, setAfterSigninRedirectUrl] = useState("");
  const [afterLogoClickUrl, setAfterLogoClickUrl] = useState("");
  const [afterCreateOrganizationUrl, setAfterCreateOrganizationUrl] =
    useState("");
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

  const isValidCssColor = (value: string) => {
    return /^(#([A-Fa-f0-9]{3,8})|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lch\([^)]*\)|lab\([^)]*\)|transparent|currentColor)$/i.test(
      value.trim(),
    );
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

  const getColorPickerValue = (value?: string) => {
    if (value && isValidHexColor(value)) {
      return value;
    }

    return "#000000";
  };

  const renderColorSwatch = (
    value: string | undefined,
    onChange: (value: string) => void,
  ) => {
    const swatchValue = value?.trim();
    const canPreview = Boolean(swatchValue && isValidCssColor(swatchValue));

    return (
      <div
        className="relative size-6 shrink-0 overflow-hidden rounded border border-border bg-[linear-gradient(45deg,#e4e4e7_25%,transparent_25%),linear-gradient(-45deg,#e4e4e7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e4e4e7_75%),linear-gradient(-45deg,transparent_75%,#e4e4e7_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0] dark:bg-[linear-gradient(45deg,#3f3f46_25%,transparent_25%),linear-gradient(-45deg,#3f3f46_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#3f3f46_75%),linear-gradient(-45deg,transparent_75%,#3f3f46_75%)]"
        title={swatchValue || "Pick color"}
      >
        <div
          className="h-full w-full"
          style={{ backgroundColor: canPreview ? swatchValue : "transparent" }}
        />
        <Input
          type="color"
          value={getColorPickerValue(value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Pick color"
        />
      </div>
    );
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
      setThemeTokens({
        light: { ...(settings.theme_tokens?.light ?? {}) },
        dark: { ...(settings.theme_tokens?.dark ?? {}) },
      });
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
    return <InlineLoader />;
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
      theme_tokens: { light: themeTokens.light, dark: themeTokens.dark },
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
      setThemeTokens({
        light: { ...(settings.theme_tokens?.light ?? {}) },
        dark: { ...(settings.theme_tokens?.dark ?? {}) },
      });
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

  const renderTokenInput = (token: TokenDef, mode: ThemeMode) => {
    const def = mode === "light" ? token.light : token.dark;
    const value = themeTokens[mode][token.key] ?? "";
    const placeholder =
      token.kind === "font"
        ? "System default — enter one font family"
        : def;

    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {token.kind === "color" ? (
          renderColorSwatch(value || def, (next) =>
            setToken(mode, token.key, next),
          )
        ) : null}
        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setToken(mode, token.key, e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    );
  };

  return (
    <div>
      <SavePopup
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSaveSettings}
        onCancel={handleResetSettings}
      />

      <div className="space-y-8">
        <section className="space-y-3">
          <SectionLabel>Branding</SectionLabel>
          <FieldCard>
            <FieldRow
              label="App name"
              desc="Displayed to users on the sign-in, sign-up and consent screens."
              tour="setup-app-name"
            >
              <Input
                type="text"
                placeholder="My Awesome App"
                value={appName}
                onChange={(e) =>
                  updateField(setAppName, e.target.value, "appName")
                }
                className={cn(
                  validationErrors.appName &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.appName && showValidationErrors && (
                <span className="mt-1 block text-xs text-destructive">
                  {validationErrors.appName}
                </span>
              )}
            </FieldRow>

            <FieldRow
              label="Application logo"
              desc="Used on auth screens. Square SVG, PNG or JPG."
              tour="setup-logo"
            >
              <div className="flex">
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
                  variant="avatar"
                  shape="square"
                  required={true}
                />
              </div>
            </FieldRow>

            <FieldRow
              label="Favicon"
              desc="Shown in the browser tab on the hosted pages."
              tour="setup-favicon"
            >
              <div className="flex">
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
                  shape="square"
                  required={true}
                />
              </div>
            </FieldRow>

            <FieldRow
              label="Privacy policy URL"
              desc="Linked on the consent screen."
              tour="setup-privacy-url"
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.privacyPolicyUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.privacyPolicyUrl && showValidationErrors && (
                <span className="mt-1 block text-xs text-destructive">
                  {validationErrors.privacyPolicyUrl}
                </span>
              )}
            </FieldRow>

            <FieldRow
              label="Terms of service URL"
              desc="Linked on the consent screen."
              tour="setup-terms-url"
            >
              <Input
                type="url"
                placeholder="https://example.com/terms"
                value={tosPageUrl}
                onChange={(e) =>
                  updateField(setTosPageUrl, e.target.value, "tosPageUrl")
                }
                className={cn(
                  "font-mono text-xs",
                  validationErrors.tosPageUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.tosPageUrl && showValidationErrors && (
                <span className="mt-1 block text-xs text-destructive">
                  {validationErrors.tosPageUrl}
                </span>
              )}
            </FieldRow>
          </FieldCard>
        </section>


        <section className="space-y-3" data-tour-id="setup-theme">
          <SectionLabel>Theme tokens</SectionLabel>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Override the SDK design tokens for light and dark mode. Leave blank
            to use the default; fonts take a single family name.
          </p>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] items-center gap-3 border-b border-border px-5 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Token
              </p>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Light
              </p>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Dark
              </p>
            </div>
            <div className="space-y-7 px-5 py-5">
              {THEME_TOKEN_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2.5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="space-y-2">
                    {group.tokens.map((token) => (
                      <div
                        key={token.key}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] items-center gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {token.label}
                          </p>
                          <p className="truncate font-mono text-[10px] text-muted-foreground">
                            --wa-{token.key.replace(/_/g, "-")}
                          </p>
                        </div>
                        {renderTokenInput(token, "light")}
                        {renderTokenInput(token, "dark")}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section className="space-y-3" data-tour-id="setup-redirects">
          <SectionLabel>User redirects</SectionLabel>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            The Account Portal redirects users after they complete key actions.
            Defaults point at your development host — customize the paths to
            suit your needs.
          </p>
          <FieldCard>
            <FieldRow
              label="After sign-up fallback"
              desc="Where to send a user if it can't be determined from the redirect_url query parameter."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.afterSignupRedirectUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.afterSignupRedirectUrl &&
                showValidationErrors && (
                  <span className="mt-1 block text-xs text-destructive">
                    {validationErrors.afterSignupRedirectUrl}
                  </span>
                )}
            </FieldRow>

            <FieldRow
              label="After sign-in fallback"
              desc="Where to send a user if it can't be determined from the redirect_url query parameter."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.afterSigninRedirectUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.afterSigninRedirectUrl &&
                showValidationErrors && (
                  <span className="mt-1 block text-xs text-destructive">
                    {validationErrors.afterSigninRedirectUrl}
                  </span>
                )}
            </FieldRow>

            <FieldRow
              label="After logo click"
              desc="Where to send a user after they click your application's logo."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.afterLogoClickUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.afterLogoClickUrl && showValidationErrors && (
                <span className="mt-1 block text-xs text-destructive">
                  {validationErrors.afterLogoClickUrl}
                </span>
              )}
            </FieldRow>

            <FieldRow
              label="After sign-out (one session)"
              desc="Where to send a user after they sign out of the current session."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.afterSignOutOnePageUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.afterSignOutOnePageUrl &&
                showValidationErrors && (
                  <span className="mt-1 block text-xs text-destructive">
                    {validationErrors.afterSignOutOnePageUrl}
                  </span>
                )}
            </FieldRow>

            <FieldRow
              label="After sign-out (all sessions)"
              desc="Where to send a user after they sign out of all sessions."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.afterSignOutAllPageUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.afterSignOutAllPageUrl &&
                showValidationErrors && (
                  <span className="mt-1 block text-xs text-destructive">
                    {validationErrors.afterSignOutAllPageUrl}
                  </span>
                )}
            </FieldRow>

            <FieldRow
              label="After create organization"
              desc="Where to send a user after they create an organization. Leave blank to redirect to the host's root."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.afterCreateOrganizationUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.afterCreateOrganizationUrl &&
                showValidationErrors && (
                  <span className="mt-1 block text-xs text-destructive">
                    {validationErrors.afterCreateOrganizationUrl}
                  </span>
                )}
            </FieldRow>
          </FieldCard>
        </section>


        <section className="space-y-3" data-tour-id="setup-default-images">
          <SectionLabel>Default profile images</SectionLabel>
          <FieldCard>
            <FieldRow
              label="Default user profile image"
              desc="Default profile image for users who haven't uploaded one."
            >
              <div className="flex">
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
            </FieldRow>

            <FieldRow
              label="Default organization profile image"
              desc="Default profile image for organizations that haven't uploaded one."
            >
              <div className="flex">
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
            </FieldRow>

            <FieldRow
              label="Default workspace profile image"
              desc="Default profile image for workspaces that haven't uploaded one."
            >
              <div className="flex">
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
            </FieldRow>

            <FieldRow
              label="Use initials for user profile images"
              desc="Show user initials when no profile image is available."
              endAlign
            >
              <Switch
                name="use_initials_for_user_profile_image"
                checked={useInitialsForUserProfileImage}
                onCheckedChange={(checked) =>
                  updateBooleanField(setUseInitialsForUserProfileImage, checked)
                }
              />
            </FieldRow>

            <FieldRow
              label="Use initials for organization profile images"
              desc="Show organization initials when no profile image is available."
              endAlign
            >
              <Switch
                name="use_initials_for_organization_profile_image"
                checked={useInitialsForOrganizationProfileImage}
                onCheckedChange={(checked) =>
                  updateBooleanField(
                    setUseInitialsForOrganizationProfileImage,
                    checked,
                  )
                }
              />
            </FieldRow>
          </FieldCard>
        </section>

        <section className="space-y-3" data-tour-id="setup-signup-terms">
          <SectionLabel>Signup &amp; pages</SectionLabel>
          <FieldCard>
            <FieldRow
              label="Signup terms statement"
              desc="Custom terms statement shown during the signup process."
            >
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
                className={cn(
                  validationErrors.signupTermsStatement &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.signupTermsStatement &&
                showValidationErrors && (
                  <span className="mt-1 block text-xs text-destructive">
                    {validationErrors.signupTermsStatement}
                  </span>
                )}
            </FieldRow>

            <FieldRow
              label="Show signup terms statement"
              desc="Display the terms statement during the signup process."
              endAlign
            >
              <Switch
                name="signup_terms_statement_shown"
                checked={signupTermsStatementShown}
                onCheckedChange={(checked) =>
                  updateBooleanField(setSignupTermsStatementShown, checked)
                }
              />
            </FieldRow>

            <FieldRow
              label="Waitlist page URL"
              desc="URL for your application's waitlist page."
            >
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
                className={cn(
                  "font-mono text-xs",
                  validationErrors.waitlistPageUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.waitlistPageUrl && showValidationErrors && (
                <span className="mt-1 block text-xs text-destructive">
                  {validationErrors.waitlistPageUrl}
                </span>
              )}
            </FieldRow>

            <FieldRow
              label="Support page URL"
              desc="URL for your application's support or help page."
            >
              <Input
                type="url"
                placeholder="https://example.com/support"
                value={supportPageUrl}
                onChange={(e) =>
                  updateField(
                    setSupportPageUrl,
                    e.target.value,
                    "supportPageUrl",
                  )
                }
                className={cn(
                  "font-mono text-xs",
                  validationErrors.supportPageUrl &&
                    showValidationErrors &&
                    "border-destructive",
                )}
              />
              {validationErrors.supportPageUrl && showValidationErrors && (
                <span className="mt-1 block text-xs text-destructive">
                  {validationErrors.supportPageUrl}
                </span>
              )}
            </FieldRow>
          </FieldCard>
        </section>

        <section className="space-y-3">
          <SectionLabel>Preview links</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((item) => (
              <div
                key={item.index}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip open={copiedIndex === item.index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(item.demoLink, item.index)
                        }
                        disabled={!item.demoLink}
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copied!</TooltipContent>
                  </Tooltip>
                  <Button
                    size="icon"
                    onClick={() => window.open(item.demoLink, "_blank")}
                    disabled={!item.demoLink}
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

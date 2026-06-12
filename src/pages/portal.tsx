import {
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/app-spinner";
import {
  useUpdateDeploymentDisplaySettings,
  DeploymentDisplaySettingsUpdates,
} from "@/lib/api/hooks/use-update-deployment-display-settings";
import { useUploadImage } from "@/lib/api/hooks/use-upload-image";
import SavePopup from "@/components/save-popup";
import { toast } from 'sonner';

// Validation types
interface ValidationErrors {
  appName?: string;
  privacyPolicyUrl?: string;
  tosPageUrl?: string;
  afterSignupRedirectUrl?: string;
  afterSigninRedirectUrl?: string;
  afterLogoClickUrl?: string;
  afterCreateOrganizationUrl?: string;
  signupTermsStatement?: string;
  afterSignOutOnePageUrl?: string;
  afterSignOutAllPageUrl?: string;
}

type ThemeTokenKind = "color" | "length" | "font";

interface ThemeTokenMeta {
  key: string;
  label: string;
  kind: ThemeTokenKind;
  light: string;
  dark: string;
}

interface ThemeTokenGroup {
  label: string;
  tokens: ThemeTokenMeta[];
}

const THEME_TOKEN_GROUPS: ThemeTokenGroup[] = [
  {
    label: "Surfaces",
    tokens: [
      { key: "surface", label: "Surface", kind: "color", light: "#ffffff", dark: "#131318" },
      { key: "surface_subtle", label: "Surface subtle", kind: "color", light: "#fafaf8", dark: "#101015" },
      { key: "background", label: "Background", kind: "color", light: "#f5f5f2", dark: "#0d0d10" },
      { key: "canvas", label: "Canvas", kind: "color", light: "#ebebe7", dark: "#050507" },
    ],
  },
  {
    label: "Text",
    tokens: [
      { key: "text", label: "Text", kind: "color", light: "#161618", dark: "#ececef" },
      { key: "text_secondary", label: "Text secondary", kind: "color", light: "#3b3b3f", dark: "#c5c5cb" },
      { key: "text_muted", label: "Text muted", kind: "color", light: "#76767c", dark: "#8a8a92" },
      { key: "text_faint", label: "Text faint", kind: "color", light: "#a8a8ad", dark: "#57575e" },
    ],
  },
  {
    label: "Lines",
    tokens: [
      { key: "border", label: "Border", kind: "color", light: "rgba(20, 20, 22, 0.08)", dark: "rgba(255, 255, 255, 0.07)" },
      { key: "border_strong", label: "Border strong", kind: "color", light: "rgba(20, 20, 22, 0.14)", dark: "rgba(255, 255, 255, 0.14)" },
    ],
  },
  {
    label: "Brand",
    tokens: [
      { key: "primary", label: "Primary", kind: "color", light: "#6b3df5", dark: "#9277ff" },
      { key: "primary_soft", label: "Primary soft", kind: "color", light: "rgba(107, 61, 245, 0.1)", dark: "rgba(146, 119, 255, 0.16)" },
      { key: "primary_foreground", label: "Primary foreground", kind: "color", light: "#ffffff", dark: "#ffffff" },
    ],
  },
  {
    label: "Status",
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
    label: "Shape & type",
    tokens: [
      { key: "radius", label: "Radius", kind: "length", light: "6px", dark: "6px" },
      { key: "radius_lg", label: "Radius (large)", kind: "length", light: "10px", dark: "10px" },
      { key: "font_sans", label: "Font (sans)", kind: "font", light: "", dark: "" },
      { key: "font_mono", label: "Font (mono)", kind: "font", light: "", dark: "" },
    ],
  },
];

export default function PortalPage() {
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
  const [themeTokens, setThemeTokens] = useState<{
    light: Record<string, string>;
    dark: Record<string, string>;
  }>(() => ({ light: {}, dark: {} }));

  const setToken = (mode: "light" | "dark", key: string, value: string) => {
    setThemeTokens((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [key]: value },
    }));
    setIsDirty(true);
  };
  const [defaultUserProfileImageUrl, setDefaultUserProfileImageUrl] =
    useState("");
  const [
    defaultOrganizationProfileImageUrl,
    setDefaultOrganizationProfileImageUrl,
  ] = useState("");
  const [useInitialsForUserProfileImage, setUseInitialsForUserProfileImage] =
    useState(true);
  const [
    useInitialsForOrganizationProfileImage,
    setUseInitialsForOrganizationProfileImage,
  ] = useState(true);
  const [faviconImageUrl, setFaviconImageUrl] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");
  const [signupTermsStatement, setSignupTermsStatement] = useState("");
  const [signupTermsStatementShown, setSignupTermsStatementShown] =
    useState(true);
  const [afterSignOutOnePageUrl, setAfterSignOutOnePageUrl] = useState("");
  const [afterSignOutAllPageUrl, setAfterSignOutAllPageUrl] = useState("");

  const [isUploadingUserImage, setIsUploadingUserImage] = useState(false);
  const [isUploadingOrgImage, setIsUploadingOrgImage] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const userImageInputRef = useRef<HTMLInputElement>(null);
  const orgImageInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);
  const faviconImageInputRef = useRef<HTMLInputElement>(null);

  // Validation functions - memoized for better performance
  const validateUrl = useMemo(() => {
    return (url: string): string | undefined => {
      if (!url) return undefined; // Empty URLs are allowed

      // Check if it's a relative URL starting with /
      if (url.startsWith("/")) return undefined;

      // Check if it's a valid URL
      try {
        new URL(url);
        return undefined; // Return undefined if URL is valid
      } catch {
        return "Please enter a valid URL (e.g., https://example.com or /path)";
      }
    };
  }, []);

  const isValidHexColor = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const getColorPickerValue = (value?: string) => {
    if (value && isValidHexColor(value)) {
      return value;
    }

    return "#000000";
  };

  const validateField = useMemo(() => {
    return (
      fieldName: keyof ValidationErrors,
      value: string
    ): string | undefined => {
      switch (fieldName) {
        case "appName":
          return value.trim() ? undefined : "App name is required";
        case "privacyPolicyUrl":
        case "tosPageUrl":
        case "afterSignupRedirectUrl":
        case "afterSigninRedirectUrl":
        case "afterLogoClickUrl":
        case "afterCreateOrganizationUrl":
        case "afterSignOutOnePageUrl":
        case "afterSignOutAllPageUrl":
          return validateUrl(value);
        default:
          return undefined;
      }
    };
  }, [validateUrl]);

  // Validate all fields and return true if valid
  const validateAllFields = useMemo(() => {
    return (): boolean => {
      const errors: ValidationErrors = {};

      // Validate all fields
      errors.appName = validateField("appName", appName);
      errors.privacyPolicyUrl = validateField(
        "privacyPolicyUrl",
        privacyPolicyUrl
      );
      errors.tosPageUrl = validateField("tosPageUrl", tosPageUrl);
      errors.afterSignupRedirectUrl = validateField(
        "afterSignupRedirectUrl",
        afterSignupRedirectUrl
      );
      errors.afterSigninRedirectUrl = validateField(
        "afterSigninRedirectUrl",
        afterSigninRedirectUrl
      );
      errors.afterLogoClickUrl = validateField(
        "afterLogoClickUrl",
        afterLogoClickUrl
      );
      errors.afterCreateOrganizationUrl = validateField(
        "afterCreateOrganizationUrl",
        afterCreateOrganizationUrl
      );
      errors.afterSignOutOnePageUrl = validateField(
        "afterSignOutOnePageUrl",
        afterSignOutOnePageUrl
      );
      errors.afterSignOutAllPageUrl = validateField(
        "afterSignOutAllPageUrl",
        afterSignOutAllPageUrl
      );

      // Filter out undefined errors
      const filteredErrors: ValidationErrors = {};
      Object.entries(errors).forEach(([key, value]) => {
        if (value !== undefined) {
          filteredErrors[key as keyof ValidationErrors] = value;
        }
      });

      setValidationErrors(filteredErrors);
      return Object.keys(filteredErrors).length === 0;
    };
  }, [
    validateField,
    appName,
    privacyPolicyUrl,
    tosPageUrl,
    afterSignupRedirectUrl,
    afterSigninRedirectUrl,
    afterLogoClickUrl,
    afterCreateOrganizationUrl,
    afterSignOutOnePageUrl,
    afterSignOutAllPageUrl,
  ]);

  const updateField = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T,
    fieldName?: keyof ValidationErrors
  ) => {
    setter(value);
    setIsDirty(true);

    // Validate the field if fieldName is provided
    if (fieldName && typeof value === "string") {
      const error = validateField(fieldName, value);
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

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
        settings.after_create_organization_redirect_url || ""
      );
      setThemeTokens({
        light: { ...(settings.theme_tokens?.light ?? {}) },
        dark: { ...(settings.theme_tokens?.dark ?? {}) },
      });
      setDefaultUserProfileImageUrl(
        settings.default_user_profile_image_url || ""
      );
      setDefaultOrganizationProfileImageUrl(
        settings.default_organization_profile_image_url || ""
      );
      setUseInitialsForUserProfileImage(
        settings.use_initials_for_user_profile_image ?? true
      );
      setUseInitialsForOrganizationProfileImage(
        settings.use_initials_for_organization_profile_image ?? true
      );
      setFaviconImageUrl(settings.favicon_image_url || "");
      setLogoImageUrl(settings.logo_image_url || "");
      setSignupTermsStatement(settings.signup_terms_statement || "");
      setSignupTermsStatementShown(
        settings.signup_terms_statement_shown ?? true
      );
      setAfterSignOutOnePageUrl(settings.after_sign_out_one_page_url || "");
      setAfterSignOutAllPageUrl(settings.after_sign_out_all_page_url || "");
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
    {
      index: 5,
      title: "Create organization",
      desc: "Preview your application's hosted create organization flow.",
      demoLink: deploymentSettings?.ui_settings?.create_organization_url || "",
    },
  ];

  const handleCopy = (link: string, index: number): void => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
  };

  const handleOpenLink = (link: string): void => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const uploadImageMutation = useUploadImage();

  const handleUserImageUploadClick = () => {
    userImageInputRef.current?.click();
  };

  const handleOrgImageUploadClick = () => {
    orgImageInputRef.current?.click();
  };

  const validateImageFile = (file: File): string | undefined => {
    // Check if it's an image file
    if (!file.type.startsWith("image/")) {
      return "Please select an image file.";
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return `Image size exceeds 5MB. Please select a smaller image.`;
    }

    return undefined;
  };

  const handleUserFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    setIsUploadingUserImage(true);
    setIsDirty(true);

    const uploadPromise = uploadImageMutation.mutateAsync({
      imageType: "user-profile",
      file,
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading user profile image...',
      success: 'User profile image uploaded successfully!',
      error: 'Failed to upload user image.',
    });

    try {
      const imageUrl = await uploadPromise;
      setDefaultUserProfileImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading user image:", error);
    } finally {
      setIsUploadingUserImage(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleOrgFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    setIsUploadingOrgImage(true);
    setIsDirty(true);

    const uploadPromise = uploadImageMutation.mutateAsync({
      imageType: "org-profile",
      file,
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading organization profile image...',
      success: 'Organization profile image uploaded successfully!',
      error: 'Failed to upload organization image.',
    });

    try {
      const imageUrl = await uploadPromise;
      setDefaultOrganizationProfileImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading organization image:", error);
    } finally {
      setIsUploadingOrgImage(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleLogoFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    setIsUploadingLogo(true);
    setIsDirty(true);

    const uploadPromise = uploadImageMutation.mutateAsync({
      imageType: "logo",
      file,
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading logo image...',
      success: 'Logo image uploaded successfully!',
      error: 'Failed to upload logo image.',
    });

    try {
      const imageUrl = await uploadPromise;
      setLogoImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading logo image:", error);
    } finally {
      setIsUploadingLogo(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleFaviconFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    // Additional validation for favicon - should be small
    if (file.size > 1024 * 1024) {
      // 1MB
      toast.warning("Favicon should be smaller than 1MB for optimal performance.");
    }

    setIsUploadingFavicon(true);
    setIsDirty(true);

    const uploadPromise = uploadImageMutation.mutateAsync({
      imageType: "favicon",
      file,
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading favicon image...',
      success: 'Favicon image uploaded successfully!',
      error: 'Failed to upload favicon image.',
    });

    try {
      const imageUrl = await uploadPromise;
      setFaviconImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading favicon image:", error);
    } finally {
      setIsUploadingFavicon(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSaveSettings = async () => {
    // Validate all fields before saving
    const isValid = validateAllFields();
    setShowValidationErrors(true);

    if (!isValid) {
      // Show a toast with validation errors
      const errorMessages = Object.values(validationErrors).join(", ");
      toast.error(`Please fix the following errors before saving: ${errorMessages}`);
      return;
    }

    setIsSaving(true);

    try {
      const updates: DeploymentDisplaySettingsUpdates = {
        app_name: appName,
        privacy_policy_url: privacyPolicyUrl,
        tos_page_url: tosPageUrl,
        sign_in_page_url:
          deploymentSettings?.ui_settings?.sign_in_page_url || "",
        sign_up_page_url:
          deploymentSettings?.ui_settings?.sign_up_page_url || "",
        after_sign_up_page_url: "",
        after_sign_in_page_url: "",
        after_signup_redirect_url: afterSignupRedirectUrl,
        after_signin_redirect_url: afterSigninRedirectUrl,
        after_logo_click_url: afterLogoClickUrl,
        after_create_organization_redirect_url: afterCreateOrganizationUrl,
        favicon_image_url: faviconImageUrl,
        logo_image_url: logoImageUrl,
        signup_terms_statement: signupTermsStatement,
        signup_terms_statement_shown: signupTermsStatementShown,
        after_sign_out_one_page_url: afterSignOutOnePageUrl,
        after_sign_out_all_page_url: afterSignOutAllPageUrl,
        default_user_profile_image_url: defaultUserProfileImageUrl,
        default_organization_profile_image_url:
          defaultOrganizationProfileImageUrl,
        use_initials_for_user_profile_image: useInitialsForUserProfileImage,
        use_initials_for_organization_profile_image:
          useInitialsForOrganizationProfileImage,
        organization_profile_url:
          deploymentSettings?.ui_settings?.organization_profile_url || "",
        create_organization_url:
          deploymentSettings?.ui_settings?.create_organization_url || "",
        user_profile_url:
          deploymentSettings?.ui_settings?.user_profile_url || "",
        theme_tokens: { light: themeTokens.light, dark: themeTokens.dark },
      };

      await updateDisplaySettings.mutateAsync(updates);
      setIsDirty(false);
      setShowValidationErrors(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving display settings:", error);
      toast.error("Failed to save settings. Please try again.");
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
        settings.after_create_organization_redirect_url || ""
      );
      setThemeTokens({
        light: { ...(settings.theme_tokens?.light ?? {}) },
        dark: { ...(settings.theme_tokens?.dark ?? {}) },
      });
      setDefaultUserProfileImageUrl(
        settings.default_user_profile_image_url || ""
      );
      setDefaultOrganizationProfileImageUrl(
        settings.default_organization_profile_image_url || ""
      );
      setUseInitialsForUserProfileImage(
        settings.use_initials_for_user_profile_image
      );
      setUseInitialsForOrganizationProfileImage(
        settings.use_initials_for_organization_profile_image
      );
      setFaviconImageUrl(settings.favicon_image_url || "");
      setLogoImageUrl(settings.logo_image_url || "");
      setSignupTermsStatement(settings.signup_terms_statement || "");
      setSignupTermsStatementShown(settings.signup_terms_statement_shown);
      setAfterSignOutOnePageUrl(settings.after_sign_out_one_page_url || "");
      setAfterSignOutAllPageUrl(settings.after_sign_out_all_page_url || "");
    }
    // Reset validation state
    setValidationErrors({});
    setShowValidationErrors(false);
    setIsDirty(false);
  };

  return (
    <div>
      <input
        type="file"
        ref={userImageInputRef}
        onChange={handleUserFileSelected}
        accept="image/*"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={orgImageInputRef}
        onChange={handleOrgFileSelected}
        accept="image/*"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={logoImageInputRef}
        onChange={handleLogoFileSelected}
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={faviconImageInputRef}
        onChange={handleFaviconFileSelected}
        accept="image/x-icon,image/png,image/jpeg,image/gif"
        style={{ display: "none" }}
      />

      <h1 className="text-xl font-medium tracking-tight text-foreground">UI Settings</h1>

      <SavePopup
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSaveSettings}
        onCancel={handleResetSettings}
      />
      <div className="mt-8 space-y-10">
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">App Name</h3>
            <p className="text-sm text-muted-foreground">The name of your application displayed to users.</p>
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
              <span className="text-red-500 text-sm px-2">Hello</span>
            )}
          </div>
        </section>

        {/* Added Privacy Policy URL */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Privacy Policy URL</h3>
            <p className="text-sm text-muted-foreground">Link to your application's privacy policy.</p>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/privacy-policy"
              value={privacyPolicyUrl}
              onChange={(e) =>
                updateField(
                  setPrivacyPolicyUrl,
                  e.target.value,
                  "privacyPolicyUrl"
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

        {/* Added Terms of Service URL */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Terms of Service URL</h3>
            <p className="text-sm text-muted-foreground">Link to your application's terms of service.</p>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="/terms-of-service"
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

        {/* Added Logo & Favicon URLs */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Logo</h3>
            <p className="text-sm text-muted-foreground">Logo displayed on hosted pages.</p>
          </div>
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-4">
              <div className="w-15 h-15 rounded-md flex items-center justify-center overflow-hidden">
                {logoImageUrl ? (
                  <img
                    src={logoImageUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-15 h-15 border border-border rounded-full flex items-center justify-center bg-secondary overflow-hidden">
                    {" "}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => logoImageInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Change Logo"
                )}
              </Button>
            </div>
          </div>
        </section>
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Favicon</h3>
            <p className="text-sm text-muted-foreground">Favicon used by hosted pages.</p>
          </div>
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-4">
              <div className="w-15 h-15 rounded-md flex items-center justify-center overflow-hidden">
                {faviconImageUrl ? (
                  <img
                    src={faviconImageUrl}
                    alt="Favicon"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-15 h-15 border border-border rounded-full flex items-center justify-center bg-secondary overflow-hidden">
                    {" "}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => faviconImageInputRef.current?.click()}
                disabled={isUploadingFavicon}
              >
                {isUploadingFavicon ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Change Logo"
                )}
              </Button>
            </div>
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Page Previews</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Preview the hosted pages for your application. These links use
              your configured settings.
            </p>
          </div>
        </section>
        {data.map((item, index) => (
          <section key={index} className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <div className="relative flex items-center gap-3">
              <Input
                type="text"
                value={item.demoLink}
                className="w-full"
                readOnly
              />
              <div className="flex gap-1">
                <Tooltip open={copiedIndex === index}>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleCopy(item.demoLink, index)}
                      className="p-2"
                      variant="outline"
                    >
                      <ClipboardIcon className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copied!</TooltipContent>
                </Tooltip>
                <Button
                  onClick={() => handleOpenLink(item.demoLink)}
                  className="p-2"
                  variant="outline"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </section>
        ))}

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">User redirects</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              The Account Portal requires a destination to redirect your users
              after they complete key actions. By default, we've set your
              development host, but you can customize the paths to suit your
              needs.
            </p>
          </div>
        </section>

        {/* Mapped User Redirects */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">After sign-up fallback</h3>
            <p className="text-sm text-muted-foreground">
              Specify where to send a user if it cannot be determined from the
              redirect_url query parameter.
            </p>
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
                  "afterSignupRedirectUrl"
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
            <h3 className="text-sm font-medium text-foreground">After sign-in fallback</h3>
            <p className="text-sm text-muted-foreground">
              Specify where to send a user if it cannot be determined from the
              redirect_url query parameter.
            </p>
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
                  "afterSigninRedirectUrl"
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
            <h3 className="text-sm font-medium text-foreground">After logo click</h3>
            <p className="text-sm text-muted-foreground">
              Specify where to send a user after they click your application's
              logo.
            </p>
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
                  "afterLogoClickUrl"
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
            <h3 className="text-sm font-medium text-foreground">After sign-out (one session)</h3>
            <p className="text-sm text-muted-foreground">
              Specify where to send a user after they sign out of the current
              session.
            </p>
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
                  "afterSignOutOnePageUrl"
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
            <h3 className="text-sm font-medium text-foreground">After sign-out (all sessions)</h3>
            <p className="text-sm text-muted-foreground">
              Specify where to send a user after they sign out of all sessions.
            </p>
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
                  "afterSignOutAllPageUrl"
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

        {/* Mapped Organization Redirects */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">After create organization</h3>
            <p className="text-sm text-muted-foreground">
              Specify where to send a user after they create an organization.
              (Leave blank to redirect to the host's root.)
            </p>
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
                  "afterCreateOrganizationUrl"
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
        {/* Removed "After leave organization" section */}

        <div className="my-8 border-t border-border" />

        {/* Profile Images Section */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Profile Images</span>
            </h3>
            <p className="text-sm text-muted-foreground">Configure default profile images and fallback behavior.</p>
          </div>
        </section>
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Use Initials for User Profile Image</h3>
            <p className="text-sm text-muted-foreground">Fallback to user initials if no image is available.</p>
          </div>
          <div className="flex justify-end items-center gap-3">
            <Switch
              checked={useInitialsForUserProfileImage}
              onCheckedChange={(value) =>
                updateField(setUseInitialsForUserProfileImage, value)
              }
            />
          </div>
        </section>

        {!useInitialsForUserProfileImage && (
          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Default User Profile Image</h3>
              <p className="text-sm text-muted-foreground">Image used when initials are disabled.</p>
            </div>
            <div className="flex justify-end items-center">
              <div className="flex items-center gap-4">
                <div className="w-15 h-15 rounded-md flex items-center justify-center overflow-hidden">
                  {defaultUserProfileImageUrl ? (
                    <img
                      src={defaultUserProfileImageUrl}
                      alt="User Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-15 h-15 border border-border rounded-full flex items-center justify-center bg-secondary overflow-hidden">
                      {" "}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleUserImageUploadClick}
                  disabled={isUploadingUserImage}
                >
                  {isUploadingUserImage ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    "Change Logo"
                  )}
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Use Initials for Org Profile Image</h3>
            <p className="text-sm text-muted-foreground">
              Fallback to organization initials if no image is available.
            </p>
          </div>
          <div className="flex justify-end items-center gap-3">
            <Switch
              checked={useInitialsForOrganizationProfileImage}
              onCheckedChange={(value) =>
                updateField(setUseInitialsForOrganizationProfileImage, value)
              }
            />
          </div>
        </section>

        {!useInitialsForOrganizationProfileImage && (
          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Default Organization Profile Image</h3>
              <p className="text-sm text-muted-foreground">Image used when initials are disabled.</p>
            </div>
            <div className="flex justify-end items-center">
              <div className="flex items-center gap-4">
                <div className="w-15 h-15 rounded-md flex items-center justify-center overflow-hidden">
                  {defaultOrganizationProfileImageUrl ? (
                    <img
                      src={defaultOrganizationProfileImageUrl}
                      alt="Organization Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-15 h-15 border border-border rounded-full flex items-center justify-center bg-secondary overflow-hidden">
                      {" "}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleOrgImageUploadClick}
                  disabled={isUploadingOrgImage}
                >
                  {isUploadingOrgImage ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    "Change Logo"
                  )}
                </Button>
              </div>
            </div>
          </section>
        )}

        <div className="my-8 border-t border-border" />

        {/* Signup Terms Section */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Sign-up Terms</span>
            </h3>
            <p className="text-sm text-muted-foreground">Customize the terms statement shown during sign-up.</p>
          </div>
        </section>
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">Sign-up Terms Statement</h3>
            <p className="text-sm text-muted-foreground">
              The text displayed (links to ToS/Privacy Policy are automatic).
            </p>
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="I agree to the terms..."
              value={signupTermsStatement}
              onChange={(e) =>
                updateField(
                  setSignupTermsStatement,
                  e.target.value,
                  "signupTermsStatement"
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
            <h3 className="text-sm font-medium text-foreground">Show Sign-up Terms Statement</h3>
            <p className="text-sm text-muted-foreground">Whether to display the terms statement during sign-up.</p>
          </div>
          <div className="flex justify-end items-center gap-3">
            <Switch
              checked={signupTermsStatementShown}
              onCheckedChange={(value) =>
                updateField(setSignupTermsStatementShown, value)
              }
            />
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Theme tokens</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Override the SDK's design tokens for light and dark mode. Leave a
              field blank to use the default.
            </p>
          </div>
        </section>

        <div className="space-y-8">
          {THEME_TOKEN_GROUPS.map((group) => (
            <div key={group.label} className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">{group.label}</h3>
              <div className="space-y-4">
                {group.tokens.map((token) => {
                  const lightValue = themeTokens.light[token.key] ?? "";
                  const darkValue = themeTokens.dark[token.key] ?? "";
                  return (
                    <div
                      key={token.key}
                      className="grid gap-x-8 gap-y-3 sm:grid-cols-3 items-center"
                    >
                      <span className="text-sm text-foreground">{token.label}</span>
                      <div className="space-y-2 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                        <div className="flex items-center gap-2">
                          {token.kind === "color" && (
                            <input
                              type="color"
                              value={getColorPickerValue(lightValue || token.light)}
                              onChange={(e) =>
                                setToken("light", token.key, e.target.value)
                              }
                              className="h-9 w-9 shrink-0 rounded-md border border-border p-0 bg-transparent cursor-pointer"
                              aria-label={`${token.label} (light)`}
                            />
                          )}
                          <Input
                            value={lightValue}
                            placeholder={
                              token.light ||
                              (token.kind === "font"
                                ? "System default — enter one font family"
                                : "")
                            }
                            onChange={(e) =>
                              setToken("light", token.key, e.target.value)
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {token.kind === "color" && (
                            <input
                              type="color"
                              value={getColorPickerValue(darkValue || token.dark)}
                              onChange={(e) =>
                                setToken("dark", token.key, e.target.value)
                              }
                              className="h-9 w-9 shrink-0 rounded-md border border-border p-0 bg-transparent cursor-pointer"
                              aria-label={`${token.label} (dark)`}
                            />
                          )}
                          <Input
                            value={darkValue}
                            placeholder={
                              token.dark ||
                              (token.kind === "font"
                                ? "System default — enter one font family"
                                : "")
                            }
                            onChange={(e) =>
                              setToken("dark", token.key, e.target.value)
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

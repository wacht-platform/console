import { Heading, Subheading } from "@/components/ui/heading";
import { Strong, Text } from "@/components/ui/text";
import {
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Divider } from "@/components/ui/divider";
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
  primaryColor?: string;
  backgroundColor?: string;
  darkModePrimaryColor?: string;
  darkModeBackgroundColor?: string;
  signupTermsStatement?: string;
  afterSignOutOnePageUrl?: string;
  afterSignOutAllPageUrl?: string;
}

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
  const [primaryColor, setPrimaryColor] = useState("oklch(0.205 0 0)");
  const [backgroundColor, setBackgroundColor] = useState("oklch(1 0 0)");
  const [darkModePrimaryColor, setDarkModePrimaryColor] = useState("oklch(0.87 0 0)");
  const [darkModeBackgroundColor, setDarkModeBackgroundColor] =
    useState("oklch(0.145 0 0)");
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
  const primaryColorInputRef = useRef<HTMLInputElement>(null);
  const backgroundColorInputRef = useRef<HTMLInputElement>(null);
  const darkModePrimaryColorInputRef = useRef<HTMLInputElement>(null);
  const darkModeBackgroundColorInputRef = useRef<HTMLInputElement>(null);

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

  const validateColor = useMemo(() => {
    return (color: string): string | undefined => {
      if (!color) return "Color is required";

      const cssColorRegex =
        /^(#([A-Fa-f0-9]{3,8})|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lch\([^)]*\)|lab\([^)]*\)|transparent|currentColor)$/i;
      if (!cssColorRegex.test(color.trim())) {
        return "Please enter a valid CSS color";
      }
      return undefined;
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
        case "primaryColor":
        case "backgroundColor":
        case "darkModePrimaryColor":
        case "darkModeBackgroundColor":
          return validateColor(value);
        default:
          return undefined;
      }
    };
  }, [validateUrl, validateColor]);

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
      errors.primaryColor = validateField("primaryColor", primaryColor);
      errors.backgroundColor = validateField(
        "backgroundColor",
        backgroundColor
      );
      errors.darkModePrimaryColor = validateField(
        "darkModePrimaryColor",
        darkModePrimaryColor
      );
      errors.darkModeBackgroundColor = validateField(
        "darkModeBackgroundColor",
        darkModeBackgroundColor
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
    primaryColor,
    backgroundColor,
    darkModePrimaryColor,
    darkModeBackgroundColor,
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
      setPrimaryColor(
        settings.light_mode_settings?.primary_color || "oklch(0.205 0 0)"
      );
      setBackgroundColor(
        settings.light_mode_settings?.background_color || "oklch(1 0 0)"
      );
      setDarkModePrimaryColor(
        settings.dark_mode_settings?.primary_color || "oklch(0.87 0 0)"
      );
      setDarkModeBackgroundColor(
        settings.dark_mode_settings?.background_color || "oklch(0.145 0 0)"
      );
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
        light_mode_settings: {
          primary_color: primaryColor,
          background_color: backgroundColor,
          text_color:
            deploymentSettings?.ui_settings?.light_mode_settings?.text_color ||
            "#1E293B",
          token_overrides:
            deploymentSettings?.ui_settings?.light_mode_settings
              ?.token_overrides,
        },
        dark_mode_settings: {
          primary_color: darkModePrimaryColor,
          background_color: darkModeBackgroundColor,
          text_color:
            deploymentSettings?.ui_settings?.dark_mode_settings?.text_color ||
            "#F5F5F5",
          token_overrides:
            deploymentSettings?.ui_settings?.dark_mode_settings
              ?.token_overrides,
        },
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
      setPrimaryColor(
        settings.light_mode_settings?.primary_color || "oklch(0.205 0 0)"
      );
      setBackgroundColor(
        settings.light_mode_settings?.background_color || "oklch(1 0 0)"
      );
      setDarkModePrimaryColor(
        settings.dark_mode_settings?.primary_color || "oklch(0.87 0 0)"
      );
      setDarkModeBackgroundColor(
        settings.dark_mode_settings?.background_color || "oklch(0.145 0 0)"
      );
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

      <Heading>UI Settings</Heading>

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
              <span className="text-red-500 text-sm px-2">Hello</span>
            )}
          </div>
        </section>

        {/* Added Privacy Policy URL */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Privacy Policy URL</Subheading>
            <Text>Link to your application's privacy policy.</Text>
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
            <Subheading>Terms of Service URL</Subheading>
            <Text>Link to your application's terms of service.</Text>
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
            <Subheading>Logo</Subheading>
            <Text>Logo displayed on hosted pages.</Text>
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
                  <div className="w-15 h-15 border border-gray-200 rounded-full flex items-center justify-center bg-gray-50 overflow-hidden">
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
            <Subheading>Favicon</Subheading>
            <Text>Favicon used by hosted pages.</Text>
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
                  <div className="w-15 h-15 border border-gray-200 rounded-full flex items-center justify-center bg-gray-50 overflow-hidden">
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

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>
              <Strong>Page Previews</Strong>
            </Subheading>
            <Text>
              Preview the hosted pages for your application. These links use
              your configured settings.
            </Text>
          </div>
        </section>
        {data.map((item, index) => (
          <section key={index} className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading>{item.title}</Subheading>
              <Text>{item.desc}</Text>
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

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>
              <Strong>User redirects</Strong>
            </Subheading>
            <Text>
              The Account Portal requires a destination to redirect your users
              after they complete key actions. By default, we've set your
              development host, but you can customize the paths to suit your
              needs.
            </Text>
          </div>
        </section>

        {/* Mapped User Redirects */}
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

        <Divider className="my-8" soft />

        {/* Profile Images Section */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>
              <Strong>Profile Images</Strong>
            </Subheading>
            <Text>Configure default profile images and fallback behavior.</Text>
          </div>
        </section>
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Use Initials for User Profile Image</Subheading>
            <Text>Fallback to user initials if no image is available.</Text>
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
              <Subheading>Default User Profile Image</Subheading>
              <Text>Image used when initials are disabled.</Text>
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
                    <div className="w-15 h-15 border border-gray-200 rounded-full flex items-center justify-center bg-gray-50 overflow-hidden">
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
            <Subheading>Use Initials for Org Profile Image</Subheading>
            <Text>
              Fallback to organization initials if no image is available.
            </Text>
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
              <Subheading>Default Organization Profile Image</Subheading>
              <Text>Image used when initials are disabled.</Text>
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
                    <div className="w-15 h-15 border border-gray-200 rounded-full flex items-center justify-center bg-gray-50 overflow-hidden">
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

        <Divider className="my-8" soft />

        {/* Signup Terms Section */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>
              <Strong>Sign-up Terms</Strong>
            </Subheading>
            <Text>Customize the terms statement shown during sign-up.</Text>
          </div>
        </section>
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Sign-up Terms Statement</Subheading>
            <Text>
              The text displayed (links to ToS/Privacy Policy are automatic).
            </Text>
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
            <Subheading>Show Sign-up Terms Statement</Subheading>
            <Text>Whether to display the terms statement during sign-up.</Text>
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

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>
              <Strong>Colors (Light / Dark Mode)</Strong>
            </Subheading>
            <Text>
              Set colors for both light and dark mode versions of your Account
              Portal.
            </Text>
          </div>
        </section>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          <section className="space-y-3">
            <Subheading>Primary Color (Light)</Subheading>
            <div className="flex items-center gap-4">
              <div
                style={{ backgroundColor: primaryColor }}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md p-0"
                onClick={() => primaryColorInputRef.current?.click()}
              />
              <input
                ref={primaryColorInputRef}
                type="color"
                value={getColorPickerValue(primaryColor)}
                onChange={(e) =>
                  updateField(setPrimaryColor, e.target.value, "primaryColor")
                }
                style={{ display: "none" }}
              />
              <div className="flex flex-col w-full">
                <Input
                  readOnly
                  value={primaryColor}
                  className={`font-medium ${validationErrors.primaryColor && showValidationErrors
                    ? "border-red-500"
                    : ""
                    }`}
                />
                {validationErrors.primaryColor && showValidationErrors && (
                  <span className="text-red-500 text-sm mt-1">
                    {validationErrors.primaryColor}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{ backgroundColor: primaryColor }}
              className="h-8 w-full rounded-md"
            ></div>
          </section>

          <section className="space-y-3">
            <Subheading>Primary Color (Dark)</Subheading>
            <div className="flex items-center gap-4">
              <div
                style={{ backgroundColor: darkModePrimaryColor }}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md p-0"
                onClick={() => darkModePrimaryColorInputRef.current?.click()}
              />
              <input
                ref={darkModePrimaryColorInputRef}
                type="color"
                value={getColorPickerValue(darkModePrimaryColor)}
                onChange={(e) =>
                  updateField(
                    setDarkModePrimaryColor,
                    e.target.value,
                    "darkModePrimaryColor"
                  )
                }
                style={{ display: "none" }}
              />
              <div className="flex flex-col w-full">
                <Input
                  readOnly
                  value={darkModePrimaryColor}
                  className={`font-medium ${validationErrors.darkModePrimaryColor &&
                    showValidationErrors
                    ? "border-red-500"
                    : ""
                    }`}
                />
                {validationErrors.darkModePrimaryColor &&
                  showValidationErrors && (
                    <span className="text-red-500 text-sm mt-1">
                      {validationErrors.darkModePrimaryColor}
                    </span>
                  )}
              </div>
            </div>
            <div
              style={{ backgroundColor: darkModePrimaryColor }}
              className="h-8 w-full rounded-md"
            ></div>
          </section>

          <section className="space-y-3">
            <Subheading>Background Color (Light)</Subheading>
            <div className="flex items-center gap-4">
              <div
                style={{ backgroundColor: backgroundColor }}
                className="h-10 w-10 shrink-0 cursor-pointer border border-gray-200 rounded-md p-0"
                onClick={() => backgroundColorInputRef.current?.click()}
              />
              <input
                ref={backgroundColorInputRef}
                type="color"
                value={getColorPickerValue(backgroundColor)}
                onChange={(e) =>
                  updateField(
                    setBackgroundColor,
                    e.target.value,
                    "backgroundColor"
                  )
                }
                style={{ display: "none" }}
              />
              <div className="flex flex-col w-full">
                <Input
                  readOnly
                  value={backgroundColor}
                  className={`font-medium ${validationErrors.backgroundColor && showValidationErrors
                    ? "border-red-500"
                    : ""
                    }`}
                />
                {validationErrors.backgroundColor && showValidationErrors && (
                  <span className="text-red-500 text-sm mt-1">
                    {validationErrors.backgroundColor}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{ backgroundColor: backgroundColor }}
              className="h-8 w-full rounded-md"
            ></div>
          </section>

          <section className="space-y-3">
            <Subheading>Background Color (Dark)</Subheading>
            <div className="flex items-center gap-4">
              <div
                style={{ backgroundColor: darkModeBackgroundColor }}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md p-0"
                onClick={() => darkModeBackgroundColorInputRef.current?.click()}
              />
              <input
                ref={darkModeBackgroundColorInputRef}
                type="color"
                value={getColorPickerValue(darkModeBackgroundColor)}
                onChange={(e) =>
                  updateField(
                    setDarkModeBackgroundColor,
                    e.target.value,
                    "darkModeBackgroundColor"
                  )
                }
                style={{ display: "none" }}
              />
              <div className="flex flex-col w-full">
                <Input
                  readOnly
                  value={darkModeBackgroundColor}
                  className={`font-medium ${validationErrors.darkModeBackgroundColor &&
                    showValidationErrors
                    ? "border-red-500"
                    : ""
                    }`}
                />
                {validationErrors.darkModeBackgroundColor &&
                  showValidationErrors && (
                    <span className="text-red-500 text-sm mt-1">
                      {validationErrors.darkModeBackgroundColor}
                    </span>
                  )}
              </div>
            </div>
            <div
              style={{ backgroundColor: darkModeBackgroundColor }}
              className="h-8 w-full rounded-md"
            ></div>
          </section>
        </div>
      </div>
    </div>
  );
}

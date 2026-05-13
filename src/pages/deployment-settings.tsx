import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Divider } from "@/components/ui/divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

import { InlineLoader } from "@/components/ui/loading-screen";
import {
  useUpdateDeploymentDisplaySettings,
  DeploymentDisplaySettingsUpdates,
} from "@/lib/api/hooks/use-update-deployment-display-settings";
import SavePopup from "@/components/save-popup";
import { ImageUpload } from "@/components/ui/image-upload";
import type { UITokenOverrides } from "@/types/deployment";

const SDK_LIGHT_THEME_DEFAULTS = {
  text_color: "oklch(0.145 0 0)",
  token_overrides: {
    card: "oklch(1 0 0)",
    card_foreground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popover_foreground: "oklch(0.145 0 0)",
    primary_foreground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondary_foreground: "oklch(0.205 0 0)",
    accent: "oklch(0.97 0 0)",
    accent_foreground: "oklch(0.205 0 0)",
    ring: "oklch(0.708 0 0)",
    foreground: "oklch(0.145 0 0)",
    secondary_text: "oklch(0.556 0 0)",
    muted: "oklch(0.556 0 0)",
    border: "oklch(0.922 0 0)",
    border_hover: "oklch(0.922 0 0)",
    divider: "oklch(0.922 0 0)",
    input_background: "oklch(1 0 0)",
    input_border: "oklch(0.922 0 0)",
    input_focus_border: "oklch(0.708 0 0)",
    background_subtle: "oklch(0.97 0 0)",
    background_hover: "oklch(0.97 0 0)",
    primary_hover: "oklch(0.205 0 0)",
    error: "#EF4444",
    error_background: "rgba(239, 68, 68, 0.1)",
    error_border: "rgba(239, 68, 68, 0.2)",
    warning: "#854D0E",
    warning_background: "#FEF9C3",
    warning_border: "#FEF08A",
    warning_text: "#92400E",
    success: "#166534",
    success_background: "#DCFCE7",
    success_border: "rgba(34, 197, 94, 0.3)",
    info: "#3B82F6",
    info_background: "#DBEAFE",
  } satisfies UITokenOverrides,
};

const SDK_DARK_THEME_DEFAULTS = {
  text_color: "oklch(0.985 0 0)",
  token_overrides: {
    card: "oklch(0.24 0 0)",
    card_foreground: "oklch(0.985 0 0)",
    popover: "oklch(0.24 0 0)",
    popover_foreground: "oklch(0.985 0 0)",
    primary_foreground: "oklch(0.205 0 0)",
    secondary: "oklch(0.28 0 0)",
    secondary_foreground: "oklch(0.985 0 0)",
    accent: "oklch(0.371 0 0)",
    accent_foreground: "oklch(0.985 0 0)",
    ring: "oklch(0.556 0 0)",
    foreground: "oklch(0.985 0 0)",
    secondary_text: "oklch(0.708 0 0)",
    muted: "oklch(0.708 0 0)",
    border: "oklch(1 0 0 / 10%)",
    border_hover: "oklch(1 0 0 / 15%)",
    divider: "oklch(1 0 0 / 10%)",
    input_background: "oklch(0.24 0 0)",
    input_border: "oklch(1 0 0 / 15%)",
    input_focus_border: "oklch(0.556 0 0)",
    background_subtle: "oklch(0.24 0 0)",
    background_hover: "oklch(0.28 0 0)",
    primary_hover: "oklch(0.87 0 0)",
    error: "#F87171",
    error_background: "rgba(248, 113, 113, 0.1)",
    error_border: "rgba(248, 113, 113, 0.3)",
    warning: "#FBBF24",
    warning_background: "rgba(251, 191, 36, 0.1)",
    warning_border: "rgba(251, 191, 36, 0.3)",
    warning_text: "#FBBF24",
    success: "#22C55E",
    success_background: "rgba(34, 197, 94, 0.1)",
    success_border: "rgba(34, 197, 94, 0.3)",
    info: "#60A5FA",
    info_background: "rgba(96, 165, 250, 0.1)",
  } satisfies UITokenOverrides,
};

const SDK_GLOBAL_TOKEN_DEFAULTS = {
  space_unit: "2px",
  radius_2xs: "4px",
  radius_xs: "6px",
  radius_md: "8px",
  radius_lg: "12px",
  radius_xl: "16px",
  radius_2xl: "20px",
  radius_full: "9999px",
  border_width_thin: "0.5px",
  border_width_regular: "2px",
  space_0u: "0px",
  space_1u: "2px",
  space_2u: "4px",
  space_3u: "6px",
  space_4u: "8px",
  space_5u: "10px",
  space_6u: "12px",
  space_7u: "14px",
  space_8u: "16px",
  space_10u: "20px",
  space_12u: "24px",
  space_14u: "28px",
  space_16u: "32px",
  space_24u: "48px",
  font_size_2xs: "10px",
  font_size_xs: "11px",
  font_size_sm: "12px",
  font_size_md: "13px",
  font_size_lg: "14px",
  font_size_xl: "16px",
  font_size_2xl: "18px",
  font_size_3xl: "20px",
  size_8u: "16px",
  size_10u: "20px",
  size_12u: "24px",
  size_18u: "36px",
  size_20u: "40px",
  size_24u: "48px",
  size_32u: "64px",
  size_36u: "72px",
  size_40u: "80px",
  size_45u: "90px",
  size_50u: "100px",
  shadow_sm: "0 1px 2px var(--color-shadow-light)",
  shadow_md: "0 2px 8px var(--color-shadow)",
  shadow_lg: "0 8px 24px var(--color-shadow)",
  shadow_xl: "0 16px 40px var(--color-shadow-medium)",
  ring_primary: "0 0 0 3px color-mix(in srgb, var(--color-ring) 35%, transparent)",
  letter_spacing_tight: "0.5px",
} satisfies UITokenOverrides;

type ThemeOverrideDefaults = typeof SDK_LIGHT_THEME_DEFAULTS.token_overrides;
type ThemeTokenKey = keyof ThemeOverrideDefaults;
type GlobalTokenKey = keyof typeof SDK_GLOBAL_TOKEN_DEFAULTS;

const TOKEN_OVERRIDE_FIELDS: Array<{
  key: ThemeTokenKey;
  label: string;
  description: string;
  kind: "color" | "length";
}> = [
  { key: "card", label: "Card", description: "Background for elevated card surfaces.", kind: "color" },
  { key: "card_foreground", label: "Card Foreground", description: "Text and icon color on card surfaces.", kind: "color" },
  { key: "popover", label: "Popover", description: "Background for dropdowns, dialogs, and overlays.", kind: "color" },
  { key: "popover_foreground", label: "Popover Foreground", description: "Text and icon color on popovers and overlays.", kind: "color" },
  { key: "primary_foreground", label: "Primary Foreground", description: "Text and icon color on primary actions.", kind: "color" },
  { key: "secondary", label: "Secondary", description: "Secondary surface color for subtle controls and panels.", kind: "color" },
  { key: "secondary_foreground", label: "Secondary Foreground", description: "Text and icon color on secondary surfaces.", kind: "color" },
  { key: "accent", label: "Accent", description: "Interactive surface color for hover and selected states.", kind: "color" },
  { key: "accent_foreground", label: "Accent Foreground", description: "Text and icon color on accent surfaces.", kind: "color" },
  { key: "ring", label: "Ring", description: "Focus ring and highlight color used around active controls.", kind: "color" },
  { key: "foreground", label: "Foreground", description: "Primary surface text color.", kind: "color" },
  { key: "secondary_text", label: "Secondary Text", description: "Muted text color for labels and helper copy.", kind: "color" },
  { key: "muted", label: "Muted", description: "Muted copy and secondary emphasis color.", kind: "color" },
  { key: "border", label: "Border", description: "Default border color for cards and controls.", kind: "color" },
  { key: "border_hover", label: "Border Hover", description: "Border color for hover states.", kind: "color" },
  { key: "divider", label: "Divider", description: "Section divider and rule color.", kind: "color" },
  { key: "input_background", label: "Input Background", description: "Background color for inputs and selects.", kind: "color" },
  { key: "input_border", label: "Input Border", description: "Border color for inputs and selects.", kind: "color" },
  { key: "input_focus_border", label: "Input Focus Border", description: "Focus ring/border color for inputs.", kind: "color" },
  { key: "background_subtle", label: "Subtle Background", description: "Muted surface background for secondary panels.", kind: "color" },
  { key: "background_hover", label: "Hover Background", description: "Surface hover background color.", kind: "color" },
  { key: "primary_hover", label: "Primary Hover", description: "Hover color for primary actions.", kind: "color" },
  { key: "error", label: "Error", description: "Base error text/accent color.", kind: "color" },
  { key: "error_background", label: "Error Background", description: "Error surface background color.", kind: "color" },
  { key: "error_border", label: "Error Border", description: "Error border color.", kind: "color" },
  { key: "warning", label: "Warning", description: "Base warning text/accent color.", kind: "color" },
  { key: "warning_background", label: "Warning Background", description: "Warning surface background color.", kind: "color" },
  { key: "warning_border", label: "Warning Border", description: "Warning border color.", kind: "color" },
  { key: "warning_text", label: "Warning Text", description: "Warning label text color.", kind: "color" },
  { key: "success", label: "Success", description: "Base success text/accent color.", kind: "color" },
  { key: "success_background", label: "Success Background", description: "Success surface background color.", kind: "color" },
  { key: "success_border", label: "Success Border", description: "Success border color.", kind: "color" },
  { key: "info", label: "Info", description: "Base informational accent color.", kind: "color" },
  { key: "info_background", label: "Info Background", description: "Informational surface background color.", kind: "color" },
];

const GLOBAL_TOKEN_FIELDS: Array<{
  key: GlobalTokenKey;
  label: string;
  description: string;
  kind: "length" | "css";
}> = [
  { key: "radius_2xs", label: "Corner Radius 2XS", description: "Smallest corner treatment used in the UI.", kind: "length" },
  { key: "radius_xs", label: "Corner Radius XS", description: "Extra-small corner treatment.", kind: "length" },
  { key: "radius_md", label: "Corner Radius MD", description: "Default corner radius for inputs and smaller surfaces.", kind: "length" },
  { key: "radius_lg", label: "Corner Radius LG", description: "Larger corner radius for cards and panels.", kind: "length" },
  { key: "radius_xl", label: "Corner Radius XL", description: "Extra-large corner radius for prominent surfaces.", kind: "length" },
  { key: "radius_2xl", label: "Corner Radius 2XL", description: "Largest standard corner radius.", kind: "length" },
  { key: "radius_full", label: "Fully Rounded Radius", description: "Used for pills, badges, and circular elements.", kind: "length" },
  { key: "border_width_thin", label: "Border Width Thin", description: "Standard thin border width.", kind: "length" },
  { key: "border_width_regular", label: "Border Width Regular", description: "Heavier border width for emphasized surfaces.", kind: "length" },
  { key: "font_size_2xs", label: "Font Size 2XS", description: "Smallest text size.", kind: "length" },
  { key: "font_size_xs", label: "Font Size XS", description: "Extra-small text size.", kind: "length" },
  { key: "font_size_sm", label: "Font Size SM", description: "Small text size.", kind: "length" },
  { key: "font_size_md", label: "Font Size MD", description: "Default body text size.", kind: "length" },
  { key: "font_size_lg", label: "Font Size LG", description: "Large text size.", kind: "length" },
  { key: "font_size_xl", label: "Font Size XL", description: "Extra-large text size.", kind: "length" },
  { key: "font_size_2xl", label: "Font Size 2XL", description: "Heading text size.", kind: "length" },
  { key: "font_size_3xl", label: "Font Size 3XL", description: "Largest heading text size.", kind: "length" },
  { key: "size_8u", label: "Control Size 8u", description: "Small reusable control size.", kind: "length" },
  { key: "size_10u", label: "Control Size 10u", description: "Compact control size.", kind: "length" },
  { key: "size_12u", label: "Control Size 12u", description: "Small button and input size.", kind: "length" },
  { key: "size_18u", label: "Control Size 18u", description: "Standard compact action height.", kind: "length" },
  { key: "size_20u", label: "Control Size 20u", description: "Default larger control height.", kind: "length" },
  { key: "size_24u", label: "Control Size 24u", description: "Large control or panel anchor size.", kind: "length" },
  { key: "size_32u", label: "Control Size 32u", description: "Large reusable size token.", kind: "length" },
  { key: "size_36u", label: "Control Size 36u", description: "Expanded reusable size token.", kind: "length" },
  { key: "size_40u", label: "Control Size 40u", description: "Large reusable container size.", kind: "length" },
  { key: "size_45u", label: "Control Size 45u", description: "Extra-large reusable size token.", kind: "length" },
  { key: "size_50u", label: "Control Size 50u", description: "Largest reusable size token in the system.", kind: "length" },
  { key: "shadow_sm", label: "Shadow Small", description: "Compact elevation shadow used on low-elevation elements.", kind: "css" },
  { key: "shadow_md", label: "Shadow Medium", description: "Default elevation shadow for popovers and panels.", kind: "css" },
  { key: "shadow_lg", label: "Shadow Large", description: "Large elevation shadow for prominent floating surfaces.", kind: "css" },
  { key: "shadow_xl", label: "Shadow XL", description: "Strongest elevation shadow for the most prominent layers.", kind: "css" },
  { key: "ring_primary", label: "Primary Ring", description: "Focus ring recipe used around active interactive controls.", kind: "css" },
  { key: "letter_spacing_tight", label: "Tight Letter Spacing", description: "Used for compact labels and tighter heading treatment.", kind: "length" },
];

type ThemeTokenField = (typeof TOKEN_OVERRIDE_FIELDS)[number];
type GlobalTokenField = (typeof GLOBAL_TOKEN_FIELDS)[number];

const GLOBAL_TOKEN_GROUPS = [
  {
    title: "Shape",
    description: "Corners and border thickness used across the interface.",
    keys: [
      "radius_2xs",
      "radius_xs",
      "radius_md",
      "radius_lg",
      "radius_xl",
      "radius_2xl",
      "radius_full",
      "border_width_thin",
      "border_width_regular",
    ] as Array<keyof UITokenOverrides>,
  },
  {
    title: "Typography",
    description: "Shared text sizing and letter spacing.",
    keys: [
      "font_size_2xs",
      "font_size_xs",
      "font_size_sm",
      "font_size_md",
      "font_size_lg",
      "font_size_xl",
      "font_size_2xl",
      "font_size_3xl",
      "letter_spacing_tight",
    ] as Array<keyof UITokenOverrides>,
  },
  {
    title: "Control Sizes",
    description: "Reusable size tokens for buttons, inputs, and other controls.",
    keys: [
      "size_8u",
      "size_10u",
      "size_12u",
      "size_18u",
      "size_20u",
      "size_24u",
      "size_32u",
      "size_36u",
      "size_40u",
      "size_45u",
      "size_50u",
    ] as Array<keyof UITokenOverrides>,
  },
  {
    title: "Effects",
    description: "Elevation and focus treatments shared across the interface.",
    keys: [
      "shadow_sm",
      "shadow_md",
      "shadow_lg",
      "shadow_xl",
      "ring_primary",
    ] as Array<keyof UITokenOverrides>,
  },
];

const THEME_TOKEN_GROUPS = [
  {
    title: "Surface",
    description: "Core surface, border, and input colors.",
    keys: [
      "card",
      "card_foreground",
      "popover",
      "popover_foreground",
      "primary_foreground",
      "secondary",
      "secondary_foreground",
      "accent",
      "accent_foreground",
      "ring",
      "foreground",
      "secondary_text",
      "muted",
      "border",
      "border_hover",
      "divider",
      "input_background",
      "input_border",
      "input_focus_border",
      "background_subtle",
      "background_hover",
      "primary_hover",
    ] as Array<keyof UITokenOverrides>,
  },
  {
    title: "Status",
    description: "Feedback colors for success, warning, error, and info states.",
    keys: [
      "error",
      "error_background",
      "error_border",
      "warning",
      "warning_background",
      "warning_border",
      "warning_text",
      "success",
      "success_background",
      "success_border",
      "info",
      "info_background",
    ] as Array<keyof UITokenOverrides>,
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

const GLOBAL_TOKEN_KEYS = new Set<keyof UITokenOverrides>([
  "space_unit",
  "radius_2xs",
  "radius_xs",
  "radius_md",
  "radius_lg",
  "radius_xl",
  "radius_2xl",
  "radius_full",
  "border_width_thin",
  "border_width_regular",
  "space_0u",
  "space_1u",
  "space_2u",
  "space_3u",
  "space_4u",
  "space_5u",
  "space_6u",
  "space_7u",
  "space_8u",
  "space_10u",
  "space_12u",
  "space_14u",
  "space_16u",
  "space_24u",
  "font_size_2xs",
  "font_size_xs",
  "font_size_sm",
  "font_size_md",
  "font_size_lg",
  "font_size_xl",
  "font_size_2xl",
  "font_size_3xl",
  "size_8u",
  "size_10u",
  "size_12u",
  "size_18u",
  "size_20u",
  "size_24u",
  "size_32u",
  "size_36u",
  "size_40u",
  "size_45u",
  "size_50u",
  "letter_spacing_tight",
]);

function splitThemeTokenOverrides(overrides?: UITokenOverrides) {
  const global: UITokenOverrides = {};
  const themed: UITokenOverrides = {};

  if (!overrides) {
    return { global, themed };
  }

  for (const [rawKey, rawValue] of Object.entries(overrides)) {
    const key = rawKey as keyof UITokenOverrides;
    const value = rawValue as string | undefined;
    if (!value) {
      continue;
    }

    if (GLOBAL_TOKEN_KEYS.has(key)) {
      global[key] = value;
    } else {
      themed[key] = value;
    }
  }

  return { global, themed };
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
  const [primaryColor, setPrimaryColor] = useState("oklch(0.205 0 0)");
  const [backgroundColor, setBackgroundColor] = useState("oklch(1 0 0)");
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
  const [darkModePrimaryColor, setDarkModePrimaryColor] = useState("oklch(0.87 0 0)");
  const [darkModeBackgroundColor, setDarkModeBackgroundColor] =
    useState("oklch(0.205 0 0)");
  const [lightModeTextColor, setLightModeTextColor] = useState(
    SDK_LIGHT_THEME_DEFAULTS.text_color,
  );
  const [darkModeTextColor, setDarkModeTextColor] = useState(
    SDK_DARK_THEME_DEFAULTS.text_color,
  );
  const [lightModeTokenOverrides, setLightModeTokenOverrides] =
    useState<UITokenOverrides>(SDK_LIGHT_THEME_DEFAULTS.token_overrides);
  const [darkModeTokenOverrides, setDarkModeTokenOverrides] =
    useState<UITokenOverrides>(SDK_DARK_THEME_DEFAULTS.token_overrides);
  const [globalTokenOverrides, setGlobalTokenOverrides] =
    useState<UITokenOverrides>(SDK_GLOBAL_TOKEN_DEFAULTS);
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

  const isValidCssLength = (value: string) => {
    return /^(0|\d+(\.\d+)?(px|rem|em|%)?)$/i.test(value.trim());
  };

  const updateTokenField = (
    mode: "light" | "dark",
    key: keyof UITokenOverrides,
    value: string,
  ) => {
    const setter =
      mode === "light" ? setLightModeTokenOverrides : setDarkModeTokenOverrides;
    const fieldMeta = TOKEN_OVERRIDE_FIELDS.find((field) => field.key === key);
    const errorKey = `${mode}_${String(key)}`;

    setter((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);

    const errors = { ...validationErrors };

    if (
      value &&
      ((fieldMeta?.kind === "color" && !isValidCssColor(value)) ||
        (fieldMeta?.kind === "length" && !isValidCssLength(value)))
    ) {
      errors[errorKey] =
        fieldMeta?.kind === "length"
          ? "Please enter a valid CSS length"
          : "Please enter a valid CSS color";
    } else {
      delete errors[errorKey];
    }

    setValidationErrors(errors);
  };

  const updateGlobalTokenField = (
    key: keyof UITokenOverrides,
    value: string,
  ) => {
    setGlobalTokenOverrides((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);

    const errors = { ...validationErrors };
    const errorKey = `global_${String(key)}`;
    const fieldMeta = GLOBAL_TOKEN_FIELDS.find((field) => field.key === key);
    if (value && fieldMeta?.kind === "length" && !isValidCssLength(value)) {
      errors[errorKey] = "Please enter a valid CSS length";
    } else {
      delete errors[errorKey];
    }
    setValidationErrors(errors);
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
      case "lightModeTextColor":
      case "darkModePrimaryColor":
      case "darkModeBackgroundColor":
      case "darkModeTextColor":
        if (value && !isValidCssColor(value)) {
          errors[fieldName] = "Please enter a valid CSS color";
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

  const renderColorInput = (
    value: string | undefined,
    onChange: (value: string) => void,
  ) => {
    const swatchValue = value?.trim();
    const canPreview = Boolean(swatchValue && isValidCssColor(swatchValue));

    return (
      <div
        className="relative h-10 w-16 shrink-0 overflow-hidden rounded border border-zinc-200 bg-[linear-gradient(45deg,#e4e4e7_25%,transparent_25%),linear-gradient(-45deg,#e4e4e7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e4e4e7_75%),linear-gradient(-45deg,transparent_75%,#e4e4e7_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] p-1 dark:border-zinc-700 dark:bg-[linear-gradient(45deg,#3f3f46_25%,transparent_25%),linear-gradient(-45deg,#3f3f46_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#3f3f46_75%),linear-gradient(-45deg,transparent_75%,#3f3f46_75%)]"
        title={swatchValue || "Pick color"}
      >
        <div
          className="h-full w-full rounded-sm border border-black/10 dark:border-white/10"
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
      setPrimaryColor(
        settings.light_mode_settings?.primary_color || "oklch(0.205 0 0)",
      );
      setBackgroundColor(
        settings.light_mode_settings?.background_color || "oklch(1 0 0)",
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
        settings.dark_mode_settings?.primary_color || "oklch(0.87 0 0)",
      );
      setDarkModeBackgroundColor(
        settings.dark_mode_settings?.background_color || "oklch(0.205 0 0)",
      );
      setLightModeTextColor(
        settings.light_mode_settings?.text_color ||
          SDK_LIGHT_THEME_DEFAULTS.text_color,
      );
      setDarkModeTextColor(
        settings.dark_mode_settings?.text_color ||
          SDK_DARK_THEME_DEFAULTS.text_color,
      );
      const lightSplit = splitThemeTokenOverrides(
        settings.light_mode_settings?.token_overrides,
      );
      const darkSplit = splitThemeTokenOverrides(
        settings.dark_mode_settings?.token_overrides,
      );
      setLightModeTokenOverrides({
        ...SDK_LIGHT_THEME_DEFAULTS.token_overrides,
        ...lightSplit.themed,
      });
      setDarkModeTokenOverrides({
        ...SDK_DARK_THEME_DEFAULTS.token_overrides,
        ...darkSplit.themed,
      });
      setGlobalTokenOverrides({
        ...SDK_GLOBAL_TOKEN_DEFAULTS,
        ...darkSplit.global,
        ...lightSplit.global,
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
      light_mode_settings: {
        primary_color: primaryColor,
        background_color: backgroundColor,
        text_color: lightModeTextColor,
        token_overrides: {
          ...globalTokenOverrides,
          ...lightModeTokenOverrides,
        },
      },
      dark_mode_settings: {
        primary_color: darkModePrimaryColor,
        background_color: darkModeBackgroundColor,
        text_color: darkModeTextColor,
        token_overrides: darkModeTokenOverrides,
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
      setPrimaryColor(
        settings.light_mode_settings?.primary_color || "oklch(0.205 0 0)",
      );
      setBackgroundColor(
        settings.light_mode_settings?.background_color || "oklch(1 0 0)",
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
        settings.dark_mode_settings?.primary_color || "oklch(0.87 0 0)",
      );
      setDarkModeBackgroundColor(
        settings.dark_mode_settings?.background_color || "oklch(0.205 0 0)",
      );
      setLightModeTextColor(
        settings.light_mode_settings?.text_color ||
          SDK_LIGHT_THEME_DEFAULTS.text_color,
      );
      setDarkModeTextColor(
        settings.dark_mode_settings?.text_color ||
          SDK_DARK_THEME_DEFAULTS.text_color,
      );
      const lightSplit = splitThemeTokenOverrides(
        settings.light_mode_settings?.token_overrides,
      );
      const darkSplit = splitThemeTokenOverrides(
        settings.dark_mode_settings?.token_overrides,
      );
      setLightModeTokenOverrides({
        ...SDK_LIGHT_THEME_DEFAULTS.token_overrides,
        ...lightSplit.themed,
      });
      setDarkModeTokenOverrides({
        ...SDK_DARK_THEME_DEFAULTS.token_overrides,
        ...darkSplit.themed,
      });
      setGlobalTokenOverrides({
        ...SDK_GLOBAL_TOKEN_DEFAULTS,
        ...darkSplit.global,
        ...lightSplit.global,
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

  const renderThemeTokenField = (
    mode: "light" | "dark",
    field: ThemeTokenField,
  ) => {
    const values =
      mode === "light" ? lightModeTokenOverrides : darkModeTokenOverrides;
    const defaults =
      mode === "light"
        ? SDK_LIGHT_THEME_DEFAULTS.token_overrides
        : SDK_DARK_THEME_DEFAULTS.token_overrides;
    const errorKey = `${mode}_${String(field.key)}`;
    const tokenKey = field.key as ThemeTokenKey;

    return (
      <div key={`${mode}-${field.key}`} className="space-y-3 min-w-0">
        <div className="space-y-1">
          <Subheading>{field.label}</Subheading>
          <Text>{field.description}</Text>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {field.kind === "color" && (
              renderColorInput(values[tokenKey], (value) =>
                updateTokenField(mode, tokenKey, value),
              )
            )}
            <Input
              type="text"
              placeholder={defaults[tokenKey] || ""}
              value={values[tokenKey] || ""}
              onChange={(e) => updateTokenField(mode, tokenKey, e.target.value)}
              className={`flex-1 ${validationErrors[errorKey] && showValidationErrors ? "border-red-500" : ""}`}
            />
          </div>
          {validationErrors[errorKey] && showValidationErrors && (
            <span className="text-red-500 text-sm">
              {validationErrors[errorKey]}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderGlobalTokenField = (field: GlobalTokenField) => {
    const errorKey = `global_${String(field.key)}`;
    const tokenKey = field.key as GlobalTokenKey;

    return (
      <div key={`global-${field.key}`} className="space-y-3 min-w-0">
        <div className="space-y-1">
          <Subheading>{field.label}</Subheading>
          <Text>{field.description}</Text>
        </div>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder={SDK_GLOBAL_TOKEN_DEFAULTS[tokenKey] || ""}
            value={globalTokenOverrides[tokenKey] || ""}
            onChange={(e) => updateGlobalTokenField(tokenKey, e.target.value)}
            className={`flex-1 ${validationErrors[errorKey] && showValidationErrors ? "border-red-500" : ""}`}
          />
          {validationErrors[errorKey] && showValidationErrors && (
            <span className="text-red-500 text-sm">
              {validationErrors[errorKey]}
            </span>
          )}
        </div>
      </div>
    );
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
        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-app-name"
        >
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

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-logo"
        >
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
              variant="avatar"
              required={true}
            />
          </div>
        </section>

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-favicon"
        >
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

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-privacy-url"
        >
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

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-terms-url"
        >
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

        <section className="space-y-6" data-tour-id="setup-theme">
          <div className="space-y-1">
            <Subheading>Theme Tokens</Subheading>
            <Text>
              Configure token overrides under light and dark mode. Unchanged
              values continue using the React SDK defaults.
            </Text>
          </div>

          <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#111113]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
              <div className="space-y-1">
                <Subheading>Global Tokens</Subheading>
                <Text>
                  Shared design controls applied across both light and dark
                  themes.
                </Text>
              </div>
              <ChevronDownIcon className="size-4 text-zinc-500 dark:text-zinc-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-zinc-200 dark:border-zinc-800/60 px-4 py-4">
              <div className="space-y-8">
                <div className="space-y-3 min-w-0">
                  <div className="space-y-1">
                    <Subheading>Spacing Unit</Subheading>
                    <Text>
                      Changes the amount of spacing used throughout the UI,
                      including padding, gaps, and control spacing. Increase it
                      to make the interface feel roomier, or reduce it to make
                      things tighter.
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder={SDK_GLOBAL_TOKEN_DEFAULTS.space_unit}
                      value={globalTokenOverrides.space_unit || ""}
                      onChange={(e) =>
                        updateGlobalTokenField("space_unit", e.target.value)
                      }
                      className={`flex-1 ${validationErrors["global_space_unit"] && showValidationErrors ? "border-red-500" : ""}`}
                    />
                    {validationErrors["global_space_unit"] &&
                      showValidationErrors && (
                        <span className="text-red-500 text-sm">
                          {validationErrors["global_space_unit"]}
                        </span>
                      )}
                  </div>
                </div>

                {GLOBAL_TOKEN_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-4">
                    <div className="space-y-1">
                      <Subheading>{group.title}</Subheading>
                      <Text>{group.description}</Text>
                    </div>
                    <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                      {group.keys
                        .map((key) =>
                          GLOBAL_TOKEN_FIELDS.find((field) => field.key === key),
                        )
                        .filter((field): field is (typeof GLOBAL_TOKEN_FIELDS)[number] =>
                          Boolean(field),
                        )
                        .map((field) => renderGlobalTokenField(field))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#111113]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
              <div className="space-y-1">
                <Subheading>Light Mode</Subheading>
                <Text>Token overrides for the light theme surface.</Text>
              </div>
              <ChevronDownIcon className="size-4 text-zinc-500 dark:text-zinc-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-zinc-200 dark:border-zinc-800/60 px-4 py-4">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Subheading>Core Theme</Subheading>
                    <Text>Primary brand color, page background, and default text.</Text>
                  </div>
                  <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                  {
                    key: "primaryColor",
                    label: "Primary Color",
                    description: "The primary color for your application's light mode UI.",
                    value: primaryColor,
                    placeholder: "oklch(0.205 0 0)",
                    onChange: (value: string) =>
                      updateField(setPrimaryColor, value, "primaryColor"),
                  },
                  {
                    key: "backgroundColor",
                    label: "Background Color",
                    description: "The background color for your application's light mode UI.",
                    value: backgroundColor,
                    placeholder: "oklch(1 0 0)",
                    onChange: (value: string) =>
                      updateField(setBackgroundColor, value, "backgroundColor"),
                  },
                  {
                    key: "lightModeTextColor",
                    label: "Text Color",
                    description: "The default text color for your application's light mode UI.",
                    value: lightModeTextColor,
                    placeholder: SDK_LIGHT_THEME_DEFAULTS.text_color,
                    onChange: (value: string) =>
                      updateField(setLightModeTextColor, value, "lightModeTextColor"),
                  },
                    ].map((field) => (
                      <div key={field.key} className="space-y-3 min-w-0">
                        <div className="space-y-1">
                          <Subheading>{field.label}</Subheading>
                          <Text>{field.description}</Text>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderColorInput(field.value, field.onChange)}
                          <Input
                            type="text"
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={`flex-1 ${validationErrors[field.key] && showValidationErrors ? "border-red-500" : ""}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {THEME_TOKEN_GROUPS.map((group) => (
                  <div key={`light-${group.title}`} className="space-y-4">
                    <div className="space-y-1">
                      <Subheading>{group.title}</Subheading>
                      <Text>{group.description}</Text>
                    </div>
                    <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                      {group.keys
                        .map((key) =>
                          TOKEN_OVERRIDE_FIELDS.find((field) => field.key === key),
                        )
                        .filter((field): field is (typeof TOKEN_OVERRIDE_FIELDS)[number] =>
                          Boolean(field),
                        )
                        .map((field) => renderThemeTokenField("light", field))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#111113]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
              <div className="space-y-1">
                <Subheading>Dark Mode</Subheading>
                <Text>Token overrides for the dark theme surface.</Text>
              </div>
              <ChevronDownIcon className="size-4 text-zinc-500 dark:text-zinc-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-zinc-200 dark:border-zinc-800/60 px-4 py-4">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Subheading>Core Theme</Subheading>
                    <Text>Primary brand color, page background, and default text.</Text>
                  </div>
                  <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                  {
                    key: "darkModePrimaryColor",
                    label: "Primary Color",
                    description: "The primary color for your application's dark mode UI.",
                    value: darkModePrimaryColor,
                    placeholder: "oklch(0.87 0 0)",
                    onChange: (value: string) =>
                      updateField(setDarkModePrimaryColor, value, "darkModePrimaryColor"),
                  },
                  {
                    key: "darkModeBackgroundColor",
                    label: "Background Color",
                    description: "The background color for your application's dark mode UI.",
                    value: darkModeBackgroundColor,
                    placeholder: "oklch(0.205 0 0)",
                    onChange: (value: string) =>
                      updateField(setDarkModeBackgroundColor, value, "darkModeBackgroundColor"),
                  },
                  {
                    key: "darkModeTextColor",
                    label: "Text Color",
                    description: "The default text color for your application's dark mode UI.",
                    value: darkModeTextColor,
                    placeholder: SDK_DARK_THEME_DEFAULTS.text_color,
                    onChange: (value: string) =>
                      updateField(setDarkModeTextColor, value, "darkModeTextColor"),
                  },
                    ].map((field) => (
                      <div key={field.key} className="space-y-3 min-w-0">
                        <div className="space-y-1">
                          <Subheading>{field.label}</Subheading>
                          <Text>{field.description}</Text>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderColorInput(field.value, field.onChange)}
                          <Input
                            type="text"
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={`flex-1 ${validationErrors[field.key] && showValidationErrors ? "border-red-500" : ""}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {THEME_TOKEN_GROUPS.map((group) => (
                  <div key={`dark-${group.title}`} className="space-y-4">
                    <div className="space-y-1">
                      <Subheading>{group.title}</Subheading>
                      <Text>{group.description}</Text>
                    </div>
                    <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                      {group.keys
                        .map((key) =>
                          TOKEN_OVERRIDE_FIELDS.find((field) => field.key === key),
                        )
                        .filter((field): field is (typeof TOKEN_OVERRIDE_FIELDS)[number] =>
                          Boolean(field),
                        )
                        .map((field) => renderThemeTokenField("dark", field))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </section>

        <Divider className="my-8" soft />

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-3"
          data-tour-id="setup-redirects"
        >
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

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-default-images"
        >
          <div className="space-y-1">
            <Subheading>Default User Profile Image</Subheading>
            <Text>
              Default profile image for users who haven't uploaded one.
            </Text>
          </div>
          <div className="space-y-1 flex justify-end">
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
          <div className="space-y-1 flex justify-end">
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
          <div className="space-y-1 flex justify-end">
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
              onCheckedChange={(checked) =>
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
              onCheckedChange={(checked) =>
                updateBooleanField(
                  setUseInitialsForOrganizationProfileImage,
                  checked,
                )
              }
            />
          </div>
        </section>

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-signup-terms"
        >
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
              onCheckedChange={(checked) =>
                updateBooleanField(setSignupTermsStatementShown, checked)
              }
            />
          </div>
        </section>

        <section
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center"
          data-tour-id="setup-waitlist-support"
        >
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
                  <Tooltip open={copiedIndex === item.index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(item.demoLink, item.index)}
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

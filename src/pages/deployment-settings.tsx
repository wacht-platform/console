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
import { Segmented } from "@/components/ui/segmented";
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
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
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

    const invalid = validationErrors[errorKey] && showValidationErrors;

    return (
      <div
        key={`${mode}-${field.key}`}
        className={cn(
          "min-w-0 rounded-md border bg-card p-2.5",
          invalid ? "border-destructive" : "border-border",
        )}
      >
        <div className="flex items-center gap-2.5">
          {field.kind === "color"
            ? renderColorSwatch(values[tokenKey], (value) =>
                updateTokenField(mode, tokenKey, value),
              )
            : null}
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[11px] font-medium text-foreground"
              title={field.description}
            >
              {field.label}
            </p>
            <input
              type="text"
              placeholder={defaults[tokenKey] || ""}
              value={values[tokenKey] || ""}
              onChange={(e) => updateTokenField(mode, tokenKey, e.target.value)}
              className="mt-0.5 w-full border-0 bg-transparent p-0 font-mono text-[11px] text-muted-foreground placeholder:text-muted-foreground/50 focus:text-foreground focus:outline-none"
            />
          </div>
        </div>
        {invalid && (
          <span className="mt-1.5 block text-[10px] text-destructive">
            {validationErrors[errorKey]}
          </span>
        )}
      </div>
    );
  };

  const renderGlobalTokenField = (field: GlobalTokenField) => {
    const errorKey = `global_${String(field.key)}`;
    const tokenKey = field.key as GlobalTokenKey;

    const invalid = validationErrors[errorKey] && showValidationErrors;

    return (
      <div
        key={`global-${field.key}`}
        className={cn(
          "min-w-0 rounded-md border bg-card p-2.5",
          invalid ? "border-destructive" : "border-border",
        )}
      >
        <p
          className="truncate text-[11px] font-medium text-foreground"
          title={field.description}
        >
          {field.label}
        </p>
        <input
          type="text"
          placeholder={SDK_GLOBAL_TOKEN_DEFAULTS[tokenKey] || ""}
          value={globalTokenOverrides[tokenKey] || ""}
          onChange={(e) => updateGlobalTokenField(tokenKey, e.target.value)}
          className="mt-0.5 w-full border-0 bg-transparent p-0 font-mono text-[11px] text-muted-foreground placeholder:text-muted-foreground/50 focus:text-foreground focus:outline-none"
        />
        {invalid && (
          <span className="mt-1.5 block text-[10px] text-destructive">
            {validationErrors[errorKey]}
          </span>
        )}
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
            Override SDK tokens under light and dark mode. Unset values continue
            to use the React SDK defaults. Changes apply to all auth surfaces.
          </p>

          {/* Global tokens — shared across both modes */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <p className="text-sm font-medium text-foreground">
                Global tokens
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Shape, typography, sizing and effects shared across both themes.
              </p>
            </div>
            <div className="space-y-7 px-5 py-5">
              <div className="space-y-2.5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Spacing
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {renderGlobalTokenField({
                    key: "space_unit",
                    label: "Spacing unit",
                    description:
                      "Base spacing unit used for padding, gaps and control spacing across the UI.",
                    kind: "length",
                  })}
                </div>
              </div>

              {GLOBAL_TOKEN_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2.5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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

          {/* Theme colors — switched per mode via Segmented */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Theme colors
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Surface, border, input and status colors for the selected
                  mode.
                </p>
              </div>
              <Segmented
                value={themeMode}
                onChange={setThemeMode}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </div>
            <div className="space-y-7 px-5 py-5">
              <div className="space-y-2.5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Core
                </p>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {(themeMode === "light"
                    ? [
                        {
                          key: "primaryColor",
                          label: "Primary color",
                          description:
                            "The primary color for light mode UI.",
                          value: primaryColor,
                          placeholder: "oklch(0.205 0 0)",
                          onChange: (value: string) =>
                            updateField(setPrimaryColor, value, "primaryColor"),
                        },
                        {
                          key: "backgroundColor",
                          label: "Background color",
                          description:
                            "The background color for light mode UI.",
                          value: backgroundColor,
                          placeholder: "oklch(1 0 0)",
                          onChange: (value: string) =>
                            updateField(
                              setBackgroundColor,
                              value,
                              "backgroundColor",
                            ),
                        },
                        {
                          key: "lightModeTextColor",
                          label: "Text color",
                          description:
                            "The default text color for light mode UI.",
                          value: lightModeTextColor,
                          placeholder: SDK_LIGHT_THEME_DEFAULTS.text_color,
                          onChange: (value: string) =>
                            updateField(
                              setLightModeTextColor,
                              value,
                              "lightModeTextColor",
                            ),
                        },
                      ]
                    : [
                        {
                          key: "darkModePrimaryColor",
                          label: "Primary color",
                          description:
                            "The primary color for dark mode UI.",
                          value: darkModePrimaryColor,
                          placeholder: "oklch(0.87 0 0)",
                          onChange: (value: string) =>
                            updateField(
                              setDarkModePrimaryColor,
                              value,
                              "darkModePrimaryColor",
                            ),
                        },
                        {
                          key: "darkModeBackgroundColor",
                          label: "Background color",
                          description:
                            "The background color for dark mode UI.",
                          value: darkModeBackgroundColor,
                          placeholder: "oklch(0.205 0 0)",
                          onChange: (value: string) =>
                            updateField(
                              setDarkModeBackgroundColor,
                              value,
                              "darkModeBackgroundColor",
                            ),
                        },
                        {
                          key: "darkModeTextColor",
                          label: "Text color",
                          description:
                            "The default text color for dark mode UI.",
                          value: darkModeTextColor,
                          placeholder: SDK_DARK_THEME_DEFAULTS.text_color,
                          onChange: (value: string) =>
                            updateField(
                              setDarkModeTextColor,
                              value,
                              "darkModeTextColor",
                            ),
                        },
                      ]
                  ).map((field) => {
                    const invalid =
                      validationErrors[field.key] && showValidationErrors;
                    return (
                      <div
                        key={field.key}
                        className={cn(
                          "min-w-0 rounded-md border bg-card p-2.5",
                          invalid ? "border-destructive" : "border-border",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderColorSwatch(field.value, field.onChange)}
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[11px] font-medium text-foreground"
                              title={field.description}
                            >
                              {field.label}
                            </p>
                            <input
                              type="text"
                              placeholder={field.placeholder}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="mt-0.5 w-full border-0 bg-transparent p-0 font-mono text-[11px] text-muted-foreground placeholder:text-muted-foreground/50 focus:text-foreground focus:outline-none"
                            />
                          </div>
                        </div>
                        {invalid && (
                          <span className="mt-1.5 block text-[10px] text-destructive">
                            {validationErrors[field.key]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {THEME_TOKEN_GROUPS.map((group) => (
                <div key={`${themeMode}-${group.title}`} className="space-y-2.5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {group.keys
                      .map((key) =>
                        TOKEN_OVERRIDE_FIELDS.find((field) => field.key === key),
                      )
                      .filter((field): field is (typeof TOKEN_OVERRIDE_FIELDS)[number] =>
                        Boolean(field),
                      )
                      .map((field) => renderThemeTokenField(themeMode, field))}
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

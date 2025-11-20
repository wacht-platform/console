// Email template variable definitions
// Organized by template type with proper nested structure

type TemplateVariable = {
    key: string;
    label: string;
    description?: string;
};

type TemplateVariableCategory = {
    category: string;
    variables: TemplateVariable[];
};

// Common variables shared across all templates
const COMMON_VARIABLES: TemplateVariableCategory[] = [
    {
        category: "Application",
        variables: [
            { key: "app.name", label: "App Name", description: "Your application name" },
            { key: "app.logo", label: "App Logo", description: "Base64 encoded logo (use with {{image app.logo}})" },
        ],
    },
];

// User variables - comprehensive user data
const USER_VARIABLES: TemplateVariableCategory = {
    category: "User Information",
    variables: [
        { key: "user.id", label: "User ID" },
        { key: "user.first_name", label: "First Name" },
        { key: "user.last_name", label: "Last Name" },
        { key: "user.full_name", label: "Full Name" },
        { key: "user.username", label: "Username" },
        { key: "user.email", label: "Email Address" },
        { key: "user.phone", label: "Phone Number" },
        { key: "user.profile_picture_url", label: "Profile Picture URL" },
        { key: "user.created_at", label: "Account Created" },
        { key: "user.disabled", label: "Account Disabled Status" },
        { key: "user.has_password", label: "Has Password" },
        { key: "user.public_metadata", label: "Public Metadata (JSON)" },
        { key: "user.private_metadata", label: "Private Metadata (JSON)" },
    ],
};

// Device information variables
const DEVICE_VARIABLES: TemplateVariableCategory = {
    category: "Device Information",
    variables: [
        { key: "device.info", label: "Device Info", description: "Formatted device string with IP" },
        { key: "device.name", label: "Device Name" },
        { key: "device.browser", label: "Browser" },
        { key: "device.ip_address", label: "IP Address" },
        { key: "device.user_agent", label: "User Agent" },
    ],
};

// Template-specific variable mappings
export const TEMPLATE_VARIABLES: Record<string, TemplateVariableCategory[]> = {
    verification_code_template: [
        ...COMMON_VARIABLES,
        {
            category: "Verification Code",
            variables: [
                { key: "code.value", label: "Verification Code" },
                { key: "code.expires_in_minutes", label: "Code Expiry (minutes)" },
            ],
        },
        DEVICE_VARIABLES,
    ],

    reset_password_code_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Reset Code",
            variables: [
                { key: "code.value", label: "Reset Code" },
                { key: "code.expires_in_minutes", label: "Code Expiry (minutes)" },
            ],
        },
        DEVICE_VARIABLES,
    ],

    sign_in_from_new_device_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Sign-In Details",
            variables: [
                { key: "signin.time", label: "Sign-In Time", description: "UTC timestamp" },
                { key: "signin.location", label: "Location", description: "City, Country" },
            ],
        },
        DEVICE_VARIABLES,
    ],

    magic_link_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Magic Link",
            variables: [
                { key: "action_url", label: "Magic Link URL" },
                { key: "link.expires_in_minutes", label: "Link Expiry (minutes)" },
            ],
        },
    ],

    primary_email_change_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Email Change",
            variables: [
                { key: "old_email", label: "Previous Email" },
                { key: "new_email", label: "New Email" },
            ],
        },
    ],

    password_change_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Password Change",
            variables: [
                { key: "change_time", label: "Change Time", description: "UTC timestamp" },
            ],
        },
    ],

    password_remove_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Password Removal",
            variables: [
                { key: "removal_time", label: "Removal Time", description: "UTC timestamp" },
            ],
        },
    ],

    waitlist_signup_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
    ],

    waitlist_invite_template: [
        ...COMMON_VARIABLES,
        USER_VARIABLES,
        {
            category: "Invitation",
            variables: [
                { key: "action_url", label: "Invitation Link" },
                { key: "invitation.expires_in_days", label: "Expires In (days)" },
                { key: "invitation.expiry", label: "Expiry Date" },
            ],
        },
    ],

    workspace_invite_template: [
        ...COMMON_VARIABLES,
        {
            category: "Invitation Details",
            variables: [
                { key: "inviter_name", label: "Inviter Name" },
                { key: "workspace_name", label: "Workspace Name" },
                { key: "action_url", label: "Invitation Link" },
                { key: "invitation.expires_in_days", label: "Expires In (days)" },
                { key: "invitation.expiry", label: "Expiry Date" },
            ],
        },
    ],

    organization_invite_template: [
        ...COMMON_VARIABLES,
        {
            category: "Invitation Details",
            variables: [
                { key: "inviter_name", label: "Inviter Name" },
                { key: "organization_name", label: "Organization Name" },
                { key: "action_url", label: "Invitation Link" },
                { key: "invitation.expires_in_days", label: "Expires In (days)" },
            ],
        },
    ],
};

// Helper function to get variables for a specific template
export function getTemplateVariables(templateId: string): TemplateVariableCategory[] {
    return TEMPLATE_VARIABLES[templateId] || COMMON_VARIABLES;
}

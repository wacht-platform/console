export type TourSide = "top" | "right" | "bottom" | "left";
export type TourAlignment = "start" | "center" | "end";

export type TourActionId =
    | "open-create-flow"
    | "open-billing-setup"
    | "open-create-project"
    | "tour:navigate";

export type TourIntro = {
    title: string;
    body: string;
    primaryLabel?: string;
    /**
     * Optional registered action fired after the intro is dismissed via the
     * primary button. Use sparingly — the goal of the tour is to guide the
     * user to take actions themselves, not to do those actions for them.
     */
    primaryAction?: TourActionId;
};

export type TourStep = {
    /** data-tour-id of the element to highlight. Omit for a centered modal. */
    target?: string;
    title: string;
    body: string;
    side?: TourSide;
    align?: TourAlignment;
    /**
     * When set, the `tour:navigate` action fires with this value as the arg
     * when the step becomes active. App code registers the handler (typically
     * in ApplicationLayout) and decides how to interpret the value — e.g.
     * map a short key to a full router path.
     */
    navigateTo?: string;
};

type BaseTour = {
    id: string;
    version: number;
    title: string;
    persist?: boolean;
};

export type LinearTour = BaseTour & {
    mode: "linear";
    intro?: TourIntro;
    steps: TourStep[];
};

export type ReactiveStep = TourStep & { target: string };

/**
 * A scene activates when its `trigger` element is visible in the DOM. While
 * active, the user is walked through `steps` linearly — clicking Next on the
 * popover advances to the next sub-step. The LAST step in a scene typically
 * highlights the action button the user must click to leave the scene; the
 * popover hides its Next button on that step, so the only way forward is to
 * actually interact with the highlighted control.
 */
export type ReactiveScene = {
    trigger: string;
    steps: ReactiveStep[];
};

export type ReactiveTour = BaseTour & {
    mode: "reactive";
    intro?: TourIntro;
    /**
     * Scenes ordered by priority, lowest first. The highest-priority scene
     * whose trigger is currently visible becomes active. Use the trigger that
     * uniquely identifies "this UI is on screen" — e.g., the submit button
     * inside a modal is a good trigger because it only exists in that modal.
     */
    scenes: ReactiveScene[];
};

export type TourDefinition = LinearTour | ReactiveTour;

export const tours = {
    "first-deployment-create": {
        id: "first-deployment-create",
        version: 5,
        title: "Create your first deployment",
        mode: "reactive",
        persist: true,
        intro: {
            title: "Let's get you shipping",
            body: "I'll walk you through launching your first deployment — billing, project, then your console. I'll spotlight what to do; you drive.",
            primaryLabel: "Show me",
        },
        scenes: [
            // Lowest priority — always-on fallback on the projects page.
            {
                trigger: "projects-create-button",
                steps: [
                    {
                        target: "projects-create-button",
                        side: "bottom",
                        align: "end",
                        title: "Click New project",
                        body: "Tap this button to start the setup flow. We'll be right here while you do.",
                    },
                ],
            },
            // After a project exists in the list, prompt to open it.
            {
                trigger: "project-card",
                steps: [
                    {
                        target: "project-card",
                        side: "right",
                        align: "center",
                        title: "🚀 Open your project",
                        body: "Your project is live with a staging deployment built in. Click the card to dive into the console.",
                    },
                ],
            },
            // Create-project modal — walk through name, auth methods, then submit.
            {
                trigger: "create-project-submit",
                steps: [
                    {
                        target: "create-project-name",
                        side: "bottom",
                        align: "start",
                        title: "Name your project",
                        body: 'Pick something memorable — "Acme Dashboard" is fine. You can always rename it later.',
                    },
                    {
                        target: "create-project-auth-methods",
                        side: "top",
                        align: "center",
                        title: "Pick your auth methods",
                        body: "Toggle the sign-in methods your users will have. Email is on by default — add OAuth providers (Google, GitHub, etc.) by clicking their cards. You can layer in more after launch.",
                    },
                    {
                        target: "create-project-submit",
                        side: "top",
                        align: "end",
                        title: "Click Create Project",
                        body: "Once the name and auth methods look right, hit this button. We'll spin up a staging deployment for you automatically.",
                    },
                ],
            },
            // Billing modal — walk through each required field, then submit.
            {
                trigger: "billing-submit-button",
                steps: [
                    {
                        target: "billing-legal-name",
                        side: "bottom",
                        align: "start",
                        title: "Enter your company name",
                        body: "This is your legal entity name — what'll appear on invoices and receipts.",
                    },
                    {
                        target: "billing-work-email",
                        side: "bottom",
                        align: "start",
                        title: "Add a billing email",
                        body: "Where should we send invoices, payment receipts, and renewal reminders?",
                    },
                    {
                        target: "billing-submit-button",
                        side: "top",
                        align: "center",
                        title: "Confirm to continue",
                        body: "We won't charge anything until you exceed the free tier. Pick a plan on the left if you haven't yet, then click here.",
                    },
                ],
            },
        ],
    },
    "first-agents": {
        id: "first-agents",
        version: 2,
        title: "AI agents tour",
        mode: "linear",
        intro: {
            title: "Let's build your AI stack",
            body: "Before you build an agent you need a few foundations — model keys, MCP servers, tools, and knowledge. I'll walk you through the stack from the ground up, then show you how to wire everything into an agent.",
            primaryLabel: "Walk me through",
        },
        steps: [
            {
                target: "llm-tab-ai-settings",
                navigateTo: "llms/ai-settings",
                title: "1 · Configuration",
                body: "Start here. This is where you add model provider keys (OpenAI, Gemini, OpenRouter) and configure customer S3 storage. Nothing else works until you've set at least one provider key.",
                side: "bottom",
                align: "center",
            },
            {
                target: "llm-tab-mcp-servers",
                navigateTo: "llms/mcp-servers",
                title: "2 · MCP servers",
                body: "Hook up Model Context Protocol servers — Composio, your own MCP host, or any compatible server. Agents call MCP tools just like they call built-in ones.",
                side: "bottom",
                align: "center",
            },
            {
                target: "llm-tab-extensions",
                navigateTo: "llms/extensions",
                title: "3 · Extensions",
                body: "Browse pre-built tool packs you can drop into any agent — web search, code execution, vector store ops, browser automation, and more. One click to install.",
                side: "bottom",
                align: "center",
            },
            {
                target: "llm-tab-tools",
                navigateTo: "llms/tools",
                title: "4 · Tools",
                body: "Define custom tools — HTTP endpoints, scripts, structured outputs. Each tool has a name, schema, and implementation. Agents pick from this catalog when they need to act.",
                side: "bottom",
                align: "center",
            },
            {
                target: "llm-tab-knowledge-base",
                navigateTo: "llms/knowledge-base",
                title: "5 · Knowledge Base",
                body: "Upload documents, link URLs, or attach vector tables. Agents can query the knowledge base for context-grounded answers — RAG built in.",
                side: "bottom",
                align: "center",
            },
            {
                target: "llm-tab-agents",
                navigateTo: "llms/ai-agents",
                title: "6 · AI Agents",
                body: "Now the fun part. Agents combine everything above — a model, a system prompt, the tools and knowledge bases you want to expose, hooks, approval policies, and sub-agent delegation. Let's create one.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agents-create-button",
                title: "Create your first agent",
                body: "Click this. We'll ask for a name + system prompt, wire up a default model, and drop you in the builder where you can attach tools, knowledge, MCP servers, and hooks.",
                side: "bottom",
                align: "end",
            },
            {
                target: "agents-search",
                title: "Search & find",
                body: "Once you have a few agents, this filters the list. Searches across name and description.",
                side: "bottom",
                align: "start",
            },
            {
                target: "agents-table",
                title: "Manage from the list",
                body: "Every agent is here. Click any row to open the builder — prompts, tools, knowledge, models, hooks, approvals, sub-agents, and a live debugger live one level deeper.",
                side: "top",
                align: "center",
            },
        ],
    },
    "first-segments": {
        id: "first-segments",
        version: 1,
        title: "Your first segment",
        mode: "reactive",
        persist: true,
        intro: {
            title: "Segments — group your users",
            body: "Segments let you slice users, organizations, or workspaces into named cohorts — handy for targeted notifications, analytics, and feature flags. Let me walk you through creating one.",
            primaryLabel: "Show me",
        },
        scenes: [
            {
                trigger: "segments-create-button",
                steps: [
                    {
                        target: "segments-create-button",
                        side: "bottom",
                        align: "end",
                        title: "Create your first segment",
                        body: "Click here to open the create dialog. We'll give it a name, pick what kind of entity it groups, and add an optional description.",
                    },
                ],
            },
            {
                trigger: "segment-submit",
                steps: [
                    {
                        target: "segment-name",
                        side: "bottom",
                        align: "start",
                        title: "Name your segment",
                        body: 'A short, human-readable label — like "Power users", "Trial accounts", or "EU customers".',
                    },
                    {
                        target: "segment-type",
                        side: "bottom",
                        align: "start",
                        title: "Pick the entity type",
                        body: "Segments work on Users, Organizations, or Workspaces. Each segment is tied to one type — pick what you want to group.",
                    },
                    {
                        target: "segment-submit",
                        side: "top",
                        align: "end",
                        title: "Create the segment",
                        body: "Once name + type are set, hit this. We'll open the segment and let you start adding criteria.",
                    },
                ],
            },
        ],
    },
    "first-segment-details": {
        id: "first-segment-details",
        version: 1,
        title: "Inside your segment",
        mode: "linear",
        intro: {
            title: "Your segment is live",
            body: "This is the segment's workspace. Let me show you what you can do here.",
            primaryLabel: "Walk me through",
        },
        steps: [
            {
                target: "segment-header",
                title: "Segment overview",
                body: "Name, type, and description show up here. The type badge tells you what kind of entity this segment groups.",
                side: "bottom",
                align: "start",
            },
            {
                target: "segment-actions",
                title: "Edit or delete",
                body: "Edit to update the name/description. Delete to remove the segment — won't touch the underlying users.",
                side: "left",
                align: "center",
            },
            {
                target: "segment-members-table",
                title: "Members live here",
                body: "Every entity that currently matches this segment shows up below. Use the search to filter, and refresh after updating criteria.",
                side: "top",
                align: "center",
            },
        ],
    },
    "first-oauth-apps": {
        id: "first-oauth-apps",
        version: 1,
        title: "Your first OAuth app",
        mode: "reactive",
        persist: true,
        intro: {
            title: "Set up your first OAuth app",
            body: "OAuth apps let your users (or third parties) sign in via your deployment as an OAuth provider — think MCP servers, partner integrations, AI tools. Let me walk you through creating one.",
            primaryLabel: "Show me",
        },
        scenes: [
            {
                trigger: "oauth-create-button",
                steps: [
                    {
                        target: "oauth-create-button",
                        side: "bottom",
                        align: "end",
                        title: "Click Create OAuth App",
                        body: "This opens the create dialog. We'll fill in a slug, name, and (in production) the OAuth domain.",
                    },
                ],
            },
            {
                trigger: "oauth-app-submit",
                steps: [
                    {
                        target: "oauth-app-slug",
                        side: "bottom",
                        align: "start",
                        title: "Pick a slug",
                        body: "URL-safe identifier that appears in OAuth endpoints (e.g. /oauth/your-slug/authorize). Lowercase, hyphens — like a project handle.",
                    },
                    {
                        target: "oauth-app-name",
                        side: "bottom",
                        align: "start",
                        title: "Give it a display name",
                        body: "Human-readable name shown to users on the consent screen. \"MCP Auth Server\" or your product name works.",
                    },
                    {
                        target: "oauth-app-submit",
                        side: "top",
                        align: "end",
                        title: "Create the app",
                        body: "When the slug + name look good, hit this. We'll set up the OAuth endpoints and drop you into the app's console.",
                    },
                ],
            },
        ],
    },
    "first-oauth-app-details": {
        id: "first-oauth-app-details",
        version: 1,
        title: "Inside your OAuth app",
        mode: "linear",
        intro: {
            title: "Your OAuth app is live 🎉",
            body: "Now let me show you the three surfaces inside every OAuth app — clients, runtime, and settings.",
            primaryLabel: "Walk me through",
        },
        steps: [
            {
                target: "oauth-app-tab-clients",
                title: "Clients",
                body: "Each OAuth client gets its own client_id + secret. Create one per integration that needs to authenticate against this app — your CLI, a partner, an MCP host, etc.",
                side: "bottom",
                align: "start",
            },
            {
                target: "oauth-app-tab-runtime",
                title: "Runtime",
                body: "Live OAuth endpoints + discovery URLs for this app. Hand these to whoever's integrating — issuer, authorization, token, userinfo, JWKS.",
                side: "bottom",
                align: "start",
            },
            {
                target: "oauth-app-tab-settings",
                title: "App settings",
                body: "Tune scopes, token TTLs, allowed grant types, consent screen branding, and PKCE rules here. Sensible defaults to start.",
                side: "bottom",
                align: "start",
            },
        ],
    },
    "first-orgs-enabled": {
        id: "first-orgs-enabled",
        version: 1,
        title: "Organizations tour",
        mode: "linear",
        intro: {
            title: "Multi-tenancy unlocked 🎉",
            body: "Your users can now create Organizations, invite teammates, and manage shared resources. Let me show you what just opened up.",
            primaryLabel: "Show me",
        },
        steps: [
            {
                target: "b2b-feature-toggles",
                title: "Org-level feature toggles",
                body: "Each switch here is opt-in: custom roles, IP allowlists, MFA enforcement, and enterprise SSO. Turn on what your customers need.",
                side: "top",
                align: "center",
            },
            {
                target: "b2b-roles-permissions",
                title: "Roles & permissions",
                body: "Set default roles for new members and organization creators, and define the permission set your customers can wire into custom roles.",
                side: "top",
                align: "center",
            },
            {
                target: "b2b-tab-organizations",
                title: "Organizations tab",
                body: "Right now you're configuring the global org settings. The same tab is where you'll review every organization once your users start creating them.",
                side: "bottom",
                align: "center",
            },
            {
                target: "b2b-tab-workspaces",
                title: "Workspaces tab",
                body: "Workspaces are sub-groups inside an organization — handy for projects, environments, or departments. Enable them here if your product needs that extra layer.",
                side: "bottom",
                align: "center",
            },
        ],
    },
    "first-auth-settings": {
        id: "first-auth-settings",
        version: 3,
        title: "Authentication settings tour",
        mode: "linear",
        intro: {
            title: "Authentication, your way",
            body: "Wacht ships everything you need for auth — schema, factors, SSO, sessions, restrictions, and JWT templates. Let me show you each surface.",
            primaryLabel: "Walk me through",
        },
        steps: [
            {
                target: "auth-tab-schema-factors",
                title: "Schema & Factors",
                body: "The main hub: pick which fields your users need (email, phone, username) and which sign-in factors are enabled. This is where you'll spend most of your time.",
                side: "bottom",
                align: "center",
            },
            {
                target: "auth-section-user-schema",
                title: "User schema",
                body: "Define the required fields on every user record — and whether email or phone must be verified before they can sign in.",
                side: "top",
                align: "center",
            },
            {
                target: "auth-section-first-factor",
                title: "First-factor authentication",
                body: "The methods users see on the sign-in screen — password, magic link, OAuth providers, passkey, web3 wallet. Toggle what you want.",
                side: "top",
                align: "center",
            },
            {
                target: "auth-section-second-factor",
                title: "Second-factor authentication",
                body: "Layer on MFA: TOTP, SMS, email codes, or backup codes. Enforce it for everyone or let users opt in.",
                side: "top",
                align: "center",
            },
            {
                target: "auth-tab-sso",
                title: "Social login",
                body: "Wire up Google, GitHub, Microsoft, LinkedIn, and other OAuth providers your users can sign in with. Drop in your client ID + secret and we handle the rest.",
                side: "bottom",
                align: "center",
            },
            {
                target: "auth-tab-sessions",
                title: "Sessions",
                body: "Control session lifetime, refresh strategy, and active-session limits. Useful for tightening security on production.",
                side: "bottom",
                align: "center",
            },
            {
                target: "auth-tab-restrictions",
                title: "Restrictions",
                body: "Block sign-ups by email domain, country, or IP. Set allowlists for invite-only apps.",
                side: "bottom",
                align: "center",
            },
            {
                target: "auth-tab-jwt-templates",
                title: "JWT templates",
                body: "Mint custom JWTs your backend (or downstream services) can verify — shape claims to match your auth model.",
                side: "bottom",
                align: "center",
            },
        ],
    },
    "first-deployment-settings": {
        id: "first-deployment-settings",
        version: 3,
        title: "Deployment settings tour",
        mode: "linear",
        intro: {
            title: "Tune this deployment",
            body: "Branding, emails, webhook catalogs, rate limits — everything that shapes how this deployment behaves lives here. I'll take you through it section by section.",
            primaryLabel: "Walk me through",
        },
        steps: [
            // Tabs overview
            {
                target: "setup-tab-deployment-settings",
                title: "Deployment Settings",
                body: "You're here now. App identity, branding, redirects, theme — every UI-facing knob lives in this tab.",
                side: "bottom",
                align: "center",
            },
            {
                target: "setup-tab-emails",
                title: "Email Settings",
                body: "Customize the transactional emails Wacht sends — verification, magic links, password resets, MFA codes. Override copy, subjects, and branding per template.",
                side: "bottom",
                align: "center",
            },
            {
                target: "setup-tab-webhook-catalogs",
                title: "Webhook Catalogs",
                body: "Define the events your customers can subscribe to — your app emits them, Wacht handles delivery, retries, and signatures.",
                side: "bottom",
                align: "center",
            },
            {
                target: "setup-tab-rate-limit-schemes",
                title: "Rate Limit Schemes",
                body: "Named rate-limit policies you attach to API auth keys. Build once, apply to many.",
                side: "bottom",
                align: "center",
            },
            // Section-by-section through Deployment Settings
            {
                target: "setup-app-name",
                title: "App Name",
                body: "The display name shown to users on sign-in pages, emails, and the consent screen. Set this first — it appears everywhere.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-logo",
                title: "Application Logo",
                body: "Upload your logo. It shows up on hosted auth pages, account portal, and email headers.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-favicon",
                title: "Favicon",
                body: "Your favicon — used on the hosted auth and account-portal pages.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-privacy-url",
                title: "Privacy Policy URL",
                body: "Linked on the sign-up screen so users can read it before consenting. Required by most app stores and many regulators.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-terms-url",
                title: "Terms of Service URL",
                body: "Same idea — linked from sign-up. Pair it with the privacy URL.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-theme",
                title: "Theme Tokens",
                body: "Override colors, spacing, font sizes, and radii — light mode and dark mode independently. Anything you don't override falls back to the React SDK defaults.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-redirects",
                title: "User Redirects",
                body: "Tell the Account Portal where to send users after sign-up, sign-in, sign-out, logo click, and org creation. The Portal can't redirect without these.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-default-images",
                title: "Default profile images",
                body: "Set fallback avatars for users, organizations, and workspaces that haven't uploaded one. You can also toggle initials-based generation per entity.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-signup-terms",
                title: "Signup terms statement",
                body: "Custom legal/agreement copy shown on the signup screen — and a toggle to show or hide it entirely.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-waitlist-support",
                title: "Waitlist & support URLs",
                body: "Where to send users who land on a closed sign-up (waitlist) and where to send anyone needing help (support). Both are linked from the hosted pages.",
                side: "top",
                align: "center",
            },
        ],
    },
    "first-api-auth": {
        id: "first-api-auth",
        version: 1,
        title: "API auth tour",
        mode: "linear",
        intro: {
            title: "Issue API keys to your users",
            body: "Wacht lets your end users generate API keys with scoped rate limits and audit logs — all from your app.",
            primaryLabel: "Show me",
        },
        steps: [
            {
                target: "api-auth-content",
                title: "Hosted or embedded",
                body: "You can drop our hosted vanity page in, or embed the React components into your app — both share the same data model.",
                side: "top",
                align: "center",
            },
        ],
    },
    "first-webhooks": {
        id: "first-webhooks",
        version: 1,
        title: "Webhooks tour",
        mode: "linear",
        intro: {
            title: "Webhooks, fully managed",
            body: "Let your users subscribe to your events without you owning the delivery infrastructure. Retries, signatures, and replay are built-in.",
            primaryLabel: "Walk me through",
        },
        steps: [
            {
                target: "webhooks-content",
                title: "Define your catalog first",
                body: "Your catalog is the set of events your app emits. Define it once under Setup → Webhook Catalogs and your users can subscribe by name.",
                side: "top",
                align: "center",
            },
        ],
    },
} satisfies Record<string, TourDefinition>;

export type TourId = keyof typeof tours;

export function getTour(id: TourId): TourDefinition {
    return tours[id];
}

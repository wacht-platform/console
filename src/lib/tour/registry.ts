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
                        title: "Billing name",
                        body: "Enter your billing name (no charges or checkout yet, we just need this for legal reason 🙂)",
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
                        body: "This is a one time setup and you will not be led to checkout unless you picked a paid plan",
                    },
                ],
            },
        ],
    },
    "first-agents": {
        id: "first-agents",
        version: 3,
        title: "AI agents",
        mode: "reactive",
        persist: true,
        scenes: [
            // Empty list — point the user at Create.
            {
                trigger: "agents-create-button",
                steps: [
                    {
                        target: "agents-create-button",
                        side: "bottom",
                        align: "end",
                        title: "Create your first agent",
                        body: "Give it a name and a system prompt — you can attach tools, knowledge, MCP servers, and hooks once it's open.",
                    },
                ],
            },
            // After at least one agent exists, gently point at the list.
            {
                trigger: "agents-table",
                steps: [
                    {
                        target: "agents-table",
                        side: "top",
                        align: "center",
                        title: "Open any agent to walk through configuration",
                        body: "Click a row to open the builder — Buddy will walk you through every section the first time you land there.",
                    },
                ],
            },
        ],
    },
    "agent-builder": {
        id: "agent-builder",
        version: 1,
        title: "Configure your agent",
        mode: "linear",
        intro: {
            title: "Let's wire this agent up",
            body: "I'll walk you through every section that matters — models, skills, tools, knowledge, hooks, approvals, sub-agents, debugging. Pick what your agent needs, skip what it doesn't.",
            primaryLabel: "Walk me through",
        },
        steps: [
            {
                target: "agent-tab-models",
                navigateTo: "models",
                title: "1 · Models",
                body: "Pick the LLM(s) this agent runs on. Configure a strong model for hard tasks and a fast/cheap model for everyday calls — the runtime routes between them automatically.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-skills",
                navigateTo: "skills",
                title: "2 · Skills",
                body: "Skills are reusable behavior bundles — system-level (built-in) or agent-level (uploaded ZIPs). Mount them once, the agent loads them on demand. Best place to put 'how the agent should behave' patterns.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-tools",
                navigateTo: "tools",
                title: "3 · Tools",
                body: "What the agent can actually do — HTTP endpoints, code runners, MCP tools, platform events. Attach the ones it needs; the agent picks from this catalog at runtime.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-knowledge-bases",
                navigateTo: "knowledge-bases",
                title: "4 · Knowledge bases",
                body: "Documents and vector stores the agent can search for grounded answers. Attach one if you want RAG; skip if the system prompt + tools are enough.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-hooks",
                navigateTo: "hooks",
                title: "5 · Hooks",
                body: "Inject tool calls at lifecycle points — before LLM, after tool, on budget exhausted, etc. Useful for logging, validation, rate limiting, or hand-offs without touching the agent's prompt.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-approvals",
                navigateTo: "approvals",
                title: "6 · Approvals",
                body: "Gate risky tool calls — MCP, virtual, or any specific tool — behind explicit human approval. The agent pauses and the user decides on the consent screen.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-sub-agents",
                navigateTo: "sub-agents",
                title: "7 · Sub-agents",
                body: "Attach other agents this one can delegate to. The parent picks a sub-agent at runtime based on task tags. Skip unless you're building a multi-agent system.",
                side: "bottom",
                align: "center",
            },
            {
                target: "agent-tab-debug",
                navigateTo: "debug",
                title: "8 · Debug",
                body: "Run the agent live in a sandboxed thread, see every tool call and hook fire, replay or branch from any step. This is where you validate that the wiring you just did actually works.",
                side: "bottom",
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
                        body: 'Human-readable name shown to users on the consent screen. "MCP Auth Server" or your product name works.',
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
        version: 5,
        title: "Deployment settings",
        mode: "linear",
        intro: {
            title: "Let's tune this deployment",
            body: "I'll walk you through the parts that matter — app identity, redirects, branding, plus where to find emails, webhook catalogs, and rate limits.",
            primaryLabel: "Walk me through",
        },
        steps: [
            // The non-obvious / required configuration first.
            {
                target: "setup-app-name",
                title: "1 · App Name",
                body: "Shown on sign-in screens, in emails, on the consent screen. Set this first — everything else references it.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-logo",
                title: "2 · Logo",
                body: "Appears on hosted auth pages, the Account Portal, and email headers. Keep it tall enough to read at 32px.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-redirects",
                title: "3 · User Redirects (required)",
                body: "The hosted Account Portal needs these to know where to send users after sign-in, sign-out, org creation, etc. Easy to miss; breaks the flow if you do.",
                side: "top",
                align: "center",
            },
            {
                target: "setup-theme",
                title: "4 · Theme tokens",
                body: "Override colors, radii, fonts here once and every Wacht component picks them up — no per-component prop drilling. Light and dark are independent.",
                side: "top",
                align: "center",
            },
            // Then the sibling tabs so users know what else is on this page.
            {
                target: "setup-tab-emails",
                title: "5 · Emails (next tab)",
                body: "Customize transactional emails — verification, magic links, password resets, MFA. Per-template subject and body overrides.",
                side: "bottom",
                align: "center",
            },
            {
                target: "setup-tab-webhook-catalogs",
                title: "6 · Webhook Catalogs",
                body: "Define the events your customers can subscribe to. Your app emits them, Wacht handles delivery + retries + signatures.",
                side: "bottom",
                align: "center",
            },
            {
                target: "setup-tab-rate-limit-schemes",
                title: "7 · Rate Limit Schemes",
                body: "Named rate-limit policies you attach to API auth keys. Build once, reuse across many keys.",
                side: "bottom",
                align: "center",
            },
        ],
    },
    "first-api-auth": {
        id: "first-api-auth",
        version: 2,
        title: "API Auth",
        // Intro-only: the page below is an iframe of the live vanity surface,
        // so Buddy can't spotlight anything inside it. The intro tells the
        // user what they're looking at and dismisses out of the way.
        mode: "linear",
        intro: {
            title: "This is the live API Auth surface",
            body: "What you see below is the exact hosted page your end users use to manage their API keys — embedded here so you can preview, test, and operate it as an admin. Every key you create lands in your real deployment. To put it in your app, either drop the same vanity URL in an iframe or render the React components from @wacht/react — both share the same data model.",
            primaryLabel: "Got it",
        },
        steps: [],
    },
    "first-webhooks": {
        id: "first-webhooks",
        version: 2,
        title: "Webhooks",
        // Same iframe constraint as first-api-auth — intro only, no spotlight.
        mode: "linear",
        intro: {
            title: "Managed webhook subscriptions",
            body: "What you see below is the live customer-facing webhook surface for this deployment. Your customers subscribe to events from your catalog; Wacht handles delivery, retries, signatures, and replay. To wire your own UI, drop the hosted vanity in an iframe or render @wacht/react components against the same backend. First step before any of this is useful: define your event catalog under Setup → Webhook Catalogs.",
            primaryLabel: "Got it",
        },
        steps: [],
    },
} satisfies Record<string, TourDefinition>;

export type TourId = keyof typeof tours;

export function getTour(id: TourId): TourDefinition {
    return tours[id];
}

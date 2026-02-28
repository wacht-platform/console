import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import Editor from "@monaco-editor/react";
import {
    IconCopy,
    IconCheck,
    IconBrandReact,
    IconBrandNextjs,
    IconBrandRust,
    IconBrandNodejs,
    IconBrandTypescript,
    IconInfoCircle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getCodeSnippets } from "./getting-started-snippets";
import { useTheme } from "@/lib/providers/theme";

function StepWrapper({
    number,
    children,
}: {
    number: number;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border/70 bg-card/70 p-5 md:p-6">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] text-primary">
                    {number}
                </div>
                <div className="h-px flex-1 bg-border/60" />
            </div>
            {children}
        </section>
    );
}

function PackageManagerSwitcher({ command }: { command: string }) {
    const managers = ["npm", "pnpm", "yarn", "bun"];
    const [active, setActive] = useState("npm");
    const [copied, setCopied] = useState(false);

    const getCommand = () => {
        const base = command.replace("npm install ", "");
        if (active === "npm") return `npm install ${base}`;
        if (active === "pnpm") return `pnpm add ${base}`;
        if (active === "yarn") return `yarn add ${base}`;
        if (active === "bun") return `bun add ${base}`;
        return command;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getCommand());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-2 py-1.5">
                <div className="flex gap-1">
                    {managers.map((m) => (
                        <button
                            key={m}
                            onClick={() => setActive(m)}
                            className={cn(
                                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                                active === m
                                    ? "bg-background dark:bg-white/10 text-foreground dark:text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground dark:hover:text-white",
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <IconCheck className="h-3 w-3" />
                    ) : (
                        <IconCopy className="h-3 w-3" />
                    )}
                </Button>
            </div>
            <div className="p-3 text-[12px]">
                <span className="select-none text-muted-foreground/50">$</span>{" "}
                <span className="text-primary">{getCommand()}</span>
            </div>
        </div>
    );
}

function AlertBlock({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="my-3 space-y-1.5 rounded-lg border border-border/70 bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                <IconInfoCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">
                    {title}
                </span>
            </div>
            <div className="text-[12px] leading-relaxed text-muted-foreground/90">
                {children}
            </div>
        </div>
    );
}

function CodeEditor({
    code,
    filename,
    language = "typescript",
}: {
    code: string;
    filename: string;
    language?: string;
}) {
    const [copied, setCopied] = useState(false);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const lineCount = code.split("\n").length;
    const height = Math.min(Math.max(lineCount * 22, 100), 500);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={cn(
                "flex flex-col rounded-lg border border-border/30 overflow-hidden shadow-sm group",
                isDark ? "bg-[#1e1e1e]" : "bg-white",
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-between px-3 py-2.5 border-b",
                    isDark
                        ? "bg-[#252526] border-white/3"
                        : "bg-zinc-100 border-zinc-200",
                )}
            >
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "text-[11px] font-medium tracking-tight",
                            isDark ? "text-zinc-400" : "text-zinc-600",
                        )}
                    >
                        {filename}
                    </span>
                </div>
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-5 w-5 transition-all flex-shrink-0",
                            isDark
                                ? "text-zinc-500 hover:text-zinc-300"
                                : "text-zinc-400 hover:text-zinc-600",
                        )}
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <IconCheck className="h-3 w-3 text-emerald-500" />
                        ) : (
                            <IconCopy className="h-3 w-3" />
                        )}
                    </Button>
                </div>
            </div>
            <div className="relative">
                <Editor
                    height={`${height}px`}
                    language={language}
                    value={code}
                    theme={isDark ? "vs-dark" : "light"}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                        lineNumbers: "off",
                        renderLineHighlight: "none",
                        fontFamily:
                            "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                        padding: { top: 0, bottom: 0 },
                        scrollbar: { vertical: "hidden", horizontal: "hidden" },
                        wordWrap: "on",
                        folding: false,
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        matchBrackets: "never",
                        renderWhitespace: "none",
                        glyphMargin: false,
                    }}
                />
            </div>
        </div>
    );
}

export default function GettingStartedPage() {
    const { deploymentSettings } = useCurrentDeployemnt();
    const publishableKey =
        deploymentSettings?.publishable_key || "pk_... (loading)";

    const [frameworkCategory, setFrameworkCategory] = useState<
        "frontend" | "backend"
    >("frontend");
    const [framework, setFramework] = useState<string>("react-router");
    const [activeExample, setActiveExample] = useState<string>("auth");

    const frameworks = useMemo(
        () =>
            frameworkCategory === "frontend"
                ? [
                      {
                          id: "react-router",
                          name: "React Router",
                          icon: IconBrandReact,
                          pkg: "@wacht/react-router",
                      },
                      {
                          id: "nextjs",
                          name: "Next.js",
                          icon: IconBrandNextjs,
                          pkg: "@wacht/nextjs",
                      },
                      {
                          id: "tanstack",
                          name: "TanStack",
                          icon: IconBrandTypescript,
                          pkg: "@wacht/tanstack-router",
                      },
                  ]
                : [
                      {
                          id: "rust",
                          name: "Rust",
                          icon: IconBrandRust,
                          pkg: "wacht",
                      },
                      {
                          id: "nodejs",
                          name: "Node.js",
                          icon: IconBrandNodejs,
                          pkg: "@wacht/node-sdk",
                      },
                  ],
        [frameworkCategory],
    );

    const activeFramework =
        frameworks.find((f) => f.id === framework) || frameworks[0];

    useEffect(() => {
        if (!frameworks.find((f) => f.id === framework)) {
            setFramework(frameworks[0].id);
        }

        if (
            frameworkCategory === "frontend" &&
            !["auth", "tenancy", "notifications"].includes(activeExample)
        ) {
            setActiveExample("auth");
        } else if (
            frameworkCategory === "backend" &&
            !["verification", "management", "webhooks"].includes(activeExample)
        ) {
            setActiveExample("verification");
        }
    }, [frameworkCategory, frameworks, framework, activeExample]);

    const code = getCodeSnippets({
        frameworkCategory,
        activeFramework,
        activeExample,
        framework,
    });

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-8 space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <Heading className="text-3xl tracking-tight md:text-2xl">
                        Quickstart
                    </Heading>
                    <div className="min-w-42.5">
                        <Select
                            value={activeExample}
                            onValueChange={setActiveExample}
                        >
                            <SelectTrigger className="h-9 border-border/70 bg-background text-[12px] w-full">
                                <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {frameworkCategory === "frontend" ? (
                                    <>
                                        <SelectItem value="auth">
                                            Authentication
                                        </SelectItem>
                                        <SelectItem value="tenancy">
                                            Multi-tenancy
                                        </SelectItem>
                                        <SelectItem value="notifications">
                                            Notifications
                                        </SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="verification">
                                            Verify Token
                                        </SelectItem>
                                        <SelectItem value="management">
                                            User Management
                                        </SelectItem>
                                        <SelectItem value="webhooks">
                                            Webhooks
                                        </SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Text className="max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
                    Secure your application with Wacht in minutes. Select your
                    framework and follow the steps to complete the integration.
                </Text>

                <div className="flex flex-col items-start gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex rounded-lg border border-border/70 bg-background p-0.5">
                        <button
                            onClick={() => setFrameworkCategory("frontend")}
                            className={cn(
                                "rounded-md px-3.5 py-1 text-[12px] transition-all",
                                frameworkCategory === "frontend"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            Frontend
                        </button>
                        <button
                            onClick={() => setFrameworkCategory("backend")}
                            className={cn(
                                "rounded-md px-3.5 py-1 text-[12px] transition-all",
                                frameworkCategory === "backend"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            Backend
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {frameworks.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFramework(f.id)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-all",
                                    activeFramework.id === f.id
                                        ? "border-primary/30 bg-primary/10 text-primary"
                                        : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <f.icon className="h-3.5 w-3.5" />
                                <span className="text-[12px] font-medium">
                                    {f.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full space-y-4">
                <StepWrapper number={1}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
                        <div className="space-y-2">
                            <h3 className="text-lg tracking-tight">
                                Install {activeFramework.name} SDK
                            </h3>
                            <p className="text-[13px] leading-relaxed text-muted-foreground">
                                Run the following command in your terminal to
                                install the official {activeFramework.name}{" "}
                                library for Wacht.
                            </p>
                        </div>
                        <PackageManagerSwitcher command={code.installCmd} />
                    </div>
                </StepWrapper>

                <StepWrapper number={2}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
                        <div className="space-y-2">
                            <h3 className="text-lg tracking-tight">
                                Configure API Keys
                            </h3>
                            <p className="text-[13px] leading-relaxed text-muted-foreground">
                                Create a{" "}
                                <code className="px-1 py-0 bg-muted/50 rounded text-[11px]">
                                    .env
                                </code>{" "}
                                file in your project root and add your
                                publishable key.
                            </p>
                        </div>
                        <CodeEditor
                            filename=".env"
                            language="ini"
                            code={`${framework === "nextjs" ? "NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY" : "VITE_WACHT_PUBLISHABLE_KEY"}=${publishableKey}`}
                        />
                    </div>
                </StepWrapper>

                <StepWrapper number={3}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
                        <div className="space-y-2">
                            <h3 className="text-lg tracking-tight">
                                Initialize the Provider
                            </h3>
                            <p className="text-[13px] leading-relaxed text-muted-foreground">
                                Wrap your application with the{" "}
                                <code className="px-1 py-0 bg-muted/50 rounded text-[11px]">
                                    DeploymentProvider
                                </code>{" "}
                                to provide auth context.
                            </p>
                            {framework === "nextjs" &&
                                activeExample === "auth" && (
                                    <AlertBlock title="Note">
                                        If you are using Next.js 13+ with App
                                        Router, place this in your Root Layout
                                        or a Client Component.
                                    </AlertBlock>
                                )}
                        </div>
                        <CodeEditor
                            filename={
                                activeFramework.id === "nextjs"
                                    ? "app/layout.tsx"
                                    : "main.tsx"
                            }
                            code={code.setup}
                        />
                    </div>
                </StepWrapper>

                <StepWrapper number={4}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
                        <div className="space-y-2">
                            <h3 className="text-lg tracking-tight">
                                {activeExample === "auth"
                                    ? "Add Authentication UI"
                                    : activeExample === "tenancy"
                                      ? "Access Tenant Data"
                                      : activeExample === "notifications"
                                        ? "Add Notification UI"
                                        : activeExample === "verification"
                                          ? "Verify Session"
                                          : activeExample === "management"
                                            ? "Manage Resources"
                                            : "Handle Events"}
                            </h3>
                            <p className="text-[13px] leading-relaxed text-muted-foreground">
                                {activeExample === "auth"
                                    ? "Protect your routes using the SignedIn and SignedOut components to control access."
                                    : activeExample === "tenancy"
                                      ? "Access organization and tenant context anywhere in your application."
                                      : activeExample === "notifications"
                                        ? "Display a notification bell with unread badge and dropdown management."
                                        : activeExample === "verification"
                                          ? "Verify incoming requests and retrieve session details in your API."
                                          : activeExample === "management"
                                            ? "Programmatically manage organizations, users, and other resources."
                                            : "Securely handle asynchronous events from Wacht using webhooks."}
                            </p>
                        </div>
                        <CodeEditor
                            filename={
                                activeExample === "notifications"
                                    ? "navbar.tsx"
                                    : activeExample === "tenancy"
                                      ? "profile.tsx"
                                      : activeExample === "verification"
                                        ? activeFramework.id === "rust"
                                            ? "middleware.rs"
                                            : "middleware.ts"
                                        : activeExample === "management"
                                          ? activeFramework.id === "rust"
                                              ? "service.rs"
                                              : "service.ts"
                                          : activeExample === "webhooks"
                                            ? activeFramework.id === "rust"
                                                ? "webhook.rs"
                                                : "webhook.ts"
                                            : activeFramework.id === "nextjs"
                                              ? "page.tsx"
                                              : "App.tsx"
                            }
                            code={code.usage}
                        />
                    </div>
                </StepWrapper>
            </div>
        </div>
    );
}

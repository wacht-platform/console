import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { CodeEditor as SharedCodeEditor, type CodeLanguage } from "@/components/code-editor";
import {
  IconCopy,
  IconCheck,
  IconBrandReact,
  IconBrandNextjs,
  IconBrandRust,
  IconBrandNodejs,
  IconBrandTypescript,
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

export interface CodeFile {
  code: string;
  filename: string;
  language?: string;
}

interface CodeEditorProps {
  code?: string;
  filename?: string;
  language?: string;
  files?: CodeFile[];
}

function CodeEditor({
  code,
  filename,
  language = "typescript",
  files,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const displayFiles = useMemo(() => {
    if (files && files.length > 0) return files;
    if (code) return [{ code, filename: filename || "code", language }];
    return [];
  }, [files, code, filename, language]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeFile = displayFiles[activeIndex] || {
    code: "",
    filename: "",
    language: "typescript",
  };

  const lineCount = activeFile.code.split("\n").length;
  const height = Math.min(Math.max(lineCount * 22, 100), 500);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border/30 overflow-hidden shadow-sm group bg-background",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b",
          displayFiles.length > 1 ? "pr-3 pt-2" : "px-3 py-2.5",
          "bg-muted/30 border-border/70",
        )}
      >
        <div
          className={cn(
            "flex items-center no-scrollbar overflow-x-auto",
            displayFiles.length > 1 ? "gap-1 px-2" : "gap-2",
          )}
        >
          {displayFiles.length > 1 ? (
            displayFiles.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "px-3 py-[6px] text-[11px] font-medium tracking-tight whitespace-nowrap border-b-[2px] transition-colors relative top-[1px]",
                  activeIndex === idx
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/50",
                )}
              >
                {f.filename}
              </button>
            ))
          ) : (
            <span
              className={cn(
                "text-[11px] font-medium tracking-tight text-muted-foreground",
              )}
            >
              {activeFile.filename}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-5 w-5 transition-all flex-shrink-0",
              "text-muted-foreground hover:text-foreground",
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
        <SharedCodeEditor
          value={activeFile.code}
          language={((activeFile.language === "ini" ? "text" : activeFile.language) || "typescript") as CodeLanguage}
          readOnly
          minHeight={height}
        />
      </div>
    </div>
  );
}

export default function GettingStartedPage() {
  const { deploymentSettings } = useCurrentDeployemnt();
  const publishableKey =
    deploymentSettings?.publishable_key || "pk_... (loading)";
  const secretKey = "sk_test_...";

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
      !["auth", "tenancy", "notifications", "api-keys", "webhooks"].includes(
        activeExample,
      )
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
            <Select value={activeExample} onValueChange={setActiveExample}>
              <SelectTrigger className="h-9 border-border/70 bg-background text-[12px] w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent align="end">
                {frameworkCategory === "frontend" ? (
                  <>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="tenancy">Multi-tenancy</SelectItem>
                    <SelectItem value="notifications">Notifications</SelectItem>
                    <SelectItem value="api-keys">API Keys</SelectItem>
                    <SelectItem value="webhooks">Webhooks</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="verification">Verify Token</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Text className="max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
          Secure your application with Wacht in minutes. Select your framework
          and follow the steps to complete the integration.
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
                <span className="text-[12px] font-medium">{f.name}</span>
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
                Run the following command in your terminal to install the
                official {activeFramework.name} library for Wacht.
              </p>
            </div>
            <PackageManagerSwitcher command={code.installCmd} />
          </div>
        </StepWrapper>

        <StepWrapper number={2}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h3 className="text-lg tracking-tight">Configure API Keys</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Create a{" "}
                <code className="px-1 py-0 bg-muted/50 rounded text-[11px]">
                  .env
                </code>{" "}
                file in your project root and add your{" "}
                {frameworkCategory === "frontend" ? "publishable" : "secret"}{" "}
                key.
              </p>
            </div>
            <CodeEditor
              filename=".env"
              language="ini"
              code={
                frameworkCategory === "frontend"
                  ? `${framework === "nextjs" ? "NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY" : "VITE_WACHT_PUBLISHABLE_KEY"}=${publishableKey}`
                  : `WACHT_PUBLISHABLE_KEY=${publishableKey}\nWACHT_API_KEY=${secretKey}`
              }
            />
          </div>
        </StepWrapper>

        <StepWrapper number={3}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h3 className="text-lg tracking-tight">Initialize the Client</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {frameworkCategory === "frontend"
                  ? "Wrap your application with the DeploymentProvider to provide auth context."
                  : "Initialize the Wacht client in your backend application."}
              </p>
            </div>
            <CodeEditor
              filename={
                frameworkCategory === "frontend"
                  ? activeFramework.id === "nextjs"
                    ? "app/layout.tsx"
                    : "main.tsx"
                  : activeFramework.id === "rust"
                    ? "main.rs"
                    : "src/index.ts"
              }
              language={activeFramework.id === "rust" ? "rust" : "typescript"}
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
                      : activeExample === "api-keys"
                        ? "Manage API Keys"
                        : activeExample === "webhooks" &&
                          frameworkCategory === "frontend"
                          ? "Monitor Webhooks"
                          : activeExample === "verification"
                            ? "Verify Session"
                            : "Handle Events"}
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {activeExample === "auth"
                  ? "Protect your routes using the SignedIn and SignedOut components to control access."
                  : activeExample === "tenancy"
                    ? "Access organization and tenant context anywhere in your application."
                    : activeExample === "notifications"
                      ? "Display a notification bell with unread badge and dropdown management."
                      : activeExample === "api-keys"
                        ? "Empower users to generate and revoke API keys with a ready-made UI."
                        : activeExample === "webhooks" &&
                          frameworkCategory === "frontend"
                          ? "View webhook integrations, deliveries, and analytics directly in your app."
                          : activeExample === "verification"
                            ? "Verify incoming requests and retrieve session details in your API."
                            : "Securely handle asynchronous events from Wacht using webhooks."}
              </p>
            </div>
            {Array.isArray(code.usage) ? (
              <CodeEditor files={code.usage} />
            ) : (
              <CodeEditor
                filename={
                  activeExample === "notifications"
                    ? "navbar.tsx"
                    : activeExample === "tenancy"
                      ? "profile.tsx"
                      : activeExample === "api-keys"
                        ? "api-keys.tsx"
                        : activeExample === "webhooks" &&
                          frameworkCategory === "frontend"
                          ? "webhooks.tsx"
                          : activeExample === "verification"
                            ? activeFramework.id === "rust"
                              ? "middleware.rs"
                              : "middleware.ts"
                            : activeFramework.id === "nextjs"
                              ? "page.tsx"
                              : "App.tsx"
                }
                language={activeFramework.id === "rust" ? "rust" : "typescript"}
                code={code.usage as string}
              />
            )}
          </div>
        </StepWrapper>
      </div>
    </div>
  );
}

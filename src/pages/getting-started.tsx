import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
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
import { PageHead } from "@/components/ui/page-head";
import { Segmented } from "@/components/ui/segmented";
import {
  CodeEditor as SharedCodeEditor,
  type CodeLanguage,
} from "@/components/code-editor";
import { getCodeSnippets } from "./getting-started-snippets";

function Step({
  number,
  title,
  body,
  children,
}: {
  number: number;
  title: React.ReactNode;
  body: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[44px_1fr] gap-4 border-b border-border py-7 first:pt-0 last:border-b-0 md:gap-5">
      <div className="pt-0.5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 font-mono text-[12px] font-medium text-primary">
          {String(number).padStart(2, "0")}
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-medium tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 mb-4 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          {body}
        </p>
        {children}
      </div>
    </div>
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

  const fullCommand = getCommand();
  const commandPkg = fullCommand.split(" ").pop() ?? "";
  const commandHead = fullCommand
    .slice(0, fullCommand.length - commandPkg.length)
    .trimEnd();

  const handleCopy = () => {
    navigator.clipboard.writeText(getCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-secondary">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-2 py-1.5">
        <div className="flex gap-1">
          {managers.map((m) => (
            <button
              key={m}
              onClick={() => setActive(m)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                active === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
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
      <div className="p-3 font-mono text-[12px] leading-relaxed">
        <span className="select-none text-muted-foreground">$</span>{" "}
        <span style={{ color: "var(--code-keyword)" }}>{commandHead}</span>{" "}
        <span style={{ color: "var(--code-string)" }}>{commandPkg}</span>
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
  const height = Math.min(lineCount * 20 + 24, 480);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-secondary pr-2 pl-3.5">
        {displayFiles.length > 1 ? (
          <div className="no-scrollbar -mb-px flex items-center gap-1 self-end overflow-x-auto pt-1.5">
            {displayFiles.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "whitespace-nowrap rounded-t-md border border-b-0 px-3 py-1.5 font-mono text-[11px] transition-colors",
                  activeIndex === idx
                    ? "border-border bg-card text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {f.filename}
              </button>
            ))}
          </div>
        ) : (
          <span className="py-2.5 font-mono text-[11px] text-muted-foreground">
            {activeFile.filename}
          </span>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <IconCheck className="h-3 w-3 text-emerald-500" />
          ) : (
            <IconCopy className="h-3 w-3" />
          )}
        </Button>
      </div>
      {activeFile.language === "ini" ? (
        <pre className="no-scrollbar overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
          {activeFile.code.split("\n").map((line, i) => {
            const eq = line.indexOf("=");
            if (eq === -1) {
              return <div key={i}>{line || " "}</div>;
            }
            return (
              <div key={i}>
                <span style={{ color: "var(--code-keyword)" }}>
                  {line.slice(0, eq)}
                </span>
                <span className="text-muted-foreground">=</span>
                <span style={{ color: "var(--code-string)" }}>
                  {line.slice(eq + 1)}
                </span>
              </div>
            );
          })}
        </pre>
      ) : (
        <SharedCodeEditor
          value={activeFile.code}
          language={(activeFile.language || "typescript") as CodeLanguage}
          readOnly
          chrome="flush"
          minHeight={height}
        />
      )}
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
            pkg: "@wacht/backend",
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

  const exampleOptions: { value: string; label: string }[] =
    frameworkCategory === "frontend"
      ? [
          { value: "auth", label: "Authentication" },
          { value: "tenancy", label: "Multi-tenancy" },
          { value: "notifications", label: "Notifications" },
          { value: "api-keys", label: "API Keys" },
          { value: "webhooks", label: "Webhooks" },
        ]
      : [{ value: "verification", label: "Verify Token" }];

  return (
    <div className="animate-in fade-in duration-300">
      <PageHead
        eyebrow="Integration"
        title="Quickstart"
        sub="Secure your application with Wacht in minutes. Pick a framework and follow the steps."
        actions={
          <Segmented
            value={frameworkCategory}
            onChange={(v) => setFrameworkCategory(v as "frontend" | "backend")}
            options={[
              { value: "frontend", label: "Frontend" },
              { value: "backend", label: "Backend" },
            ]}
          />
        }
      />

      <div className="mb-7 flex flex-wrap items-center gap-3">
        <Segmented
          value={framework}
          onChange={setFramework}
          options={frameworks.map((f) => ({ value: f.id, label: f.name }))}
        />
        <div className="flex-1" />
        <Segmented
          value={activeExample}
          onChange={setActiveExample}
          options={exampleOptions}
        />
      </div>

      <div className="w-full">
        <Step
          number={1}
          title={`Install ${activeFramework.name} SDK`}
          body={`Run the following command in your terminal to install the official ${activeFramework.name} library for Wacht.`}
        >
          <PackageManagerSwitcher command={code.installCmd} />
        </Step>

        <Step
          number={2}
          title="Configure API keys"
          body={
            <>
              Create a{" "}
              <code className="rounded bg-secondary px-1 font-mono text-[11px]">
                .env
              </code>{" "}
              file in your project root and add your{" "}
              {frameworkCategory === "frontend" ? "publishable" : "secret"} key.
            </>
          }
        >
          <CodeEditor
            filename=".env"
            language="ini"
            code={
              frameworkCategory === "frontend"
                ? `${framework === "nextjs" ? "NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY" : "VITE_WACHT_PUBLISHABLE_KEY"}=${publishableKey}`
                : `WACHT_PUBLISHABLE_KEY=${publishableKey}\nWACHT_API_KEY=${secretKey}`
            }
          />
        </Step>

        <Step
          number={3}
          title="Initialize the client"
          body={
            frameworkCategory === "frontend"
              ? "Wrap your application with the DeploymentProvider to provide auth context."
              : "Initialize the Wacht client in your backend application."
          }
        >
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
        </Step>

        <Step
          number={4}
          title={
            activeExample === "auth"
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
                        : "Handle Events"
          }
          body={
            activeExample === "auth"
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
                        : "Securely handle asynchronous events from Wacht using webhooks."
          }
        >
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
        </Step>
      </div>
    </div>
  );
}

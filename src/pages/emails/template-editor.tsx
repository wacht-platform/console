import { useState, useEffect, useRef } from "react";
import type { EditorView } from "@codemirror/view";
import { useParams, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { EmailTemplate } from "@/types/deployment";
import { useEmailTemplate } from "@/lib/api/hooks/use-email-templates";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { Spinner } from "@/components/ui/app-spinner";
import { InlineLoader } from "@/components/ui/loading-screen";
import { toast } from "sonner";
import { getTemplateVariables } from "@/lib/email-template-variables";
import { CodeEditor } from "@/components/code-editor";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import AdvancedEditor from "@/components/editor/advanced-editor";
import { cn } from "@/lib/utils";

function SplitInput({
  value,
  onChange,
  suffix,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  placeholder?: string;
}) {
  return (
    <div className="flex h-9 overflow-hidden rounded-md border border-border focus-within:border-ring">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-background px-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <span className="flex items-center whitespace-nowrap border-l border-border bg-secondary px-2 font-mono text-[11px] text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-0">
      <p className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function SettingField({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-foreground">
        {label}
      </label>
      {children}
      {note ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

function VarGroup({
  title,
  count,
  expanded,
  children,
}: {
  title: string;
  count?: number;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!expanded);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between px-3 text-xs font-medium text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <ChevronRightIcon
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
          {title}
        </span>
        {count != null ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {count}
          </span>
        ) : null}
      </button>
      {open ? <div className="pb-2">{children}</div> : null}
    </div>
  );
}

function VarItem({
  name,
  v,
  onInsert,
}: {
  name: string;
  v: string;
  onInsert: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onInsert();
      }}
      className="flex w-full items-center justify-between gap-2 py-1.5 pl-7 pr-3 text-left transition-colors hover:bg-secondary"
    >
      <span className="truncate text-xs text-foreground">{name}</span>
      <code className="shrink-0 rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
        {`{{${v}}}`}
      </code>
    </button>
  );
}

export default function EmailTemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const joditRef = useRef<any>(null);
  const codeMirrorRef = useRef<EditorView | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");
  const [varQuery, setVarQuery] = useState("");

  const { emailTemplate, isLoading, error, updateTemplate } = useEmailTemplate(
    templateId!
  );
  const { deploymentSettings } = useCurrentDeployemnt();

  const [formData, setFormData] = useState<EmailTemplate>({
    template_name: "",
    template_data: "",
    template_from: "",
    template_reply_to: "",
    template_subject: "",
  });

  useEffect(() => {
    if (emailTemplate && !isLoading && !error) {
      setFormData({
        template_name: emailTemplate.template_name,
        template_data: emailTemplate.template_data,
        template_from: emailTemplate.template_from,
        template_reply_to: emailTemplate.template_reply_to,
        template_subject: emailTemplate.template_subject,
      });
    }
  }, [templateId, emailTemplate, isLoading, error]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditorChange = (html: string) => {
    setFormData((prev) => ({
      ...prev,
      template_data: html,
    }));
  };

  const handleEditorInit = (jodit: any) => {
    joditRef.current = jodit;
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      await updateTemplate(formData);
      toast.success("Email template saved successfully!");
    } catch (error) {
      toast.error("Failed to save email template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const insertVariable = (variable: string) => {
    const text = `{{${variable}}}`;

    // Insert into Jodit Visual Editor
    if (activeTab === "visual" && joditRef.current) {
      const jodit = joditRef.current;
      jodit.s.insertHTML(text);
    }
    else if (activeTab === "code" && codeMirrorRef.current) {
      const view = codeMirrorRef.current;
      const selection = view.state.selection.main;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        selection: { anchor: selection.from + text.length },
      });
      view.focus();
    }
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">Error loading template</p>
        <Button onClick={handleBack} className="mt-4">
          Back to templates
        </Button>
      </div>
    );
  }

  const mailHost = deploymentSettings?.mail_from_host
    ? `@${deploymentSettings.mail_from_host}`
    : "@…";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Email template
          </p>
          <h1 className="mt-1 text-xl font-medium tracking-tight text-foreground">
            {formData.template_name || "Email template"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize the content, sender and variables for this transactional
            email.
          </p>
        </div>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving…
            </>
          ) : (
            "Save template"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* Left: settings */}
        <aside className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">Settings</p>
            </div>
            <SettingsSection title="Template">
              <SettingField label="Name" note="Internal reference only.">
                <Input
                  value={formData.template_name}
                  onChange={(e) =>
                    handleInputChange("template_name", e.target.value)
                  }
                  placeholder="Welcome email"
                />
              </SettingField>
              <SettingField label="Subject">
                <Input
                  className="font-mono text-xs"
                  value={formData.template_subject}
                  onChange={(e) =>
                    handleInputChange("template_subject", e.target.value)
                  }
                  placeholder="Welcome to {{app.name}}!"
                />
              </SettingField>
            </SettingsSection>
            <SettingsSection title="Sender">
              <SettingField label="From">
                <SplitInput
                  value={formData.template_from}
                  onChange={(v) => handleInputChange("template_from", v)}
                  suffix={mailHost}
                  placeholder="noreply"
                />
              </SettingField>
              <SettingField label="Reply-to">
                <SplitInput
                  value={formData.template_reply_to}
                  onChange={(v) => handleInputChange("template_reply_to", v)}
                  suffix={mailHost}
                  placeholder="support"
                />
              </SettingField>
            </SettingsSection>
          </div>
        </aside>

        {/* Center: editor */}
        <main className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-secondary px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Subject
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {formData.template_subject || "No subject set"}
                  </p>
                </div>
                <Segmented
                  value={activeTab}
                  onChange={setActiveTab}
                  options={[
                    { value: "visual", label: "Visual" },
                    { value: "code", label: "Code" },
                  ]}
                />
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                <span className="text-muted-foreground/60">from</span>{" "}
                {formData.template_from || "noreply"}
                {mailHost}
              </p>
            </div>

            <div className="wa-editor-light bg-card">
              {activeTab === "visual" ? (
                <AdvancedEditor
                  value={formData.template_data}
                  onChange={handleEditorChange}
                  onEditorInit={handleEditorInit}
                />
              ) : (
                <CodeEditor
                  value={formData.template_data}
                  language="html"
                  minHeight={520}
                  chrome="flush"
                  onChange={(value) => handleEditorChange(value || "")}
                  onCreateEditor={(view) => {
                    codeMirrorRef.current = view;
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-secondary px-4 py-2 font-mono text-[11px] text-muted-foreground">
              <span>
                {activeTab === "visual" ? "Visual editor" : "HTML source"}
              </span>
              <span>·</span>
              <span>
                {(formData.template_data || "").length.toLocaleString()} chars
              </span>
            </div>
          </div>
        </main>

        {/* Right: variables */}
        <aside className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Variables</p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  click to insert
                </span>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 font-mono text-xs"
                  placeholder="Search variables…"
                  value={varQuery}
                  onChange={(e) => setVarQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {templateId
                ? getTemplateVariables(templateId).map((category, index) => {
                    const q = varQuery.trim().toLowerCase();
                    const items = category.variables.filter(
                      (variable) =>
                        !q ||
                        `${variable.label} ${variable.key}`
                            .toLowerCase()
                            .includes(q),
                    );
                    if (items.length === 0) return null;
                    return (
                      <VarGroup
                        key={`${category.category}-${q ? "s" : "n"}`}
                        title={category.category}
                        count={items.length}
                        expanded={!!q || index < 2}
                      >
                        {items.map((variable) => (
                          <VarItem
                            key={variable.key}
                            name={variable.label}
                            v={variable.key}
                            onInsert={() => insertVariable(variable.key)}
                          />
                        ))}
                      </VarGroup>
                    );
                  })
                : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

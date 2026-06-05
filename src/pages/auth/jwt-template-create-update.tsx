import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import type { EditorView } from "@codemirror/view";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"
import { DeploymentJWTTemplate } from "@/types/deployment";
import { CodeEditor } from "@/components/code-editor";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useDeploymentJWTTemplates } from "@/lib/api/hooks/use-deployment-jwt-templates";
import { Button } from "@/components/ui/button";
import { TrashIcon, DocumentDuplicateIcon, CheckCircleIcon, SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/app-spinner";
import { toast } from 'sonner';
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";

const VAR_GROUPS: {
  title: string;
  open?: boolean;
  match: (value: string) => boolean;
}[] = [
  {
    title: "Session",
    open: true,
    match: (v) => v.startsWith("id") || v.startsWith("session_id"),
  },
  { title: "User", open: true, match: (v) => v.startsWith("user.") },
  { title: "Email", match: (v) => v.includes("email") },
  { title: "Phone", match: (v) => v.includes("phone") },
  {
    title: "Session details",
    match: (v) =>
      ["ip_address", "browser", "device", "city", "region", "country"].some(
        (k) => v.includes(k),
      ),
  },
  { title: "Organization", match: (v) => v.startsWith("active_organization") },
  { title: "Workspace", match: (v) => v.startsWith("active_workspace") },
];

function VarGroup({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-border last:border-b-0"
    >
      <summary className="flex h-8 cursor-pointer list-none items-center justify-between px-3.5 hover:bg-accent/50">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <ChevronRightIcon className="size-3 text-muted-foreground transition-transform group-open:rotate-90" />
          {title}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {count}
        </span>
      </summary>
      <div className="pb-1.5">{children}</div>
    </details>
  );
}

function VarItem({
  name,
  value,
  onInsert,
}: {
  name: string;
  value: string;
  onInsert: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert(value)}
      className="flex w-full flex-col gap-0.5 py-1.5 pl-7 pr-3.5 text-left transition-colors hover:bg-accent"
    >
      <span className="text-xs font-medium text-foreground">{name}</span>
      <span className="truncate font-mono text-[10px] text-muted-foreground">
        {`{{${value}}}`}
      </span>
    </button>
  );
}

export default function JWTTemplateCreateUpdatePage() {
  const { templateId } = useParams();
  const { selectedDeployment } = useProjects();
  const navigate = useNavigate();
  const {
    createJWTTemplate,
    isCreatingJWTTemplate,
    updateJWTTemplate,
    isUpdatingJWTTemplate,
    jwtTemplates,
    deleteJWTTemplate,
    isDeletingJWTTemplate,
  } = useDeploymentJWTTemplates();
  const [claims, setClaims] = useState<string>("{}");

  const [formData, setFormData] = useState<Partial<DeploymentJWTTemplate>>({
    name: "",
    token_lifetime: 60,
    allowed_clock_skew: 5,
    custom_signing_key: null,
    template: {},
  });

  const [isCustomSigningKey, setIsCustomSigningKey] = useState(false);
  const [signingAlgorithm, setSigningAlgorithm] = useState("HS256");
  const [secretKey, setSecretKey] = useState("");
  const editorRef = useRef<EditorView | null>(null);
  const isEditMode = !!templateId;
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (templateId && jwtTemplates) {
      const template = jwtTemplates.find((t) => t.id === templateId);
      if (template) {
        setFormData(template);
        setClaims(JSON.stringify(template.template || {}, null, 2));
        setIsCustomSigningKey(!!template.custom_signing_key?.enabled);
        if (template.custom_signing_key) {
          setSigningAlgorithm(template.custom_signing_key.algorithm || "HS256");
          setSecretKey(template.custom_signing_key.key || "");
        }
      }
    }
  }, [templateId, jwtTemplates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const availableVariables = [
    { label: "Signin ID", value: "id" },
    { label: "Session ID", value: "session_id" },
    { label: "User ID", value: "user.id" },
    { label: "User First Name", value: "user.first_name" },
    { label: "User Last Name", value: "user.last_name" },
    { label: "User Username", value: "user.username" },
    { label: "User Profile Picture URL", value: "user.profile_picture_url" },
    { label: "User Has Profile Picture", value: "user.has_profile_picture" },
    { label: "User Availability", value: "user.availability" },
    { label: "User Disabled", value: "user.disabled" },
    { label: "User Last Password Reset", value: "user.last_password_reset_at" },
    { label: "User Schema Version", value: "user.schema_version" },
    { label: "User 2FA Policy", value: "user.second_factor_policy" },
    { label: "User Backup Codes Generated", value: "user.backup_codes_generated" },
    { label: "User Public Metadata", value: "user.public_metadata" },

    // Primary Email
    { label: "Email ID", value: "user.primary_email_address.id" },
    { label: "Email Address", value: "user.primary_email_address.email_address" },
    { label: "Email Verified", value: "user.primary_email_address.verified" },
    { label: "Email Verified At", value: "user.primary_email_address.verified_at" },
    { label: "Email Verification Strategy", value: "user.primary_email_address.verification_strategy" },

    // Primary Phone
    { label: "Phone ID", value: "user.primary_phone_number.id" },
    { label: "Phone Number", value: "user.primary_phone_number.phone_number" },
    { label: "Phone Verified", value: "user.primary_phone_number.verified" },
    { label: "Phone Verified At", value: "user.primary_phone_number.verified_at" },

    // Session/Signin Details
    { label: "IP Address", value: "ip_address" },
    { label: "Browser", value: "browser" },
    { label: "Device", value: "device" },
    { label: "City", value: "city" },
    { label: "Region", value: "region" },
    { label: "Region Code", value: "region_code" },
    { label: "Country", value: "country" },
    { label: "Country Code", value: "country_code" },
    { label: "Last Active At", value: "last_active_at" },
    { label: "Expires At", value: "expires_at" },

    // Active Organization Membership
    { label: "Active Org Membership ID", value: "active_organization_membership.id" },
    { label: "Active Org Membership Public Metadata", value: "active_organization_membership.public_metadata" },
    { label: "Active Org ID", value: "active_organization_membership.organization.id" },
    { label: "Active Org Name", value: "active_organization_membership.organization.name" },
    { label: "Active Org Image URL", value: "active_organization_membership.organization.image_url" },
    { label: "Active Org Description", value: "active_organization_membership.organization.description" },
    { label: "Active Org Member Count", value: "active_organization_membership.organization.member_count" },
    { label: "Active Org Public Metadata", value: "active_organization_membership.organization.public_metadata" },

    // Active Workspace Membership
    { label: "Active Workspace Membership ID", value: "active_workspace_membership.id" },
    { label: "Active Workspace Membership Public Metadata", value: "active_workspace_membership.public_metadata" },
    { label: "Active Workspace ID", value: "active_workspace_membership.workspace.id" },
    { label: "Active Workspace Name", value: "active_workspace_membership.workspace.name" },
    { label: "Active Workspace Image URL", value: "active_workspace_membership.workspace.image_url" },
    { label: "Active Workspace Description", value: "active_workspace_membership.workspace.description" },
    { label: "Active Workspace Member Count", value: "active_workspace_membership.workspace.member_count" },
    { label: "Active Workspace Public Metadata", value: "active_workspace_membership.workspace.public_metadata" },
  ];

  const insertVariable = (variable: string) => {
    if (!editorRef.current) return;

    const view = editorRef.current;
    const text = `{{${variable}}}`;
    const selection = view.state.selection.main;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length },
    });
    view.focus();
  };

  const handleClaimsChange = (value: string | undefined) => {
    const next = value ?? "";
    setClaims(next);
    try {
      setFormData((prev) => ({ ...prev, template: JSON.parse(next) }));
    } catch {
      // Keep the last valid template until the JSON parses again.
    }
  };

  const handleFormatClaims = () => {
    try {
      const parsed = JSON.parse(claims);
      setClaims(JSON.stringify(parsed, null, 2));
      setFormData((prev) => ({ ...prev, template: parsed }));
    } catch {
      toast.error("Invalid JSON");
    }
  };

  let isValidClaims = true;
  try {
    JSON.parse(claims);
  } catch {
    isValidClaims = false;
  }
  const claimsVariableCount = (claims.match(/\{\{/g) ?? []).length;



  const toggleCustomSigningKey = (checked: boolean) => {
    setIsCustomSigningKey(checked);
    if (!checked) {
      setFormData((prev) => ({ ...prev, custom_signing_key: null }));
    }
  };

  const handleAlgorithmChange = (value: string) => {
    setSigningAlgorithm(value);
  };

  const handleSecretKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSecretKey(e.target.value);
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setValidationError("Please provide a template name");
      return false;
    }

    if (formData.token_lifetime! <= 0) {
      setValidationError("Token lifetime must be greater than 0");
      return false;
    }

    if (formData.allowed_clock_skew! < 0) {
      setValidationError("Allowed clock skew must be 0 or greater");
      return false;
    }

    if (isCustomSigningKey && !secretKey.trim()) {
      setValidationError("Please provide a secret key");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const finalFormData = { ...formData };

    if (isCustomSigningKey) {
      finalFormData.custom_signing_key = {
        enabled: true,
        algorithm: signingAlgorithm,
        key: secretKey,
      };
    } else {
      finalFormData.custom_signing_key = null;
    }

    try {
      if (isEditMode && templateId) {
        const templateWithId: DeploymentJWTTemplate = {
          ...finalFormData,
          id: templateId,
          deployment_id: selectedDeployment!.id,
          created_at: formData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: formData.deleted_at || null,
        } as DeploymentJWTTemplate;

        await updateJWTTemplate(templateWithId);
        toast.success("JWT template updated successfully!");
        navigate("../");
      } else {
        await createJWTTemplate(finalFormData as DeploymentJWTTemplate);
        toast.success("JWT template created successfully!");
        navigate("../");
      }
    } catch (error) {
      const errorMessage = `Failed to ${isEditMode ? "update" : "create"} JWT template`;
      setValidationError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    }
  };

  async function handleDeleteTemplate() {
    setConfirmDeleteOpen(true);
  }

  async function confirmDeleteTemplate() {
    if (!templateId) return;

    try {
      await deleteJWTTemplate(templateId);
      toast.success("JWT template deleted successfully!");
      navigate("../");
    } catch (error) {
      toast.error("Failed to delete JWT template");
      console.error(error);
    } finally {
      setConfirmDeleteOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            JWT template
          </div>
          <h1 className="mt-0.5 text-xl font-normal tracking-tight text-foreground">
            {isEditMode ? "Edit template" : "New template"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isEditMode && (
            <Button
              variant="destructive"
              size="icon"
              className="size-9"
              onClick={handleDeleteTemplate}
              disabled={isDeletingJWTTemplate}
            >
              {isDeletingJWTTemplate ? (
                <Spinner className="size-4" />
              ) : (
                <TrashIcon className="size-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isCreatingJWTTemplate || isUpdatingJWTTemplate}
          >
            {isCreatingJWTTemplate || isUpdatingJWTTemplate
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update template"
                : "Create template"}
          </Button>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 text-destructive rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {validationError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* LEFT — settings */}
        <aside className="min-w-0">
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-3 p-4">
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Template
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Name
                </label>
                <Input
                  name="name"
                  className="h-8"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. API access token"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Token
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Lifetime
                </label>
                <div className="relative">
                  <Input
                    name="token_lifetime"
                    type="number"
                    min="1"
                    className="h-8 pr-16"
                    value={formData.token_lifetime}
                    onChange={handleNumberInputChange}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">
                    seconds
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Allowed clock skew
                </label>
                <div className="relative">
                  <Input
                    name="allowed_clock_skew"
                    type="number"
                    min="0"
                    className="h-8 pr-16"
                    value={formData.allowed_clock_skew}
                    onChange={handleNumberInputChange}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">
                    seconds
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Signing
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  Custom signing key
                </span>
                <Switch
                  checked={isCustomSigningKey}
                  onCheckedChange={toggleCustomSigningKey}
                />
              </div>
              {isCustomSigningKey && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Algorithm
                    </label>
                    <Listbox
                      name="signing_algorithm"
                      value={signingAlgorithm}
                      onChange={handleAlgorithmChange}
                      className="w-full"
                    >
                      <ListboxOption value="HS256">
                        <ListboxLabel>HS256</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="HS384">
                        <ListboxLabel>HS384</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="HS512">
                        <ListboxLabel>HS512</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="RS256">
                        <ListboxLabel>RS256</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="RS384">
                        <ListboxLabel>RS384</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="RS512">
                        <ListboxLabel>RS512</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="ES256">
                        <ListboxLabel>ES256</ListboxLabel>
                      </ListboxOption>
                      <ListboxOption value="ES384">
                        <ListboxLabel>ES384</ListboxLabel>
                      </ListboxOption>
                    </Listbox>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Secret key
                    </label>
                    <Textarea
                      name="secret_key"
                      value={secretKey}
                      onChange={handleSecretKeyChange}
                      className="text-sm"
                      rows={3}
                      placeholder="Enter your secret key…"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Endpoints
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Issuer
                </label>
                <div className="relative">
                  <Input
                    disabled
                    value={selectedDeployment?.backend_host}
                    className="h-8 bg-secondary pr-10 text-xs"
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedDeployment?.backend_host || "",
                      );
                      toast.success("Issuer copied to clipboard!");
                    }}
                  >
                    <DocumentDuplicateIcon className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  JWKS endpoint
                </label>
                <div className="relative">
                  <Input
                    disabled
                    value={`https://${selectedDeployment?.backend_host}/.well-known/jwks.json`}
                    className="h-8 bg-secondary pr-10 text-xs"
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://${selectedDeployment?.backend_host}/.well-known/jwks.json`,
                      );
                      toast.success("JWKS endpoint copied to clipboard!");
                    }}
                  >
                    <DocumentDuplicateIcon className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER — editor */}
        <main className="min-w-0">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {/* Toolbar */}
                  <div className="flex h-[38px] items-center gap-1 border-b border-border bg-secondary px-2">
                    <span className="px-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      claims.json
                    </span>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <button
                      type="button"
                      onClick={handleFormatClaims}
                      className="inline-flex h-[26px] items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <SparklesIcon className="size-3.5" />
                      Format
                    </button>
                    <div className="flex-1" />
                    <span className="px-2 font-mono text-[11px] text-muted-foreground">
                      {claims.length} chars
                    </span>
                  </div>
                  {/* Body */}
                  <CodeEditor
                    language="json"
                    minHeight={400}
                    chrome="flush"
                    value={claims}
                    onChange={(value) => handleClaimsChange(value || "")}
                    onCreateEditor={(view) => {
                      editorRef.current = view;
                    }}
                  />
                  {/* Status strip */}
                  <div className="flex h-[30px] items-center gap-2.5 border-t border-border bg-secondary px-3 font-mono text-[11px] text-muted-foreground">
                    {isValidClaims ? (
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="size-3 text-emerald-500" />
                        valid JSON
                      </span>
                    ) : (
                      <span className="text-destructive">invalid JSON</span>
                    )}
                    <span className="text-muted-foreground/40">·</span>
                    <span>{claimsVariableCount} variables used</span>
                  </div>
                </div>
              </main>

              {/* RIGHT — variables */}
              <aside className="min-w-0">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Variables
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      click to insert
                    </span>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {VAR_GROUPS.map((group) => {
                      const items = availableVariables.filter((v) =>
                        group.match(v.value),
                      );
                      if (items.length === 0) return null;
                      return (
                        <VarGroup
                          key={group.title}
                          title={group.title}
                          count={items.length}
                          defaultOpen={group.open}
                        >
                          {items.map((variable) => (
                            <VarItem
                              key={variable.value}
                              name={variable.label}
                              value={variable.value}
                              onInsert={insertVariable}
                            />
                          ))}
                        </VarGroup>
                      );
                    })}
                  </div>
                </div>
              </aside>
      </div>

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDeleteTemplate}
        title="Delete JWT Template"
        message={`Are you sure you want to delete the template "${formData.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeletingJWTTemplate}
      />
    </div >
  );
}

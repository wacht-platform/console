import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Switch, SwitchField } from "@/components/ui/switch";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import {
  Field,
  FieldGroup,
  Label,
  Description,
} from "@/components/ui/fieldset";
import { DeploymentJWTTemplate } from "@/types/deployment";
import Editor from "@monaco-editor/react";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useDeploymentJWTTemplates } from "@/lib/api/hooks/use-deployment-jwt-templates";
import { Button } from "@/components/ui/button";
import { TrashIcon, DocumentDuplicateIcon, KeyIcon, ClockIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import { toast } from 'sonner';
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";

export default function JWTTemplateCreateUpdatePage() {
  const { templateId } = useParams();
  const { selectedDeployment } = useProjects();
  const navigate = useNavigate();
  const isDarkMode = useDarkMode();
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
  const isEditMode = !!templateId;
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const editorRef = useRef<any>(null);

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

    const editor = editorRef.current;
    const position = editor.getPosition();
    const range = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    };

    editor.executeEdits("insert-variable", [{
      range: range,
      text: `{{${variable}}}`,
      forceMoveMarkers: true
    }]);

    editor.focus();
  };

  const handleClaimsChange = (value: string | undefined) => {
    if (value !== undefined) {
      const claimsParsed = JSON.parse(value);
      setClaims(JSON.stringify(claimsParsed, null, 2));
      setFormData((prev) => ({ ...prev, template: claimsParsed }));
    }
  };



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
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <Heading className="text-xl font-normal text-gray-900 dark:text-zinc-100">
              {isEditMode ? "Edit JWT Template" : "Create JWT Template"}
            </Heading>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              {isEditMode
                ? "Update your JWT template configuration and claims"
                : "Configure a new JWT template for token generation"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDeleteTemplate}
                disabled={isDeletingJWTTemplate}
              >
                {isDeletingJWTTemplate ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
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
                  ? "Update Template"
                  : "Create Template"}
            </Button>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {validationError}
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-zinc-800 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100 mb-4">Basic Information</h3>
            <Field>
              <Label>Template Name</Label>
              <Description>A unique name to identify this JWT template</Description>
              <Input
                name="name"
                className="mt-2"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., API Access Token, User Session Token"
              />
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-zinc-800 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-gray-400 dark:text-zinc-500" />
              Token Configuration
            </h3>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <Label>Token Lifetime</Label>
                <Description>How long the token remains valid</Description>
                <div className="relative mt-2">
                  <Input
                    name="token_lifetime"
                    value={formData.token_lifetime}
                    onChange={handleNumberInputChange}
                    type="number"
                    min="1"
                    className="pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-zinc-400 sm:text-sm">seconds</span>
                  </div>
                </div>
              </Field>

              <Field>
                <Label>Allowed Clock Skew</Label>
                <Description>Tolerance for time synchronization issues</Description>
                <div className="relative mt-2">
                  <Input
                    name="allowed_clock_skew"
                    value={formData.allowed_clock_skew}
                    onChange={handleNumberInputChange}
                    type="number"
                    min="0"
                    className="pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-zinc-400 sm:text-sm">seconds</span>
                  </div>
                </div>
              </Field>
            </FieldGroup>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-zinc-800 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100 mb-4 flex items-center">
              <KeyIcon className="w-5 h-5 mr-2 text-gray-400 dark:text-zinc-500" />
              Signing Configuration
            </h3>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SwitchField className="md:col-span-2">
                <Label>Use Custom Signing Key</Label>
                <Description>
                  Enable this option if you're using a third-party authentication service that requires custom signing keys
                </Description>
                <Switch
                  checked={isCustomSigningKey}
                  onCheckedChange={toggleCustomSigningKey}
                />
              </SwitchField>
              {isCustomSigningKey && (
                <>
                  <Field>
                    <Label>Signing Algorithm</Label>
                    <Description>The cryptographic algorithm to use</Description>
                    <Listbox
                      name="signing_algorithm"
                      value={signingAlgorithm}
                      onChange={handleAlgorithmChange}
                      className="mt-2"
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
                  </Field>
                  <Field>
                    <Label>Secret Key</Label>
                    <Description>The key used to sign the JWT</Description>
                    <Textarea
                      name="secret_key"
                      value={secretKey}
                      onChange={handleSecretKeyChange}
                      className="mt-2 text-sm"
                      rows={4}
                      placeholder="Enter your secret key here..."
                    />
                  </Field>
                </>
              )}
            </FieldGroup>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-zinc-800 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100 mb-4 flex items-center">
              <CpuChipIcon className="w-5 h-5 mr-2 text-gray-400 dark:text-zinc-500" />
              Token Endpoints
            </h3>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <Label>Issuer</Label>
                <Description>The JWT issuer claim value</Description>
                <div className="relative mt-2">
                  <Input
                    name="issuer"
                    value={selectedDeployment?.backend_host}
                    disabled
                    className="pr-16 bg-gray-50 dark:bg-zinc-800"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center px-2.5 py-1.5 text-xs font-normal text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedDeployment?.backend_host || "",
                      );
                      toast.success("Issuer copied to clipboard!");
                    }}
                  >
                    <DocumentDuplicateIcon className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </button>
                </div>
              </Field>

              <Field>
                <Label>JWKS Endpoint</Label>
                <Description>JSON Web Key Set endpoint for public keys</Description>
                <div className="relative mt-2">
                  <Input
                    name="jwks_endpoint"
                    value={`https://${selectedDeployment?.backend_host}/.well-known/jwks.json`}
                    disabled
                    className="pr-16 bg-gray-50 dark:bg-zinc-800 text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center px-2.5 py-1.5 text-xs font-normal text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://${selectedDeployment?.backend_host}/.well-known/jwks.json`,
                      );
                      toast.success("JWKS endpoint copied to clipboard!");
                    }}
                  >
                    <DocumentDuplicateIcon className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </button>
                </div>
              </Field>
            </FieldGroup>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-zinc-800 sm:rounded-xl">
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100">JWT Claims</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Define the payload data to include in your JWT tokens</p>
                </div>
                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={claims}
                    onChange={handleClaimsChange}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    theme={isDarkMode ? "vs-dark" : "vs"}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      formatOnPaste: true,
                      formatOnType: true,
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      padding: { top: 16, bottom: 16 },
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div>
                  <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100">Available Variables</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Click to insert variables into your JWT claims</p>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {/* Session Variables */}
                  <details className="group" open>
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Session</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v => v.value.startsWith('id') || v.value.startsWith('session_id')).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* User Variables */}
                  <details className="group" open>
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">User</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v => v.value.startsWith('user.')).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Email Variables */}
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Email</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v => v.value.includes('email')).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Phone Variables */}
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Phone</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v => v.value.includes('phone')).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Session Details Variables */}
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Session Details</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v =>
                        v.value.includes('ip_address') ||
                        v.value.includes('browser') ||
                        v.value.includes('device') ||
                        v.value.includes('city') ||
                        v.value.includes('region') ||
                        v.value.includes('country')
                      ).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Organization Variables */}
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Organization</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v => v.value.startsWith('active_organization')).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Workspace Variables */}
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Workspace</span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                      {availableVariables.filter(v => v.value.startsWith('active_workspace')).map((variable) => (
                        <button
                          key={variable.value}
                          type="button"
                          onClick={() => insertVariable(variable.value)}
                          className="text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
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

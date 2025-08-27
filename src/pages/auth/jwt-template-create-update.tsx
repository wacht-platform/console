import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
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

  const handleClaimsChange = (value: string | undefined) => {
    if (value !== undefined) {
      const claimsParsed = JSON.parse(value);
      setClaims(JSON.stringify(claimsParsed, null, 2));
      setFormData((prev) => ({ ...prev, template: claimsParsed }));
    }
  };

  const insertShortcode = (code: string) => {
    try {
      const newEntry = `"${code}": "{{${code}}}"`;
      const currentTemplate = claims || "{}";

      if (currentTemplate.trim() === "{}") {
        handleClaimsChange(`{ ${newEntry} }`);
        return;
      }

      const withoutClosingBrace = currentTemplate.trimEnd().replace(/}$/, "");

      if (withoutClosingBrace.trim().endsWith(",")) {
        handleClaimsChange(`${withoutClosingBrace} ${newEntry} }`);
      } else if (withoutClosingBrace.trim().endsWith("{")) {
        handleClaimsChange(`${withoutClosingBrace} ${newEntry} }`);
      } else {
        handleClaimsChange(`${withoutClosingBrace}, ${newEntry} }`);
      }
    } catch {
      handleClaimsChange(`{"${code}": "{{${code}}}"}`);
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <Heading className="text-2xl font-normal text-gray-900">
              {isEditMode ? "Edit JWT Template" : "Create JWT Template"}
            </Heading>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode 
                ? "Update your JWT template configuration and claims" 
                : "Configure a new JWT template for token generation"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode && (
              <Button
                outline
                className="text-red-600 hover:bg-red-50 border-red-200"
                onClick={handleDeleteTemplate}
                disabled={isDeletingJWTTemplate}
              >
                {isDeletingJWTTemplate ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
                <span className="ml-2">Delete</span>
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {validationError}
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 mb-4">Basic Information</h3>
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

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
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
                    <span className="text-gray-500 sm:text-sm">seconds</span>
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
                    <span className="text-gray-500 sm:text-sm">seconds</span>
                  </div>
                </div>
              </Field>
            </FieldGroup>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 mb-4 flex items-center">
              <KeyIcon className="w-5 h-5 mr-2 text-gray-400" />
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
                  onChange={toggleCustomSigningKey}
                  name="custom_signing_key"
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
                      className="mt-2 font-mono text-sm"
                      rows={4}
                      placeholder="Enter your secret key here..."
                    />
                  </Field>
                </>
              )}
            </FieldGroup>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-base font-normal leading-6 text-gray-900 mb-4 flex items-center">
              <CpuChipIcon className="w-5 h-5 mr-2 text-gray-400" />
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
                    className="pr-16 bg-gray-50"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center px-2.5 py-1.5 text-xs font-normal text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                    className="pr-16 bg-gray-50 text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center px-2.5 py-1.5 text-xs font-normal text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <h3 className="text-base font-normal leading-6 text-gray-900">JWT Claims</h3>
                  <p className="mt-1 text-sm text-gray-600">Define the payload data to include in your JWT tokens</p>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={claims}
                    onChange={handleClaimsChange}
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
                  <h3 className="text-base font-normal leading-6 text-gray-900">Available Variables</h3>
                  <p className="mt-1 text-sm text-gray-600">Click to insert user attributes</p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-normal text-gray-500 uppercase tracking-wide">User Properties</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.id")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.id
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.external_id")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.external_id
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.first_name")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.first_name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.last_name")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.last_name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.full_name")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.full_name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.username")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.username
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.created_at")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.created_at
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.updated_at")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.updated_at
                    </button>
                    <button
                      type="button"
                      onClick={() => insertShortcode("user.last_sign_in_at")}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      user.last_sign_in_at
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertShortcode("user.primary_email_address")
                      }
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 col-span-2"
                    >
                      user.primary_email_address
                    </button>
                  </div>
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
    </div>
  );
}

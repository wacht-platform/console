import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Switch, SwitchField } from "@/components/ui/switch";
import {
  Field,
  FieldGroup,
  Label,
  Description,
  Fieldset,
} from "@/components/ui/fieldset";
import { DeploymentJWTTemplate } from "@/types/deployment";
import Editor from "@monaco-editor/react";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useDeploymentJWTTemplates } from "@/lib/api/hooks/use-deployment-jwt-templates";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";

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
  const isEditMode = !!templateId;
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId && jwtTemplates) {
      const template = jwtTemplates.find((t) => t.id === templateId);
      if (template) {
        setFormData(template);
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
        navigate("../");
      } else {
        await createJWTTemplate(finalFormData as DeploymentJWTTemplate);
        navigate("../");
      }
    } catch (error) {
      setValidationError(
        `Failed to ${isEditMode ? "update" : "create"} JWT template`,
      );
      console.error(error);
    }
  };

  async function deleteTemplate() {
    if (!templateId) return;

    await deleteJWTTemplate(templateId);
    navigate("../");
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Heading>
          {isEditMode ? "Update Template" : "Create New Template"}
        </Heading>
        <div className="flex items-center gap-4">
          {isEditMode && !isDeletingJWTTemplate && (
            <TrashIcon
              className="w-6 h-6 text-red-500 cursor-pointer"
              onClick={deleteTemplate}
            />
          )}
          {isDeletingJWTTemplate && <Spinner className="w-5 h-5" />}
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

      {validationError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {validationError}
        </div>
      )}

      <div className="space-y-8 mt-4">
        <Field>
          <Label>Name</Label>
          <Input
            name="name"
            className="mt-0"
            inputClassName="mt-0"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Template name"
          />
        </Field>

        <Fieldset>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <Label>Token lifetime</Label>
              <div className="relative mt-2">
                <Input
                  name="token_lifetime"
                  value={formData.token_lifetime}
                  onChange={handleNumberInputChange}
                  type="number"
                  min="1"
                />
                <div className="rounded-r-md text-sm flex items-center px-4 bg-gray-100 absolute right-[1.2px] top-[1.2px] bottom-[1.2px]">
                  seconds
                </div>
              </div>
            </Field>

            <Field>
              <Label>Allowed clock skew</Label>
              <div className="relative mt-2">
                <Input
                  name="allowed_clock_skew"
                  value={formData.allowed_clock_skew}
                  onChange={handleNumberInputChange}
                  type="number"
                  min="0"
                />
                <div className="rounded-r-md text-sm flex items-center px-4 bg-gray-100 absolute right-[1.2px] top-[1.2px] bottom-[1.2px]">
                  seconds
                </div>
              </div>
            </Field>
          </FieldGroup>
        </Fieldset>

        <Fieldset>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SwitchField className="h-fit">
              <Label>Custom signing key</Label>
              <Description>
                Enable if using a third-party authentication service that
                requires custom signing keys
              </Description>
              <Switch
                checked={isCustomSigningKey}
                onChange={toggleCustomSigningKey}
                name="custom_signing_key"
              />
            </SwitchField>
            {isCustomSigningKey && (
              <div className="space-y-4">
                <Field>
                  <Label>Signing algorithm</Label>
                  <Listbox
                    name="signing_algorithm"
                    value={signingAlgorithm}
                    onChange={handleAlgorithmChange}
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
                  <Textarea
                    name="secret_key"
                    value={secretKey}
                    onChange={handleSecretKeyChange}
                  />
                </Field>
              </div>
            )}
          </FieldGroup>
        </Fieldset>

        <Fieldset>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <Label>Issuer</Label>
              <div className="relative mt-2">
                <Input
                  name="issuer"
                  value={selectedDeployment?.backend_host}
                  disabled
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-sm text-indigo-600 bg-indigo-50 rounded z-10"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      selectedDeployment?.backend_host || "",
                    );
                  }}
                >
                  Copy
                </button>
              </div>
            </Field>

            <Field>
              <Label>JWKS Endpoint</Label>
              <div className="relative mt-2">
                <Input
                  name="jwks_endpoint"
                  value={`https://${selectedDeployment?.backend_host}/.well-known/jwks.json`}
                  disabled
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-sm text-indigo-600 bg-indigo-50 rounded z-10"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://${selectedDeployment?.backend_host}/.well-known/jwks.json`,
                    );
                  }}
                >
                  Copy
                </button>
              </div>
            </Field>
          </FieldGroup>
        </Fieldset>

        <Fieldset>
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Claims</h3>
                <Editor
                  height="400px"
                  defaultLanguage="json"
                  value={claims}
                  onChange={handleClaimsChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>

              <div className="md:col-span-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Insert shortcodes
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => insertShortcode("user.id")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.id
                  </button>
                  <button
                    onClick={() => insertShortcode("user.external_id")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.external_id
                  </button>
                  <button
                    onClick={() => insertShortcode("user.first_name")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.first_name
                  </button>
                  <button
                    onClick={() => insertShortcode("user.last_name")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.last_name
                  </button>
                  <button
                    onClick={() => insertShortcode("user.full_name")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.full_name
                  </button>
                  <button
                    onClick={() => insertShortcode("user.username")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.username
                  </button>
                  <button
                    onClick={() => insertShortcode("user.created_at")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.created_at
                  </button>
                  <button
                    onClick={() => insertShortcode("user.updated_at")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.updated_at
                  </button>
                  <button
                    onClick={() => insertShortcode("user.last_sign_in_at")}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.last_sign_in_at
                  </button>
                  <button
                    onClick={() =>
                      insertShortcode("user.primary_email_address")
                    }
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm w-fit"
                  >
                    user.primary_email_address
                  </button>
                </div>
              </div>
            </div>
          </FieldGroup>
        </Fieldset>
      </div>
    </div>
  );
}

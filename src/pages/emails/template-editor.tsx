import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmailTemplate } from "@/types/deployment";
import { useEmailTemplate } from "@/lib/api/hooks/use-email-templates";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { Spinner } from "@/components/ui/spinner";
import { InlineLoader } from "@/components/ui/loading-screen";
import { toast } from "sonner";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { getTemplateVariables } from "@/lib/email-template-variables";
import Editor from "@monaco-editor/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeBracketIcon, EyeIcon } from "@heroicons/react/24/outline";
import AdvancedEditor from "@/components/editor/advanced-editor";


export default function EmailTemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const joditRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");
  const isDarkMode = useDarkMode();

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
    // Insert into Monaco Code Editor
    else if (activeTab === "code" && monacoRef.current) {
      const editor = monacoRef.current;
      const position = editor.getPosition();
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      };
      editor.executeEdits("insert-variable", [{
        range: range,
        text: text,
        forceMoveMarkers: true
      }]);
      editor.focus();
    }
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading template</p>
        <Button onClick={handleBack} className="mt-4">
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Heading className="text-xl font-normal text-gray-900 dark:text-zinc-100">
              {formData.template_name || "Email Template"}
            </Heading>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              Customize your email template content and settings
            </p>
          </div>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              "Save Template"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100 mb-4">Basic Information</h3>
          <div>
            <label className="block text-sm font-normal text-gray-700 dark:text-gray-300">
              Template Name
            </label>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This name is for internal reference only</p>
            <Input
              value={formData.template_name}
              onChange={(e) => handleInputChange("template_name", e.target.value)}
              placeholder="e.g., Welcome Email, Password Reset"
              className="mt-2"
            />
          </div>
        </div>

        {/* Email Configuration */}
        <div>
          <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100 mb-4">Email Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-normal text-gray-700 dark:text-gray-300">
                From Address
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The sender name for this email</p>
              <div className="mt-2 inline-flex rounded-md border border-gray-300 dark:border-zinc-600 focus-within:border-indigo-500">
                <input
                  type="text"
                  value={formData.template_from}
                  onChange={(e) => handleInputChange("template_from", e.target.value)}
                  className="w-48 rounded-l-md border-0 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  placeholder="noreply"
                />
                <span className="inline-flex items-center px-1.5 py-2 rounded-r-md border-0 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  @{deploymentSettings?.mail_from_host}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 dark:text-gray-300">
                Reply-To Address
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Where replies should be sent</p>
              <div className="mt-2 inline-flex rounded-md border border-gray-300 dark:border-zinc-600 focus-within:border-indigo-500">
                <input
                  type="text"
                  value={formData.template_reply_to}
                  onChange={(e) => handleInputChange("template_reply_to", e.target.value)}
                  className="w-48 rounded-l-md border-0 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  placeholder="support"
                />
                <span className="inline-flex items-center px-1.5 py-2 rounded-r-md border-0 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  @{deploymentSettings?.mail_from_host}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-normal text-gray-700 dark:text-gray-300">
              Email Subject
            </label>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You can use template variables in the subject line</p>
            <Input
              value={formData.template_subject}
              onChange={(e) => handleInputChange("template_subject", e.target.value)}
              className="mt-2"
              placeholder="e.g., Welcome to {{app.name}}!"
            />
          </div>
        </div>

        {/* Email Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100">Email Content</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Design your email template</p>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-gray-100 dark:bg-zinc-800 p-1 h-auto">
                  <TabsTrigger value="visual" className="text-xs px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
                    <EyeIcon className="w-3.5 h-3.5 mr-1.5" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-xs px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
                    <CodeBracketIcon className="w-3.5 h-3.5 mr-1.5" />
                    Code
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
              <TabsContent value="visual" className="mt-0">
                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <AdvancedEditor
                    value={formData.template_data}
                    onChange={handleEditorChange}
                    onEditorInit={handleEditorInit}
                  />
                </div>
              </TabsContent>
              <TabsContent value="code" className="mt-0">
                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <Editor
                    height="500px"
                    defaultLanguage="html"
                    value={formData.template_data}
                    onChange={(value) => handleEditorChange(value || "")}
                    onMount={(editor) => {
                      monacoRef.current = editor;
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
                      wordWrap: "on"
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div>
              <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-zinc-100">Variables</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Click to insert</p>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {templateId && getTemplateVariables(templateId).map((category) => (
                <details key={category.category} className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800">
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{category.category}</span>
                      <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="mt-2 space-y-1 px-1">
                    {category.variables.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertVariable(variable.key);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-normal rounded border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
                        title={variable.description}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-xs mb-0.5">
                            {variable.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {`{{${variable.key}}}`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import JoditEditor from "jodit-react";
import { EmailTemplate } from "@/types/deployment";
import type { IJodit } from "jodit/esm/types/jodit";
import { useEmailTemplate } from "@/lib/api/hooks/use-email-templates";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEditorInit?: (editor: IJodit) => void;
}

const RichTextEditor = ({
  value,
  onChange,
  onEditorInit,
}: RichTextEditorProps) => {
  const editor = useRef<IJodit | null>(null);
  const isDarkMode = useDarkMode();

  const config = useMemo(
    () => ({
      readonly: false,
      toolbarAdaptive: false,
      placeholder: "",
      theme: isDarkMode ? "dark" : "default",
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "outdent",
        "indent",
        "|",
        "fontsize",
        "|",
        "link",
        "image",
        "|",
        "align",
        "|",
        "hr",
        "|",
        "source",
      ],
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      height: 500,
      toolbarButtonSize: "middle" as const,
      style: {
        '.jodit-wysiwyg': {
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.6',
          color: isDarkMode ? '#e5e7eb' : '#374151',
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        },
        '.jodit-container': {
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        },
        '.jodit-toolbar': {
          backgroundColor: isDarkMode ? '#27272a' : '#f3f4f6',
          borderColor: isDarkMode ? '#3f3f46' : '#e5e7eb',
        },
      },
    }),
    [isDarkMode]
  );

  useEffect(() => {
    if (editor.current) {
      onEditorInit?.(editor.current);
    }
  }, [onEditorInit]);

  return (
    <JoditEditor
      ref={editor}
      value={value}
      config={config}
      onChange={onChange}
    />
  );
};

export default function EmailTemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<IJodit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEditorInit = (editor: IJodit) => {
    editorRef.current = editor;
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
    navigate("/emails");
  };

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.selection.insertHTML(`{{${variable}}}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    );
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to templates
        </button>
        <div className="flex items-center justify-between">
          <div>
            <Heading className="text-2xl font-normal text-gray-900 dark:text-gray-100">
              {formData.template_name || "Email Template"}
            </Heading>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Customize your email template content and settings</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-gray-100 mb-4">Template Settings</h3>
            <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-normal text-gray-700 dark:text-gray-300"
                  >
                    Template Name
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This name is for internal reference only</p>
                  <Input
                    id="name"
                    value={formData.template_name}
                    onChange={(e) =>
                      handleInputChange("template_name", e.target.value)
                    }
                    placeholder="e.g., Welcome Email, Password Reset"
                    className="mt-2 w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="from"
                      className="block text-sm font-normal text-gray-700 dark:text-gray-300"
                    >
                      From Address
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The sender name for this email</p>
                    <div className="mt-2 flex rounded-md shadow-sm">
                      <Input
                        id="from"
                        value={formData.template_from}
                        onChange={(e) =>
                          handleInputChange("template_from", e.target.value)
                        }
                        className="flex-1 rounded-r-none"
                        placeholder="noreply"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 sm:text-sm">
                        @{deploymentSettings?.mail_from_host}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reply-to"
                      className="block text-sm font-normal text-gray-700 dark:text-gray-300"
                    >
                      Reply-To Address
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Where replies should be sent</p>
                    <div className="mt-2 flex rounded-md shadow-sm">
                      <Input
                        id="reply-to"
                        value={formData.template_reply_to}
                        onChange={(e) =>
                          handleInputChange("template_reply_to", e.target.value)
                        }
                        className="flex-1 rounded-r-none"
                        placeholder="support"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 sm:text-sm">
                        @{deploymentSettings?.mail_from_host}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-normal text-gray-700 dark:text-gray-300"
                  >
                    Email Subject
                  </label>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You can use template variables in the subject line</p>
                  <Input
                    id="subject"
                    value={formData.template_subject}
                    onChange={(e) =>
                      handleInputChange("template_subject", e.target.value)
                    }
                    className="mt-2 w-full"
                    placeholder="e.g., Welcome to {{app_name}}!"
                  />
                </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-gray-100 mb-4">Email Content</h3>
            <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
              <RichTextEditor
                value={formData.template_data}
                onChange={handleEditorChange}
                onEditorInit={handleEditorInit}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg sticky top-6">
            <div className="px-5 py-5">
              <h3 className="text-base font-normal leading-6 text-gray-900 dark:text-gray-100 mb-4">Template Variables</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click on a variable to insert it at the cursor position in the editor.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">User Information</h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => insertVariable("user.first_name")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{user.first_name}}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("user.last_name")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{user.last_name}}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("user.email")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{user.email}}`}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Application</h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => insertVariable("app_name")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{app_name}}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("app_url")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{app_url}}`}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Authentication</h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => insertVariable("verification_code")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{verification_code}}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("magic_link")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{magic_link}}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("reset_link")}
                      className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{`{{reset_link}}`}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

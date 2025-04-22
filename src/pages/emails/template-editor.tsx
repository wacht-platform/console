import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import JoditEditor from 'jodit-react';
import { EmailTemplate } from "@/types/deployment";
import type { IJodit } from 'jodit/esm/types/jodit';
import { useEmailTemplate } from "@/lib/api/hooks/use-email-templates";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onEditorInit?: (editor: IJodit) => void;
}

const RichTextEditor = ({ value, onChange, onEditorInit }: RichTextEditorProps) => {
    const editor = useRef<IJodit | null>(null);

    const config = useMemo(() => ({
        readonly: false,
        toolbarAdaptive: false,
        placeholder: '',
        buttons: ['link', 'source', 'image', 'fontsize'],
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
    }),
        []
    );


    useEffect(() => {
        if (editor.current) {
            onEditorInit?.(editor.current);
        }
    }, [onEditorInit, editor.current]);

    return (
        <div className="rich-text-editor">
            <div className="quill-container rounded-b">
                <JoditEditor
                    ref={editor}
                    value={value}
                    config={config}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

export default function EmailTemplateEditor() {
    const { templateId } = useParams<{ templateId: string }>();
    const editorRef = useRef<IJodit | null>(null);

    const { emailTemplate, isLoading, error, updateTemplate } = useEmailTemplate(templateId!);
    const { deploymentSettings } = useCurrentDeployemnt();

    const [formData, setFormData] = useState<EmailTemplate>({
        template_name: "",
        template_data: "",
        template_from: "",
        template_reply_to: "",
        template_subject: ""
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
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditorChange = (html: string) => {
        setFormData(prev => ({
            ...prev,
            body: html
        }));
    };

    const handleEditorInit = (editor: IJodit) => {
        editorRef.current = editor;
    };

    const onSave = () => {
        updateTemplate(formData);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <Heading className="text-2xl font-bold">
                        {formData.template_name || "New template"}
                    </Heading>
                </div>
                <Button onClick={onSave}>
                    Save Template
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="w-full">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                        Template Name
                                    </label>
                                    <Input
                                        id="name"
                                        value={formData.template_name}
                                        onChange={(e) => handleInputChange("template_name", e.target.value)}
                                        placeholder="Enter template name"
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="from" className="text-sm font-medium text-gray-700">
                                            From
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="from"
                                                value={formData.template_from}
                                                onChange={(e) => handleInputChange("template_from", e.target.value)}
                                                className="w-full rounded-r-none"
                                            />
                                            <div className="absolute rounded-r-md right-[1.2px] top-[1.2px] bottom-[1.2px] px-3 bg-gray-100 text-gray-500 flex items-center">
                                                @{deploymentSettings?.mail_from_host}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="reply-to" className="text-sm font-medium text-gray-700">
                                            Reply-To
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="reply-to"
                                                value={formData.template_reply_to}
                                                onChange={(e) => handleInputChange("template_reply_to", e.target.value)}
                                                className="w-full rounded-r-none"
                                            />
                                            <div className="absolute rounded-r-md right-[1.2px] top-[1.2px] bottom-[1.2px] px-3 bg-gray-100 text-gray-500 flex items-center">
                                                @{deploymentSettings?.mail_from_host}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                                        Subject
                                    </label>
                                    <Input
                                        id="subject"
                                        value={formData.template_subject}
                                        onChange={(e) => handleInputChange("template_subject", e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Email Body</h2>
                                <RichTextEditor
                                    value={formData.template_data}
                                    onChange={handleEditorChange}
                                    onEditorInit={handleEditorInit}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg sticky top-6">
                        <h2 className="text-lg">Available Variables</h2>
                        <p className="text-sm text-gray-500">
                            You can use these variables in your template. Click on a variable to insert it at the cursor position.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
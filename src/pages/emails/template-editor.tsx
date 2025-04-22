import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Template, emailTemplates } from "@/data/email-templates";
import JoditEditor from 'jodit-react';
import type { IJodit } from 'jodit/esm/types/jodit';

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

    const [formData, setFormData] = useState<Template>({
        name: "",
        from: "",
        replyTo: "",
        subject: "",
        body: ""
    });

    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (templateId && emailTemplates[templateId]) {
            const template = emailTemplates[templateId];
            console.log(template);

            setFormData({
                name: template.name,
                from: template.from,
                replyTo: template.replyTo,
                subject: template.subject,
                body: template.body,
            });

            setHasChanges(false);
        }
    }, [templateId]);

    // Handle input changes
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setHasChanges(true);
    };

    const handleEditorChange = (html: string) => {
        setFormData(prev => ({
            ...prev,
            body: html
        }));
        setHasChanges(true);
    };

    const handleEditorInit = (editor: IJodit) => {
        editorRef.current = editor;
    };

    const onSave = () => {
        setTimeout(() => {
            setHasChanges(false);
        }, 1000);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <Heading className="text-2xl font-bold">
                        {formData.name || "New template"}
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
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
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
                                                value={formData.from}
                                                onChange={(e) => handleInputChange("from", e.target.value)}
                                                className="w-full rounded-r-none"
                                            />
                                            <div className="absolute rounded-r-md right-[1.2px] top-[1.2px] bottom-[1.2px] px-3 bg-gray-100 text-gray-500 flex items-center">
                                                @loooooolll.com
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="reply-to" className="text-sm font-medium text-gray-700">
                                            Reply-to
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="reply-to"
                                                value={formData.replyTo}
                                                onChange={(e) => handleInputChange("replyTo", e.target.value)}
                                                className="w-full rounded-r-none"
                                            />
                                            <div className="absolute rounded-r-md right-[1.2px] top-[1.2px] bottom-[1.2px] px-3 bg-gray-100 text-gray-500 flex items-center">
                                                @loooooolll.com
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
                                        value={formData.subject}
                                        onChange={(e) => handleInputChange("subject", e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Email Body</h2>
                                <RichTextEditor
                                    value={formData.body}
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
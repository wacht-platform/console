import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ToolEditorForm } from "@/components/ai-agents/tool-editor-form";
import type { AiTool } from "@/types/ai-tool";

export default function ToolEditorPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const toolId = params.toolId;
    const basePath = `/project/${params.projectId}/deployment/${params.deploymentId}/llms/tools`;
    const isEditing = !!toolId;
    const tool = (location.state as { tool?: AiTool } | null)?.tool;

    useEffect(() => {
        if (isEditing && !tool) {
            navigate(basePath, { replace: true });
        }
    }, [basePath, isEditing, navigate, tool]);

    if (isEditing && !tool) {
        return null;
    }

    return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-10 px-2 pb-12">
            <div className="flex items-start justify-between gap-6 pt-2">
                <div className="space-y-2">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-normal tracking-tight">
                            {isEditing
                                ? `Editing ${tool?.name ?? "tool"}`
                                : "Creating tool"}
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Configure a tool for your AI agents to use.
                        </p>
                    </div>
                </div>
                <Button type="submit" form="tool-editor-form">
                    {isEditing ? "Save changes" : "Create tool"}
                </Button>
            </div>

            <ToolEditorForm
                tool={tool}
                onSaved={() => navigate(basePath)}
                className="flex min-h-0 flex-1 flex-col"
                formId="tool-editor-form"
            />
        </div>
    );
}

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
        <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 px-2 pb-12">
            <div className="flex items-start justify-between gap-6 pt-2">
                <div className="min-w-0">
                    <div className="font-mono text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
                        {isEditing ? "Tool · edit" : "Agents platform · new tool"}
                    </div>
                    <h1 className="mt-1.5 text-[22px] font-medium leading-[1.2] tracking-[-0.012em] text-foreground">
                        {isEditing
                            ? `Editing ${tool?.name ?? "tool"}`
                            : "Create tool"}
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-muted-foreground">
                        Configure a tool your agents can call — HTTP
                        integrations, code runners, or platform actions.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(basePath)}
                    >
                        Cancel
                    </Button>
                </div>
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

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";


interface LLMCallNodeData {
  label: string;
  description: string;
  prompt_template?: string;
  response_format?: "text" | "json";
  json_schema?: string;
}

interface LLMCallNodeProps {
  data: LLMCallNodeData;
  selected?: boolean;
}

const LLMCallNode = memo(({ data }: LLMCallNodeProps) => {
  return (
    <div className="relative border border-dashed border-purple-400 bg-purple-50 text-purple-800 dark:border-purple-500 dark:bg-purple-900/20 dark:text-purple-300 rounded p-0.5 text-center cursor-grab transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30 w-12 h-8">
      <Handle
        type="target"
        position={Position.Top}
        className="w-1.5 h-1.5 !bg-purple-500 !border-0"
      />

      <div className="font-medium text-xs truncate leading-tight">{data.label}</div>
      <div className="text-xs opacity-75 leading-tight">AI processing</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-1.5 h-1.5 !bg-purple-500 !border-0"
      />
    </div>
  );
});

LLMCallNode.displayName = "LLMCallNode";

export default LLMCallNode;

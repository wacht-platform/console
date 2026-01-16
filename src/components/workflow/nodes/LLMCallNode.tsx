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
    <div className="relative border-2 border-dashed border-purple-400 bg-purple-50 text-purple-800 dark:border-purple-500 dark:bg-purple-900/20 dark:text-purple-300 rounded-lg p-3 text-center cursor-grab transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-purple-500 !border-2 !border-white dark:!border-zinc-800"
      />

      <div className="font-normal text-sm mb-1">{data.label}</div>
      <div className="text-xs opacity-75">AI processing</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-purple-500 !border-2 !border-white dark:!border-zinc-800"
      />
    </div>
  );
});

LLMCallNode.displayName = "LLMCallNode";

export default LLMCallNode;

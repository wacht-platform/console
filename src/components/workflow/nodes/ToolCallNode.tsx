import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

interface ToolCallNodeData {
  label: string;
  description: string;
  tool_id?: string;
  tool_name?: string;
  tool_type?: string;
  input_parameters?: Record<string, unknown>;
}

interface ToolCallNodeProps {
  data: ToolCallNodeData;
  selected?: boolean;
}

const ToolCallNode = memo(({ data }: ToolCallNodeProps) => {
  return (
    <div className="relative border-2 border-dashed border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg p-3 text-center cursor-grab transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-blue-500 !border-2 !border-white dark:!border-zinc-800"
      />

      <div className="font-normal text-sm mb-1">{data.label}</div>
      <div className="text-xs opacity-75">Execute tools</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-blue-500 !border-2 !border-white dark:!border-zinc-800"
      />
    </div>
  );
});

ToolCallNode.displayName = "ToolCallNode";

export default ToolCallNode;

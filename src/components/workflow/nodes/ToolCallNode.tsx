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
    <div className="relative border border-dashed border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300 rounded p-0.5 text-center cursor-grab transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30 w-12 h-8">
      <Handle
        type="target"
        position={Position.Top}
        className="w-1.5 h-1.5 !bg-blue-500 !border-0"
      />

      <div className="font-medium text-xs truncate leading-tight">{data.label}</div>
      <div className="text-xs opacity-75 leading-tight">Execute tools</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-1.5 h-1.5 !bg-blue-500 !border-0"
      />
    </div>
  );
});

ToolCallNode.displayName = "ToolCallNode";

export default ToolCallNode;

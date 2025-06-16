import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

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

const ToolCallNode = memo(({ data, selected }: ToolCallNodeProps) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md bg-indigo-50 border-2 min-w-[200px] ${
        selected ? "border-indigo-500" : "border-indigo-300"
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-indigo-500 border-2 border-white"
      />

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <WrenchScrewdriverIcon className="w-5 h-5 text-indigo-600" />
        <div className="font-medium text-indigo-800 text-sm">Tool Call</div>
      </div>

      {/* Node Content */}
      <div className="space-y-2">
        <div className="text-sm text-indigo-700 font-medium">
          {data.label}
        </div>
        
        {data.description && (
          <div className="text-xs text-indigo-600">
            {data.description}
          </div>
        )}

        {data.tool_name && (
          <div className="text-xs bg-indigo-100 p-2 rounded border border-indigo-200">
            <span className="font-medium">Tool:</span> {data.tool_name}
            {data.tool_type && (
              <span className="text-indigo-500 ml-1">({data.tool_type})</span>
            )}
          </div>
        )}

        {!data.tool_id && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            No tool selected
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-indigo-500 border-2 border-white"
      />
    </div>
  );
});

ToolCallNode.displayName = "ToolCallNode";

export default ToolCallNode;

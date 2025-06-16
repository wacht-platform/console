import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CircleStackIcon } from "@heroicons/react/24/outline";

interface StoreContextNodeData {
  label: string;
  description: string;
  context_data?: string;
  use_llm?: boolean;
}

interface StoreContextNodeProps {
  data: StoreContextNodeData;
  selected?: boolean;
  onUpdateData?: (data: StoreContextNodeData) => void;
}

const StoreContextNode = memo(({ data, selected }: StoreContextNodeProps) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md border-2 min-w-[200px] ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-green-600 bg-green-50 hover:border-green-700"
      } transition-colors duration-200 ease-in-out`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-600!"
      />

      {/* Node header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CircleStackIcon className="h-4 w-4" />
        </div>
        <div className="text-xs font-medium text-green-800 bg-green-100 px-2 py-1 rounded">
          Store Context
        </div>
      </div>

      {/* Node content */}
      <div className="space-y-2">
        <div className="font-medium text-sm text-green-800">{data.label}</div>
        
        {data.description && (
          <div className="text-xs text-green-700">{data.description}</div>
        )}

        {data.use_llm !== undefined && (
          <div className="text-xs bg-green-100 p-2 rounded border border-green-200">
            <span className="font-medium">Use LLM:</span> {data.use_llm ? "Yes" : "No"}
          </div>
        )}

        {!data.use_llm && data.context_data && (
          <div className="text-xs bg-green-100 p-2 rounded border border-green-200">
            <span className="font-medium">Context:</span> {data.context_data.substring(0, 50)}{data.context_data.length > 50 ? "..." : ""}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 bg-green-600!"
      />
    </div>
  );
});

StoreContextNode.displayName = "StoreContextNode";

export default StoreContextNode;

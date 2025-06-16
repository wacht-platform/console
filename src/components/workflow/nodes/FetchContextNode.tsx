import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface FetchContextNodeData {
  label: string;
  description: string;
  context_data?: string;
  use_llm?: boolean;
}

interface FetchContextNodeProps {
  data: FetchContextNodeData;
  selected?: boolean;
  onUpdateData?: (data: FetchContextNodeData) => void;
}

const FetchContextNode = memo(({ data, selected }: FetchContextNodeProps) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md border-2 min-w-[200px] ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-teal-600 bg-teal-50 hover:border-teal-700"
      } transition-colors duration-200 ease-in-out`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-teal-600!"
      />

      {/* Node header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          <ArrowDownTrayIcon className="h-4 w-4" />
        </div>
        <div className="text-xs font-medium text-teal-800 bg-teal-100 px-2 py-1 rounded">
          Fetch Context
        </div>
      </div>

      {/* Node content */}
      <div className="space-y-2">
        <div className="font-medium text-sm text-teal-800">{data.label}</div>
        
        {data.description && (
          <div className="text-xs text-teal-700">{data.description}</div>
        )}

        {data.use_llm !== undefined && (
          <div className="text-xs bg-teal-100 p-2 rounded border border-teal-200">
            <span className="font-medium">Use LLM:</span> {data.use_llm ? "Yes" : "No"}
          </div>
        )}

        {!data.use_llm && data.context_data && (
          <div className="text-xs bg-teal-100 p-2 rounded border border-teal-200">
            <span className="font-medium">Context:</span> {data.context_data.substring(0, 50)}{data.context_data.length > 50 ? "..." : ""}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 bg-teal-600!"
      />
    </div>
  );
});

FetchContextNode.displayName = "FetchContextNode";

export default FetchContextNode;

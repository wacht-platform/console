import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { SparklesIcon } from "@heroicons/react/24/outline";

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

const LLMCallNode = memo(({ data, selected }: LLMCallNodeProps) => {

  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md bg-purple-50 border-2 min-w-[200px] ${
        selected ? "border-purple-500" : "border-purple-300"
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon className="w-5 h-5 text-purple-600" />
        <div className="font-medium text-purple-800 text-sm">LLM Call</div>
      </div>

      {/* Node Content */}
      <div className="text-xs text-purple-700">
        <div className="font-medium">{data.label}</div>
        {data.description && (
          <div className="text-purple-600 mt-1">{data.description}</div>
        )}
        
        {/* Configuration Summary */}
        <div className="mt-2 space-y-1">
          {data.response_format && (
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="font-medium uppercase">{data.response_format}</span>
            </div>
          )}
          {data.response_format === "json" && data.json_schema && (
            <div className="text-xs text-purple-600 bg-purple-100 p-1 rounded">
              JSON Schema defined
            </div>
          )}
        </div>

        {/* Prompt Preview */}
        {data.prompt_template && (
          <div className="mt-2 p-2 bg-purple-100 rounded text-xs">
            <div className="font-medium text-purple-800 mb-1">Prompt:</div>
            <div className="text-purple-700 truncate" title={data.prompt_template}>
              {data.prompt_template.length > 50 
                ? `${data.prompt_template.substring(0, 50)}...` 
                : data.prompt_template}
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />
    </div>
  );
});

LLMCallNode.displayName = "LLMCallNode";

export default LLMCallNode;

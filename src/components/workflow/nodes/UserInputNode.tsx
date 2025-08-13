import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { UserIcon } from "@heroicons/react/24/outline";

interface UserInputNodeData {
  label: string;
  description?: string;
  prompt?: string;
  input_type?: string;
  default_value?: string;
  placeholder?: string;
  options?: string[];
}

interface UserInputNodeProps {
  data: UserInputNodeData;
  selected?: boolean;
}

const UserInputNode = memo(({ data, selected }: UserInputNodeProps) => {
  const getInputTypeLabel = (type?: string) => {
    switch (type) {
      case "text": return "Text Input";
      case "number": return "Number Input";
      case "select": return "Select";
      case "multiselect": return "Multi-Select";
      case "boolean": return "Yes/No";
      case "date": return "Date Picker";
      default: return "Text Input";
    }
  };

  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md bg-cyan-50 border-2 min-w-[200px] ${
        selected ? "border-cyan-500" : "border-cyan-300"
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-cyan-500 border-2 border-white"
      />

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <UserIcon className="w-5 h-5 text-cyan-600" />
        <div className="font-medium text-cyan-800 text-sm">User Input</div>
      </div>

      {/* Node Content */}
      <div className="text-xs text-cyan-700">
        <div className="font-medium">{data.label}</div>
        {data.description && (
          <div className="text-cyan-600 mt-1">{data.description}</div>
        )}
        
        {/* Configuration Summary */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">{getInputTypeLabel(data.input_type)}</span>
          </div>
          
          {data.default_value && (
            <div className="flex justify-between">
              <span>Default:</span>
              <span className="font-medium truncate max-w-[100px]" title={data.default_value}>
                {data.default_value}
              </span>
            </div>
          )}
          
          {data.placeholder && (
            <div className="flex justify-between">
              <span>Placeholder:</span>
              <span className="font-medium truncate max-w-[100px]" title={data.placeholder}>
                {data.placeholder}
              </span>
            </div>
          )}
        </div>

        {/* Prompt Preview */}
        {data.prompt && (
          <div className="mt-2 p-2 bg-cyan-100 rounded text-xs">
            <div className="font-medium text-cyan-800 mb-1">Prompt:</div>
            <div className="text-cyan-700 truncate" title={data.prompt}>
              {data.prompt.length > 50 
                ? `${data.prompt.substring(0, 50)}...` 
                : data.prompt}
            </div>
          </div>
        )}

        {/* Options Preview for select/multiselect */}
        {(data.input_type === "select" || data.input_type === "multiselect") && data.options && data.options.length > 0 && (
          <div className="mt-2 p-2 bg-cyan-100 rounded text-xs">
            <div className="font-medium text-cyan-800 mb-1">Options:</div>
            <div className="text-cyan-700">
              {data.options.slice(0, 3).join(", ")}
              {data.options.length > 3 && ` (+${data.options.length - 3} more)`}
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-cyan-500 border-2 border-white"
      />
    </div>
  );
});

UserInputNode.displayName = "UserInputNode";

export default UserInputNode;
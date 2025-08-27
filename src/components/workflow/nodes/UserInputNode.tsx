import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

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

const UserInputNode = memo(({ data }: UserInputNodeProps) => {
  return (
    <div className="relative border border-dashed border-cyan-400 bg-cyan-50 text-cyan-800 rounded p-0.5 text-center cursor-grab transition-colors hover:bg-cyan-100 w-12 h-8">
      <Handle
        type="target"
        position={Position.Top}
        className="w-1.5 h-1.5 !bg-cyan-500 !border-0"
      />

      <div className="font-medium text-xs truncate leading-tight">{data.label}</div>
      <div className="text-xs opacity-75 leading-tight">Get user data</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-1.5 h-1.5 !bg-cyan-500 !border-0"
      />
    </div>
  );
});

UserInputNode.displayName = "UserInputNode";

export default UserInputNode;
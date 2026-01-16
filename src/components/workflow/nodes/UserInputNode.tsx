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
    <div className="relative border-2 border-dashed border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-500 dark:bg-cyan-900/20 dark:text-cyan-300 rounded-lg p-3 text-center cursor-grab transition-colors hover:bg-cyan-100 dark:hover:bg-cyan-900/30 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-cyan-500 !border-2 !border-white dark:!border-zinc-800"
      />

      <div className="font-normal text-sm mb-1">{data.label}</div>
      <div className="text-xs opacity-75">Get user data</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-cyan-500 !border-2 !border-white dark:!border-zinc-800"
      />
    </div>
  );
});

UserInputNode.displayName = "UserInputNode";

export default UserInputNode;
import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface StopWorkflowNodeData extends BaseNodeData {
  description?: string;
}

const StopWorkflowNode = ({ data }: { data: StopWorkflowNodeData }) => {
  return (
    <div className="relative border-2 border-dashed border-red-400 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300 rounded-lg p-3 text-center cursor-grab transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-red-600 !border-2 !border-white dark:!border-zinc-800"
      />

      <div className="font-semibold text-sm mb-1">{data.label}</div>
      <div className="text-xs opacity-75">End execution</div>
    </div>
  );
};

export default StopWorkflowNode;

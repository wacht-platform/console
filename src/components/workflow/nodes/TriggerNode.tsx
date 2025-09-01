import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface TriggerNodeData extends BaseNodeData {
  condition?: string;
  description?: string;
  outputNode?: boolean;
}

const TriggerNode = ({ data }: { data: TriggerNodeData }) => {
  return (
    <div className="relative border-2 border-dashed border-green-400 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-900/20 dark:text-green-300 rounded-lg p-3 text-center cursor-grab transition-colors hover:bg-green-100 dark:hover:bg-green-900/30 min-w-[140px]">
      {data.outputNode && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2 !bg-green-600 !border-2 !border-white dark:!border-zinc-800"
        />
      )}

      <div className="font-semibold text-sm mb-1">{data.label}</div>
      <div className="text-xs opacity-75">Start workflow</div>

      {!data.outputNode && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2 h-2 !bg-green-600 !border-2 !border-white dark:!border-zinc-800"
        />
      )}
    </div>
  );
};

export default TriggerNode;

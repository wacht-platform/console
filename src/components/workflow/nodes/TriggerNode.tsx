import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface TriggerNodeData extends BaseNodeData {
  condition?: string;
  description?: string;
  outputNode?: boolean;
}

const TriggerNode = ({ data }: { data: TriggerNodeData }) => {
  return (
    <div className="relative border border-dashed border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300 rounded p-0.5 text-center cursor-grab transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30 w-12 h-8">
      {data.outputNode && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-1.5 h-1.5 !bg-blue-600 !border-0"
        />
      )}

      <div className="font-medium text-xs truncate leading-tight">{data.label}</div>
      <div className="text-xs opacity-75 leading-tight">Trigger</div>

      {!data.outputNode && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-1.5 h-1.5 !bg-blue-600 !border-0"
        />
      )}
    </div>
  );
};

export default TriggerNode;

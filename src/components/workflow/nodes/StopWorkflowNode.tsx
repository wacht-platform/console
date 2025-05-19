import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface StopWorkflowNodeData extends BaseNodeData {
  description?: string;
}

const StopWorkflowNode = ({ data }: { data: StopWorkflowNodeData }) => {
  return (
    <div className="output stop-workflow border-2 border-red-600 rounded-lg p-3 shadow-lg bg-red-50 min-w-[180px] hover:border-red-700 transition-colors duration-200 ease-in-out">
      {/* Input handle at the top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-600!"
      />

      <div className="text-center text-sm text-red-800">{data.label}</div>

      {data.description && (
        <div className="text-sm text-red-700 text-center">
          {data.description}
        </div>
      )}
    </div>
  );
};

export default StopWorkflowNode;

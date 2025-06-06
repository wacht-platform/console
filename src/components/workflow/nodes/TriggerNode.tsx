import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface TriggerNodeData extends BaseNodeData {
  condition?: string;
  description?: string;
  outputNode?: boolean;
}

const TriggerNode = ({ data }: { data: TriggerNodeData }) => {
  return (
    <div className="input trigger border-2 border-blue-600 rounded-lg p-3 shadow-lg bg-blue-50 min-w-[180px] hover:border-blue-700 transition-colors duration-200 ease-in-out">
      {data.outputNode && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-600!"
        />
      )}

      <div className="text-center text-sm text-blue-800">{data.label}</div>

      {data.description && (
        <div className="text-sm text-blue-700 text-center">
          {data.description}
        </div>
      )}

      {data.condition && (
        <div className="text-xs bg-blue-100 p-2 rounded border border-blue-200">
          <span className="font-medium">Condition:</span>{" "}
          {data.condition}
        </div>
      )}

      {!data.condition && (
        <div className="text-xs bg-gray-100 p-2 rounded border border-gray-200 text-gray-600">
          Manual trigger
        </div>
      )}

      {!data.outputNode && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-600!"
        />
      )}
    </div>
  );
};

export default TriggerNode;

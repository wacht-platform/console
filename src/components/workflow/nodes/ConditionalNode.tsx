import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

const ConditionalNode = ({ data }: { data: BaseNodeData }) => {
  return (
    <div className="conditional border-2 border-amber-600 rounded-lg p-4 shadow-lg bg-amber-50 min-w-[220px] hover:border-amber-700 transition-colors duration-200 ease-in-out">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-600!"
      />

      <div className="text-center text-sm font-semibold text-amber-800 mb-2">{data.label}</div>

      {(data.description as string) && (
        <div className="text-xs text-amber-700 text-center mb-3 bg-amber-100 p-2 rounded">
          {data.description as string}
        </div>
      )}

      {(data.condition as string) && (
        <div className="text-xs text-gray-700 text-center mb-3 bg-white p-2 rounded border">
          <div className="text-xs text-gray-500 mb-1">Condition:</div>
          {data.condition as string}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="text-center">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-green-300">
            ✓ True
          </div>
          <Handle
            type="source"
            position={Position.Left}
            id="true"
            className="w-4 h-4 bg-green-500 border-2 border-green-600!"
          />
        </div>

        <div className="text-center">
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-red-300">
            ✗ False
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-4 h-4 bg-red-500 border-2 border-red-600!"
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionalNode;

export interface ConditionalNodeData extends BaseNodeData {
  condition?: string;
}

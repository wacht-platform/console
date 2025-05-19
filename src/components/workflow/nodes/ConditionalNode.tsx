import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

const ConditionalNode = ({ data }: { data: BaseNodeData }) => {
  return (
    <div className="conditional border-2 border-amber-600 rounded-lg p-3 shadow-lg bg-amber-50 min-w-[200px] hover:border-amber-700 transition-colors duration-200 ease-in-out">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-600!"
      />

      <div className="text-center text-sm text-amber-800">{data.label}</div>

      {(data.description as string) && (
        <div className="text-sm text-amber-700">
          {data.description as string}
        </div>
      )}

      <div className="flex justify-between">
        <div className="text-center">
          <div className="text-xs font-medium text-green-700">True</div>
          <Handle
            type="source"
            position={Position.Left}
            id="true"
            className="bg-green-500!"
          />
        </div>

        <div className="text-center">
          <div className="text-xs font-medium text-red-700">False</div>
          {/* False handle at the bottom right */}
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="bg-red-500!"
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

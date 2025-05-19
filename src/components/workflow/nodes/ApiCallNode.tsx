import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface ApiCallNodeData extends BaseNodeData {
  endpoint?: string;
  method?: string;
  description?: string;
}

const ApiCallNode = ({ data }: { data: ApiCallNodeData }) => {
  return (
    <div className="action rest-api border-2 border-orange-600 rounded-lg p-3 shadow-lg bg-orange-50 min-w-[180px] hover:border-orange-700 transition-colors duration-200 ease-in-out">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-600!"
      />

      <div className="text-center text-sm text-orange-800">{data.label}</div>

      {data.description && (
        <div className="text-sm text-green-700 text-center">
          {data.description}
        </div>
      )}

      {data.endpoint && (
        <div className="text-xs bg-green-100 p-2 rounded border border-orange-200 mt-2">
          <span className="font-medium">{data.method || "GET"}:</span>{" "}
          {data.endpoint}
        </div>
      )}

      {/* Output handle at the bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-600!"
      />
    </div>
  );
};

export default ApiCallNode;

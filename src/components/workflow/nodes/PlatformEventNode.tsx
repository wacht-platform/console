import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface PlatformEventNodeData extends BaseNodeData {
  event_label?: string;
  description?: string;
}

const PlatformEventNode = ({
  data,
}: {
  data: PlatformEventNodeData;
}) => {
  return (
    <div className="action platform-event border-2 border-purple-600 rounded-lg p-3 shadow-lg bg-purple-50 min-w-[180px] hover:border-purple-700 transition-colors duration-200 ease-in-out">
      {/* Input handle at the top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-600!"
      />

      <div className="text-center text-sm text-purple-800">{data.label}</div>

      {data.description && (
        <div className="text-sm text-purple-700 text-center">
          {data.description}
        </div>
      )}

      {data.event_label && (
        <div className="text-xs bg-purple-100 p-2 rounded border border-purple-200">
          <span className="font-medium">Event:</span> {data.event_label}
        </div>
      )}

      {/* Output handle at the bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-600!"
      />
    </div>
  );
};

export default PlatformEventNode;

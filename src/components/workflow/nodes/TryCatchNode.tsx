import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";

interface TryCatchNodeData {
  label: string;
  description: string;
  enable_retry?: boolean;
  max_retries?: number;
  retry_delay_seconds?: number;
  log_errors?: boolean;
  custom_error_message?: string;
  contained_nodes?: string[]; // IDs of nodes contained within this try/catch
}

interface TryCatchNodeProps {
  data: TryCatchNodeData;
  selected?: boolean;
}

const TryCatchNode = memo(({ data, selected }: TryCatchNodeProps) => {
  const containedNodesCount = data.contained_nodes?.length || 0;

  return (
    <div
      className={`relative shadow-md rounded-md bg-yellow-50 border-2 min-w-[500px] min-h-[400px] ${
        selected ? "border-yellow-500" : "border-yellow-300"
      }`}
      style={{ zIndex: 0 }} // Lower z-index so other nodes can be dropped on top
      data-node-type="try-catch"
    >
      {/* Node Resizer */}
      <NodeResizer
        color="#eab308"
        isVisible={selected}
        minWidth={500}
        minHeight={400}
      />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white"
        style={{ zIndex: 10 }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 rounded-t-md z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <div className="font-medium text-yellow-800 text-sm">Try/Catch Container</div>
          </div>
          <div className="text-xs text-yellow-600">
            {containedNodesCount === 1 ? '1 protected node' : 'No protected node'}
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="mt-1 text-xs text-yellow-700 flex gap-4">
          {data.enable_retry && (
            <span>Retry: <span className="font-medium">Enabled</span></span>
          )}
          {data.enable_retry && data.max_retries && data.max_retries > 0 && (
            <span>Max Retries: <span className="font-medium">{data.max_retries}</span></span>
          )}
          {!data.enable_retry && (
            <span>Retry: <span className="font-medium">Disabled</span></span>
          )}
        </div>
      </div>

      {/* Container Drop Zone */}
      <div
        className="absolute top-20 left-6 right-6 bottom-20 border-4 border-dashed border-yellow-400 rounded-lg bg-yellow-25 flex items-center justify-center hover:border-yellow-500 hover:bg-yellow-100 transition-colors"
        style={{ zIndex: 1 }}
      >
        {containedNodesCount === 0 ? (
          <div className="text-center text-yellow-600 pointer-events-none p-8">
            <PlusIcon className="w-12 h-12 mx-auto mb-4 opacity-60" />
            <div className="text-lg font-medium mb-2">Try/Catch Protection Zone</div>
            <div className="text-sm opacity-75 mb-2">Drop ONE workflow node here to protect it</div>
            <div className="text-sm opacity-75 mb-4">with error handling and retry logic</div>
            <div className="text-xs bg-yellow-200 rounded px-3 py-2 inline-block">
              💡 Only one node can be protected at a time
            </div>
          </div>
        ) : (
          <div className="text-center text-yellow-700 pointer-events-none p-8">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 opacity-60" />
            <div className="text-lg font-medium mb-2">1 Protected Node</div>
            <div className="text-sm opacity-75 mb-2">Error handling and retry logic active</div>
            <div className="text-xs bg-green-200 rounded px-3 py-2 inline-block">
              ✅ Node is protected from errors
            </div>
          </div>
        )}
      </div>

      {/* Success Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-3 h-3 !bg-green-500 border-2 border-white !left-[25%]"
        style={{ zIndex: 10 }}
      />

      {/* Error Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        className="w-3 h-3 !bg-red-500 border-2 border-white !left-[75%]"
        style={{ zIndex: 10 }}
      />

      {/* Handle Labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500 z-10">
        <span className="ml-[15%]">Success</span>
        <span className="mr-[15%]">Error</span>
      </div>
    </div>
  );
});

TryCatchNode.displayName = "TryCatchNode";

export default TryCatchNode;

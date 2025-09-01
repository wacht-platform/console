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
      className={`relative shadow-lg rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 min-w-[280px] min-h-[220px] transition-all duration-300 hover:shadow-xl ${
        selected ? "border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800" : "border-yellow-400 hover:border-yellow-500 dark:border-yellow-600 dark:hover:border-yellow-500"
      }`}
      style={{ zIndex: 0 }}
      data-node-type="try-catch"
    >
      {/* Node Resizer */}
      <NodeResizer
        color="#eab308"
        isVisible={selected}
        minWidth={280}
        minHeight={220}
      />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-yellow-600 !border-2 !border-white dark:!border-zinc-800"
        style={{ zIndex: 10 }}
      />

      {/* Compact Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-b border-yellow-300 dark:border-yellow-700 px-3 py-2 rounded-t-xl z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{data.label}</div>
          </div>
          <div className={`w-2 h-2 rounded-full ${containedNodesCount === 1 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>

        {/* Compact Configuration Indicators */}
        <div className="flex gap-2 mt-1">
          {data.enable_retry && (
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              Retry: {data.max_retries || 3}x
            </div>
          )}
          {data.log_errors !== false && (
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              Logging
            </div>
          )}
        </div>
      </div>

      {/* Container Drop Zone */}
      <div
        className="absolute top-16 left-4 right-4 bottom-12 border-2 border-dashed border-yellow-400 dark:border-yellow-600 rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10 flex items-center justify-center hover:border-yellow-500 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20 transition-all duration-200"
        style={{ zIndex: 1 }}
      >
        {containedNodesCount === 0 ? (
          <div className="text-center text-yellow-600 dark:text-yellow-400 pointer-events-none p-4">
            <PlusIcon className="w-6 h-6 mx-auto mb-2 opacity-60" />
            <div className="text-xs font-medium">Drop node here</div>
            <div className="text-xs opacity-75">to add error handling</div>
          </div>
        ) : (
          <div className="text-center text-green-600 dark:text-green-400 pointer-events-none p-4">
            <div className="text-xs font-medium">✓ Node Protected</div>
            <div className="text-xs opacity-75">Error handling active</div>
          </div>
        )}
      </div>

      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-2 h-2 !bg-green-600 !border-2 !border-white dark:!border-zinc-800 !left-[30%]"
        style={{ zIndex: 10 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        className="w-2 h-2 !bg-red-600 !border-2 !border-white dark:!border-zinc-800 !left-[70%]"
        style={{ zIndex: 10 }}
      />

      {/* Handle Labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs z-10">
        <div className="ml-[20%] text-green-600 dark:text-green-400">
          Success
        </div>
        <div className="mr-[20%] text-red-600 dark:text-red-400">
          Error
        </div>
      </div>
    </div>
  );
});

TryCatchNode.displayName = "TryCatchNode";

export default TryCatchNode;

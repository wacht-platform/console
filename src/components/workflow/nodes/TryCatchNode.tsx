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
      className={`relative shadow-xl rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-3 min-w-[520px] min-h-[420px] transition-all duration-300 hover:shadow-2xl ${
        selected ? "border-yellow-500 ring-4 ring-yellow-200" : "border-yellow-400 hover:border-yellow-500"
      }`}
      style={{ zIndex: 0 }}
      data-node-type="try-catch"
    >
      {/* Node Resizer */}
      <NodeResizer
        color="#eab308"
        isVisible={selected}
        minWidth={520}
        minHeight={420}
      />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 !bg-yellow-600 !border-2 !border-white shadow-md"
        style={{ zIndex: 10 }}
      />

      {/* Enhanced Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-100 to-amber-100 border-b-2 border-yellow-300 px-6 py-4 rounded-t-2xl z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
              <ExclamationTriangleIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{data.label}</div>
              <div className="text-xs text-yellow-600 font-medium">TRY/CATCH CONTAINER</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${containedNodesCount === 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs font-medium text-yellow-700">
              {containedNodesCount === 1 ? '1 Protected Node' : 'No Protected Node'}
            </span>
          </div>
        </div>

        {/* Enhanced Configuration Summary */}
        <div className="flex flex-wrap gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            data.enable_retry 
              ? 'bg-green-200 text-green-800' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {data.enable_retry ? '🔄 Retry Enabled' : '❌ Retry Disabled'}
          </div>
          
          {data.enable_retry && data.max_retries && data.max_retries > 0 && (
            <div className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
              📊 Max: {data.max_retries} retries
            </div>
          )}
          
          {data.retry_delay_seconds && (
            <div className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
              ⏱️ Delay: {data.retry_delay_seconds}s
            </div>
          )}
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            data.log_errors !== false 
              ? 'bg-indigo-200 text-indigo-800' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {data.log_errors !== false ? '📝 Logging On' : '📝 Logging Off'}
          </div>
        </div>
      </div>

      {/* Enhanced Container Drop Zone */}
      <div
        className="absolute top-24 left-8 right-8 bottom-24 border-4 border-dashed border-yellow-400 rounded-2xl bg-gradient-to-br from-yellow-25 to-amber-25 flex items-center justify-center hover:border-yellow-500 hover:from-yellow-50 hover:to-amber-50 transition-all duration-300 shadow-inner"
        style={{ zIndex: 1 }}
      >
        {containedNodesCount === 0 ? (
          <div className="text-center text-yellow-600 pointer-events-none p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <PlusIcon className="w-8 h-8 text-yellow-700" />
            </div>
            <div className="text-xl font-bold mb-3 text-gray-800">Error Protection Zone</div>
            <div className="text-sm opacity-90 mb-2 leading-relaxed">Drop <strong>one workflow node</strong> here to protect it</div>
            <div className="text-sm opacity-90 mb-6 leading-relaxed">with advanced error handling and retry logic</div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-xl px-4 py-3 shadow-md">
              <span className="text-lg">🛡️</span>
              <div className="text-xs font-medium text-yellow-800">
                <div>Only one node can be protected</div>
                <div className="opacity-75">at a time for optimal error handling</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-yellow-700 pointer-events-none p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ExclamationTriangleIcon className="w-8 h-8 text-green-700" />
            </div>
            <div className="text-xl font-bold mb-3 text-gray-800">Node Protected</div>
            <div className="text-sm opacity-90 mb-2 leading-relaxed">Error handling and retry logic are <strong>active</strong></div>
            <div className="text-sm opacity-90 mb-6 leading-relaxed">Your workflow node is safely protected</div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl px-4 py-3 shadow-md">
              <span className="text-lg">✅</span>
              <div className="text-xs font-medium text-green-800">
                <div>Protection Active</div>
                <div className="opacity-75">Errors will be caught and handled</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Output Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-4 h-4 !bg-green-600 !border-2 !border-white shadow-md !left-[25%]"
        style={{ zIndex: 10 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        className="w-4 h-4 !bg-red-600 !border-2 !border-white shadow-md !left-[75%]"
        style={{ zIndex: 10 }}
      />

      {/* Enhanced Handle Labels */}
      <div className="absolute -bottom-10 left-0 right-0 flex justify-between text-xs font-medium z-10">
        <div className="ml-[15%] bg-green-100 text-green-800 px-3 py-1 rounded-full shadow-sm border border-green-200">
          ✅ Success
        </div>
        <div className="mr-[15%] bg-red-100 text-red-800 px-3 py-1 rounded-full shadow-sm border border-red-200">
          ❌ Error
        </div>
      </div>
    </div>
  );
});

TryCatchNode.displayName = "TryCatchNode";

export default TryCatchNode;

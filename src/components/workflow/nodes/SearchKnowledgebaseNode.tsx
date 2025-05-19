import { Handle, Position } from "@xyflow/react";
import type { BaseNodeData } from "../../../types/NodeTypes";

export interface SearchKnowledgebaseNodeData extends BaseNodeData {
  query?: string;
  knowledgebaseId?: string;
  description?: string;
}

const SearchKnowledgebaseNode = ({
  data,
}: {
  data: SearchKnowledgebaseNodeData;
}) => {
  return (
    <div className="action search-kb border-2 border-green-600 rounded-lg p-3 shadow-lg bg-green-50 min-w-[180px] hover:border-green-700 transition-colors duration-200 ease-in-out">
      {/* Input handle at the top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-600!"
      />

      <div className="text-center text-sm text-green-800">{data.label}</div>

      {data.description && (
        <div className="text-sm text-green-700 text-center">
          {data.description}
        </div>
      )}

      {data.query && (
        <div className="text-xs bg-green-100 p-2 rounded border border-green-200">
          <span className="font-medium">Query:</span> {data.query}
          {data.knowledgebaseId && (
            <div className="mt-1">
              <span className="font-medium">KB ID:</span> {data.knowledgebaseId}
            </div>
          )}
        </div>
      )}

      {/* Output handle at the bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-600!"
      />
    </div>
  );
};

export default SearchKnowledgebaseNode;

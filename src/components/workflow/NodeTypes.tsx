import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  FireIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";

export interface WorkflowNodeData {
  label: string;
  description?: string;
  type: "trigger" | "condition" | "action" | "transform";
  config?: Record<string, unknown>;
}

const nodeStyles =
  "workflow-node p-4 rounded-lg border shadow-sm min-w-[200px] bg-white";

const BaseNode: React.FC<{
  children: React.ReactNode;
  data: WorkflowNodeData;
  isConnectable: boolean;
}> = ({ children, data, isConnectable }) => {
  const hasSingleOutput =
    data.type === "trigger" ||
    data.type === "transform" ||
    data.type === "action";
  const hasMultipleOutputs = data.type === "condition";

  return (
    <div className={nodeStyles}>
      {/* Input handle (all nodes except triggers have inputs) */}
      {data.type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="react-flow__handle-top w-3 h-3 bg-gray-400"
        />
      )}

      {children}

      {/* Output handles */}
      {hasSingleOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          isConnectable={isConnectable}
          className="react-flow__handle-bottom w-3 h-3 bg-blue-500"
        />
      )}

      {hasMultipleOutputs && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: "30%" }}
            isConnectable={isConnectable}
            className="react-flow__handle-bottom-true w-3 h-3 bg-green-500"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: "70%" }}
            isConnectable={isConnectable}
            className="react-flow__handle-bottom-false w-3 h-3 bg-red-500"
          />
        </>
      )}
    </div>
  );
};

// Trigger Node
export const TriggerNode: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  isConnectable,
}) => {
  return (
    <BaseNode data={data} isConnectable={isConnectable}>
      <div className="node-content flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <FireIcon className="h-4 w-4" />
          </div>
          <Badge className="bg-orange-100 text-orange-600">Trigger</Badge>
        </div>
        <div className="font-medium text-lg">{data.label}</div>
        {data.description && (
          <div className="text-sm text-gray-500">{data.description}</div>
        )}
      </div>
    </BaseNode>
  );
};

// Condition Node
export const ConditionNode: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  isConnectable,
}) => {
  return (
    <BaseNode data={data} isConnectable={isConnectable}>
      <div className="node-content flex flex-col gap-2">
        <div className="node-header flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ArrowsRightLeftIcon className="h-4 w-4" />
          </div>
          <Badge className="bg-blue-100 text-blue-600">Condition</Badge>
        </div>
        <div className="font-medium text-lg">{data.label}</div>
        {data.description && (
          <div className="text-sm text-gray-500">{data.description}</div>
        )}
        <div className="flex justify-between mt-2 text-xs">
          <div className="text-green-600">True</div>
          <div className="text-red-600">False</div>
        </div>
      </div>
    </BaseNode>
  );
};

// Action Node
export const ActionNode: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  isConnectable,
}) => {
  return (
    <BaseNode data={data} isConnectable={isConnectable}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <BoltIcon className="h-4 w-4" />
          </div>
          <Badge className="bg-purple-100 text-purple-600">Action</Badge>
        </div>
        <div className="font-medium text-lg">{data.label}</div>
        {data.description && (
          <div className="text-sm text-gray-500">{data.description}</div>
        )}
      </div>
    </BaseNode>
  );
};

// Transform Node
export const TransformNode: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  isConnectable,
}) => {
  return (
    <BaseNode data={data} isConnectable={isConnectable}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CodeBracketIcon className="h-4 w-4" />
          </div>
          <Badge className="bg-green-100 text-green-600">Transform</Badge>
        </div>
        <div className="font-medium text-lg">{data.label}</div>
        {data.description && (
          <div className="text-sm text-gray-500">{data.description}</div>
        )}
      </div>
    </BaseNode>
  );
};

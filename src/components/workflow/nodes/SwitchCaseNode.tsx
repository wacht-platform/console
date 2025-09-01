import { memo } from "react";
import { Handle, Position } from "@xyflow/react";


interface SwitchCase {
  case_condition: string;
  case_label?: string;
}

interface SwitchCaseNodeData {
  label: string;
  description: string;
  switch_condition?: string;
  cases?: SwitchCase[];
  default_case?: boolean;
}

interface SwitchCaseNodeProps {
  data: SwitchCaseNodeData;
  selected?: boolean;
  onUpdateData?: (data: SwitchCaseNodeData) => void;
}

const SwitchCaseNode = memo(({ data }: SwitchCaseNodeProps) => {
  const cases = data.cases || [];
  const numberOfCases = cases.length;
  const totalOutputs = numberOfCases + (data.default_case ? 1 : 0);
  const handleSpacing = totalOutputs > 1 ? 80 / (totalOutputs - 1) : 0;

  return (
    <div className="relative border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300 rounded-lg p-3 text-center cursor-grab transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/30 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-indigo-500 !border-2 !border-white dark:!border-zinc-800"
      />

      <div className="font-semibold text-sm mb-1">{data.label}</div>
      <div className="text-xs opacity-75">Conditional logic</div>

      {/* Output Handles for Cases */}
      {Array.from({ length: numberOfCases }, (_, index) => (
        <Handle
          key={`case-${index}`}
          type="source"
          position={Position.Bottom}
          id={`case-${index}`}
          className="w-2 h-2 !bg-indigo-500 !border-2 !border-white dark:!border-zinc-800"
          style={{
            left: totalOutputs === 1 ? '50%' : `${10 + (index * handleSpacing)}%`
          }}
        />
      ))}

      {/* Default Case Handle */}
      {data.default_case && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className="w-2 h-2 !bg-gray-500 !border-2 !border-white dark:!border-zinc-800"
          style={{
            left: totalOutputs === 1 ? '50%' : `${10 + (numberOfCases * handleSpacing)}%`
          }}
        />
      )}
    </div>
  );
});

SwitchCaseNode.displayName = "SwitchCaseNode";

export default SwitchCaseNode;

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

interface SwitchCase {
  case_value: string;
  case_label?: string;
}

interface SwitchCaseNodeData {
  label: string;
  description: string;
  switch_variable?: string;
  comparison_type?: "equals" | "contains" | "starts_with" | "ends_with" | "regex";
  cases?: SwitchCase[];
  default_case?: boolean;
  case_sensitive?: boolean;
  number_of_cases?: number; // Number of cases to configure
}

interface SwitchCaseNodeProps {
  data: SwitchCaseNodeData;
  selected?: boolean;
  onUpdateData?: (data: SwitchCaseNodeData) => void;
}

const SwitchCaseNode = memo(({ data, selected }: SwitchCaseNodeProps) => {
  const numberOfCases = data.number_of_cases || 0;
  const cases = data.cases || [];

  // Calculate handle positions based on number_of_cases
  const totalOutputs = numberOfCases + (data.default_case ? 1 : 0);
  const handleSpacing = totalOutputs > 1 ? 80 / (totalOutputs - 1) : 0;



  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md bg-indigo-50 border-2 min-w-[220px] ${
        selected ? "border-indigo-500" : "border-indigo-300"
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-indigo-500 border-2 border-white"
      />

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-indigo-600" />
        <div className="font-medium text-indigo-800 text-sm">Switch/Case</div>
      </div>

      {/* Node Content */}
      <div className="text-xs text-indigo-700">
        <div className="font-medium">{data.label}</div>
        {data.description && (
          <div className="text-indigo-600 mt-1">{data.description}</div>
        )}

        {/* Configuration Summary */}
        <div className="mt-2 space-y-1">
          {data.switch_variable && (
            <div className="flex justify-between">
              <span>Variable:</span>
              <span className="font-medium truncate max-w-[100px]" title={data.switch_variable}>
                {data.switch_variable}
              </span>
            </div>
          )}
          {data.comparison_type && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-medium capitalize">{data.comparison_type.replace('_', ' ')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Cases:</span>
            <span className="font-medium">{numberOfCases}</span>
          </div>
          {data.default_case && (
            <div className="flex justify-between">
              <span>Default:</span>
              <span className="font-medium text-gray-600">Yes</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-2 p-2 bg-indigo-100 rounded text-xs">
          <div className="font-medium text-indigo-800 mb-1">Configuration:</div>
          <div className="text-indigo-700">
            Configure cases and variable in node settings. Each case will get its own output handle.
          </div>
        </div>
      </div>

      {/* Output Handles for Cases */}
      {Array.from({ length: numberOfCases }, (_, index) => (
        <Handle
          key={`case-${index}`}
          type="source"
          position={Position.Bottom}
          id={`case-${index}`}
          className="w-3 h-3 !bg-indigo-500 border-2 border-white"
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
          className="w-3 h-3 !bg-gray-500 border-2 border-white"
          style={{
            left: totalOutputs === 1 ? '50%' : `${10 + (numberOfCases * handleSpacing)}%`
          }}
        />
      )}

      {/* Handle Labels */}
      {totalOutputs > 1 && (
        <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
          {Array.from({ length: numberOfCases }, (_, index) => {
            const caseData = cases[index];
            return (
              <span
                key={`label-${index}`}
                className="truncate max-w-[40px]"
                title={caseData?.case_label || caseData?.case_value || `Case ${index + 1}`}
                style={{
                  position: 'absolute',
                  left: `${10 + (index * handleSpacing)}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {caseData?.case_label || caseData?.case_value || `C${index + 1}`}
              </span>
            );
          })}
          {data.default_case && (
            <span
              className="italic"
              style={{
                position: 'absolute',
                left: `${10 + (numberOfCases * handleSpacing)}%`,
                transform: 'translateX(-50%)'
              }}
            >
              default
            </span>
          )}
        </div>
      )}
    </div>
  );
});

SwitchCaseNode.displayName = "SwitchCaseNode";

export default SwitchCaseNode;

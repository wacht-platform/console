import type { BaseNodeData } from "../../../types/NodeTypes";

const SkipStepNode = ({ data }: { data: BaseNodeData }) => {
  return (
    <div className="action skip border-2 border-orange-600 rounded-lg p-3 shadow-lg bg-orange-50 min-w-[180px] hover:border-orange-700 transition-colors duration-200 ease-in-out">
      <div className="text-center text-sm text-orange-800">{data.label}</div>
    </div>
  );
};

export default SkipStepNode;

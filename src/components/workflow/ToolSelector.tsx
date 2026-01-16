import { useState, useEffect } from "react";
import { useTools } from "../../lib/api/hooks/use-tools";
import { Select } from "../ui/select";
import { Field, Label, Fieldset } from "../ui/fieldset";
import { Input } from "../ui/input";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import type { AiTool } from "../../types/ai-tool";

interface ToolSelectorProps {
  selectedToolId?: string;
  onToolSelect: (tool: AiTool | null) => void;
  onParametersChange: (parameters: Record<string, unknown>) => void;
  inputParameters?: Record<string, unknown>;
}

export default function ToolSelector({
  selectedToolId,
  onToolSelect,
  onParametersChange,
  inputParameters = {},
}: ToolSelectorProps) {
  const { data: toolsData, isLoading } = useTools({ limit: 100 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTools, setFilteredTools] = useState<AiTool[]>([]);

  const tools = toolsData?.tools || [];

  // Filter tools based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTools(tools);
    } else {
      const filtered = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.tool_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTools(filtered);
    }
  }, [tools, searchTerm]);

  const selectedTool = tools.find(tool => tool.id === selectedToolId);

  const handleToolChange = (toolId: string) => {
    if (toolId === "") {
      onToolSelect(null);
    } else {
      const tool = tools.find(t => t.id === toolId);
      onToolSelect(tool || null);
    }
  };

  const handleParameterChange = (key: string, value: string) => {
    const newParameters = { ...inputParameters, [key]: value };
    onParametersChange(newParameters);
  };

  const addParameter = () => {
    const newKey = `param_${Object.keys(inputParameters).length + 1}`;
    handleParameterChange(newKey, "");
  };

  const removeParameter = (key: string) => {
    const newParameters = { ...inputParameters };
    delete newParameters[key];
    onParametersChange(newParameters);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-500">Loading tools...</div>
      </div>
    );
  }

  return (
    <Fieldset className="space-y-6">
      {/* Tool Selection */}
      <div className="space-y-4">
        <Field>
          <Label>Search Tools</Label>
          <Input
            type="text"
            placeholder="Search by name, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Field>

        <Field>
          <Label>Select Tool</Label>
          <Select
            value={selectedToolId || ""}
            onValueChange={(value) => handleToolChange(value)}
          >
            <option value="">No tool selected</option>
            {filteredTools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name} ({tool.tool_type})
              </option>
            ))}
          </Select>
        </Field>

        {selectedTool && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <WrenchScrewdriverIcon className="w-5 h-5 text-indigo-600" />
              <div className="font-medium text-indigo-800">{selectedTool.name}</div>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">
                {selectedTool.tool_type}
              </span>
            </div>
            {selectedTool.description && (
              <div className="text-sm text-indigo-700 mb-2">
                {selectedTool.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Parameters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Input Parameters</h4>
          <button
            type="button"
            onClick={addParameter}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Parameter
          </button>
        </div>

        {Object.entries(inputParameters).length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No parameters configured. Click "Add Parameter" to add input parameters for the tool.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(inputParameters).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="Parameter name"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const newParameters = { ...inputParameters };
                    delete newParameters[key];
                    newParameters[newKey] = value;
                    onParametersChange(newParameters);
                  }}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="Parameter value"
                  value={String(value)}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeParameter(key)}
                  className="text-red-600 hover:text-red-700 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Fieldset>
  );
}

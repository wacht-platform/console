import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from './workflowStore';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Listbox, ListboxOption } from '@/components/ui/listbox';
import { WorkflowNodeData } from './NodeTypes';

// Ensure we always have a string value for input elements
const getStringValue = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  return String(value);
};

interface ConfigPanelProps {
  selectedNodeId: string | null;
  onClose: () => void;
}

export const NodeConfigPanel: React.FC<ConfigPanelProps> = ({ 
  selectedNodeId, 
  onClose 
}) => {
  const { nodes, updateNodeData } = useWorkflowStore();
  const [localNodeData, setLocalNodeData] = useState<WorkflowNodeData | null>(null);
  
  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) : null;

  useEffect(() => {
    if (selectedNode) {
      setLocalNodeData(selectedNode.data);
    } else {
      setLocalNodeData(null);
    }
  }, [selectedNode]);

  if (!selectedNode || !localNodeData) {
    return null;
  }

  const handleChange = (field: keyof WorkflowNodeData, value: string) => {
    setLocalNodeData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleConfigChange = (field: string, value: unknown) => {
    setLocalNodeData(prev => {
      if (!prev) return prev;
      return { 
        ...prev, 
        config: { ...(prev.config || {}), [field]: value } 
      };
    });
  };

  const saveChanges = () => {
    if (selectedNodeId && localNodeData) {
      updateNodeData(selectedNodeId, localNodeData);
    }
  };

  const renderCommonFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Node Label
        </label>
        <Input
          value={localNodeData.label || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('label', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Input
          value={localNodeData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('description', e.target.value)}
        />
      </div>
    </div>
  );

  const renderTriggerOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trigger Type
        </label>
        <Listbox
          value={getStringValue(localNodeData.config?.triggerType) || 'webhook'}
          onChange={(value: string) => handleConfigChange('triggerType', value)}
          className="w-full"
        >
          <ListboxOption value="webhook">Webhook</ListboxOption>
          <ListboxOption value="schedule">Schedule</ListboxOption>
          <ListboxOption value="event">Application Event</ListboxOption>
        </Listbox>
      </div>
      
      {localNodeData.config?.triggerType === 'schedule' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cron Expression
          </label>
          <Input
            value={getStringValue(localNodeData.config?.cronExpression)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('cronExpression', e.target.value)}
            placeholder="* * * * *"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use cron format: minute hour day month weekday
          </p>
        </div>
      )}
      
      {localNodeData.config?.triggerType === 'event' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name
          </label>
          <Input
            value={getStringValue(localNodeData.config?.eventName)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('eventName', e.target.value)}
            placeholder="user.created"
          />
        </div>
      )}
    </div>
  );

  const renderConditionOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition Type
        </label>
        <Listbox
          value={getStringValue(localNodeData.config?.conditionType) || 'equals'}
          onChange={(value: string) => handleConfigChange('conditionType', value)}
          className="w-full"
        >
          <ListboxOption value="equals">Equals</ListboxOption>
          <ListboxOption value="contains">Contains</ListboxOption>
          <ListboxOption value="greaterThan">Greater Than</ListboxOption>
          <ListboxOption value="lessThan">Less Than</ListboxOption>
          <ListboxOption value="expression">Custom Expression</ListboxOption>
        </Listbox>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Left Value
        </label>
        <Input
          value={getStringValue(localNodeData.config?.leftValue)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('leftValue', e.target.value)}
          placeholder="{{data.value}}"
        />
      </div>
      
      {localNodeData.config?.conditionType !== 'expression' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Right Value
          </label>
          <Input
            value={getStringValue(localNodeData.config?.rightValue)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('rightValue', e.target.value)}
          />
        </div>
      )}
      
      {localNodeData.config?.conditionType === 'expression' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expression
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
            value={getStringValue(localNodeData.config?.expression)}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('expression', e.target.value)}
            placeholder="data.value > 10 && data.status === 'active'"
          />
        </div>
      )}
    </div>
  );

  const renderActionOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Action Type
        </label>
        <Listbox
          value={getStringValue(localNodeData.config?.actionType) || 'http'}
          onChange={(value: string) => handleConfigChange('actionType', value)}
          className="w-full"
        >
          <ListboxOption value="http">HTTP Request</ListboxOption>
          <ListboxOption value="email">Send Email</ListboxOption>
          <ListboxOption value="database">Database Operation</ListboxOption>
        </Listbox>
      </div>
      
      {localNodeData.config?.actionType === 'http' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <Input
              value={getStringValue(localNodeData.config?.url)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <Listbox
              value={getStringValue(localNodeData.config?.method) || 'GET'}
              onChange={(value: string) => handleConfigChange('method', value)}
              className="w-full"
            >
              <ListboxOption value="GET">GET</ListboxOption>
              <ListboxOption value="POST">POST</ListboxOption>
              <ListboxOption value="PUT">PUT</ListboxOption>
              <ListboxOption value="DELETE">DELETE</ListboxOption>
            </Listbox>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headers (JSON)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
              value={getStringValue(localNodeData.config?.headers)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('headers', e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Body (JSON)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
              value={getStringValue(localNodeData.config?.body)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('body', e.target.value)}
              placeholder='{"key": "{{data.value}}"}'
            />
          </div>
        </>
      )}
      
      {localNodeData.config?.actionType === 'email' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <Input
              value={getStringValue(localNodeData.config?.to)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('to', e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <Input
              value={getStringValue(localNodeData.config?.subject)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('subject', e.target.value)}
              placeholder="Email Subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
              value={getStringValue(localNodeData.config?.emailBody)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('emailBody', e.target.value)}
              placeholder="Email content with {{data.variables}}"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderTransformOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Transform Type
        </label>
        <Listbox
          value={getStringValue(localNodeData.config?.transformType) || 'map'}
          onChange={(value: string) => handleConfigChange('transformType', value)}
          className="w-full"
        >
          <ListboxOption value="map">Map Data</ListboxOption>
          <ListboxOption value="filter">Filter Data</ListboxOption>
          <ListboxOption value="code">Custom Code</ListboxOption>
        </Listbox>
      </div>
      
      {localNodeData.config?.transformType === 'map' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mapping Template (JSON)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
            value={getStringValue(localNodeData.config?.mapTemplate)}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('mapTemplate', e.target.value)}
            placeholder='{"newKey": "{{data.oldKey}}", "computed": "{{data.value * 2}}"}'
          />
        </div>
      )}
      
      {localNodeData.config?.transformType === 'filter' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter Condition
          </label>
          <Input
            value={getStringValue(localNodeData.config?.filterCondition)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('filterCondition', e.target.value)}
            placeholder="item.value > 10"
          />
          <p className="text-xs text-gray-500 mt-1">
            JavaScript expression to filter array items
          </p>
        </div>
      )}
      
      {localNodeData.config?.transformType === 'code' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            JavaScript Code
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-48 font-mono text-sm"
            value={getStringValue(localNodeData.config?.customCode)}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleConfigChange('customCode', e.target.value)}
            placeholder="// data and context are available\nreturn {\n  result: data.value * 2\n};"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 border-l border-gray-200 h-full overflow-y-auto bg-white">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge className={`${selectedNode?.type === 'trigger' ? 'bg-orange-100 text-orange-600' : 
            selectedNode?.type === 'condition' ? 'bg-blue-100 text-blue-600' : 
            selectedNode?.type === 'action' ? 'bg-purple-100 text-purple-600' : 
            'bg-green-100 text-green-600'}`}>
            {selectedNode?.type ? selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1) : 'Node'}
          </Badge>
          <h3 className="font-medium">Configure Node</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        {renderCommonFields()}
        
        <hr className="my-4" />
        
        {selectedNode?.type === 'trigger' && renderTriggerOptions()}
        {selectedNode?.type === 'condition' && renderConditionOptions()}
        {selectedNode?.type === 'action' && renderActionOptions()}
        {selectedNode?.type === 'transform' && renderTransformOptions()}
        
        <div className="pt-4 flex justify-end">
          <Button onClick={saveChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
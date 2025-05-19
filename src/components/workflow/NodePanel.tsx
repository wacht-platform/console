import React from 'react';
import { FC } from 'react';
import { FireIcon, ArrowsRightLeftIcon, BoltIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import DraggableNode from './DraggableNode';

// Node category interfaces
interface NodeItem {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'transform';
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface NodeCategory {
  title: string;
  type: string;
  items: NodeItem[];
}

// Sample node definitions
const nodeCategories: NodeCategory[] = [
  {
    title: 'Triggers',
    type: 'trigger',
    items: [
      {
        id: 'webhook',
        type: 'trigger',
        label: 'Webhook',
        description: 'Start workflow when webhook is called',
        icon: FireIcon,
        color: 'text-orange-600 bg-orange-100',
      },
      {
        id: 'schedule',
        type: 'trigger',
        label: 'Schedule',
        description: 'Run workflow on a time schedule',
        icon: FireIcon,
        color: 'text-orange-600 bg-orange-100',
      },
      {
        id: 'event',
        type: 'trigger',
        label: 'Event',
        description: 'Trigger on application events',
        icon: FireIcon,
        color: 'text-orange-600 bg-orange-100',
      },
    ],
  },
  {
    title: 'Conditions',
    type: 'condition',
    items: [
      {
        id: 'if-then',
        type: 'condition',
        label: 'If-Then',
        description: 'Branch based on a condition',
        icon: ArrowsRightLeftIcon,
        color: 'text-blue-600 bg-blue-100',
      },
      {
        id: 'switch',
        type: 'condition',
        label: 'Switch',
        description: 'Multiple conditional branches',
        icon: ArrowsRightLeftIcon,
        color: 'text-blue-600 bg-blue-100',
      },
    ],
  },
  {
    title: 'Actions',
    type: 'action',
    items: [
      {
        id: 'http-request',
        type: 'action',
        label: 'HTTP Request',
        description: 'Make an HTTP/API request',
        icon: BoltIcon,
        color: 'text-purple-600 bg-purple-100',
      },
      {
        id: 'send-email',
        type: 'action',
        label: 'Send Email',
        description: 'Send an email notification',
        icon: BoltIcon,
        color: 'text-purple-600 bg-purple-100',
      },
      {
        id: 'update-database',
        type: 'action',
        label: 'Update Database',
        description: 'Update a database record',
        icon: BoltIcon,
        color: 'text-purple-600 bg-purple-100',
      },
    ],
  },
  {
    title: 'Transforms',
    type: 'transform',
    items: [
      {
        id: 'json-transform',
        type: 'transform',
        label: 'JSON Transform',
        description: 'Transform JSON data',
        icon: CodeBracketIcon,
        color: 'text-green-600 bg-green-100',
      },
      {
        id: 'filter-data',
        type: 'transform',
        label: 'Filter Data',
        description: 'Filter data elements',
        icon: CodeBracketIcon,
        color: 'text-green-600 bg-green-100',
      },
    ],
  },
];

type NodePanelProps = {
  onNodeSelect?: (nodeType: string, nodeData: Record<string, unknown>) => void;
};

export const NodePanel: FC<NodePanelProps> = ({ onNodeSelect }) => {
  return (
    <div className="node-panel w-64 h-full overflow-y-auto border-r border-gray-200 bg-white" data-testid="node-panel">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Node Library</h3>
        <div className="space-y-6">
          {nodeCategories.map((category) => (
            <div key={category.type} className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500">{category.title}</h4>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <DraggableNode
                    key={item.id}
                    nodeType={item.type}
                    nodeData={{
                      label: item.label,
                      description: item.description,
                      type: item.type
                    }}
                    className="node-item-wrapper"
                  >
                    <div 
                      className="node-item flex items-center p-2 rounded-md border border-gray-200 cursor-move hover:bg-gray-50 transition-colors"
                      onClick={() => onNodeSelect && onNodeSelect(item.type, {
                        label: item.label,
                        description: item.description,
                        type: item.type
                      })}
                    >
                      <div className={`node-item-icon flex h-8 w-8 items-center justify-center rounded-full ${item.color} mr-3`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="node-item-content">
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                        <div className="text-xs text-blue-500 mt-1">Drag to add to workflow</div>
                        <div className="text-xs text-green-500 mt-1">Or click to select</div>
                      </div>
                    </div>
                  </DraggableNode>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
import { WorkflowNodeData } from '../NodeTypes';

// Drag item type constants
export const ItemTypes = {
  WORKFLOW_NODE: 'workflowNode',
};

// Define the drag item interface
export interface DragItem {
  type: string;
  nodeType: string;
  data: Partial<WorkflowNodeData>;
  sourceId?: string;
}

// Position type for drag and drop
export interface Position {
  x: number;
  y: number;
}
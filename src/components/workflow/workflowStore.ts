import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import { nanoid } from 'nanoid';
import { WorkflowNodeData } from './NodeTypes';

export interface WorkflowState {
  // Basic workflow metadata
  name: string;
  description: string;
  
  // Flow elements
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  
  // History for undo/redo
  history: {
    past: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[];
    future: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[];
  };
  
  // Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  addNode: (nodeType: string, data: Partial<WorkflowNodeData>, position: { x: number, y: number }) => string;
  duplicateNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  setWorkflowDetails: (data: { name?: string; description?: string }) => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Import/Export
  exportWorkflow: () => { name: string; description: string; nodes: Node<WorkflowNodeData>[]; edges: Edge[]; version: string };
  importWorkflow: (data: { name?: string; description?: string; nodes: Node<WorkflowNodeData>[]; edges: Edge[] }) => void;
  resetWorkflow: () => void;
}

const initialState = {
  name: 'Untitled Workflow',
  description: '',
  nodes: [],
  edges: [],
  history: {
    past: [],
    future: []
  }
};

export const useWorkflowStore = create<WorkflowState>()(
  immer((set, get) => ({
    ...initialState,

    // Flow operations
    onNodesChange: (changes: NodeChange[]) => {
      set(state => {
        state.nodes = applyNodeChanges(changes, state.nodes);
      });
      get().saveToHistory();
    },

    onEdgesChange: (changes: EdgeChange[]) => {
      set(state => {
        state.edges = applyEdgeChanges(changes, state.edges);
      });
      get().saveToHistory();
    },

    onConnect: (connection: Connection) => {
      set(state => {
        state.edges = addEdge({ 
          ...connection, 
          id: `e-${nanoid()}`,
          animated: true,
          style: { stroke: '#2563eb' }
        }, state.edges);
      });
      get().saveToHistory();
    },

    updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => {
      set(state => {
        const nodeIndex = state.nodes.findIndex(node => node.id === nodeId);
        if (nodeIndex !== -1) {
          state.nodes[nodeIndex].data = {
            ...state.nodes[nodeIndex].data,
            ...data
          };
        }
      });
      get().saveToHistory();
    },

    addNode: (nodeType: string, data: Partial<WorkflowNodeData>, position: { x: number, y: number }) => {
        const nodeId = `node-${nanoid()}`;
        set(state => {
          state.nodes.push({
            id: nodeId,
            type: nodeType,
            position,
            data: {
              label: data.label || 'New Node',
              type: nodeType as 'trigger' | 'condition' | 'action' | 'transform',
              ...data
            } as WorkflowNodeData
          });
        });
      get().saveToHistory();
      return nodeId;
    },

    duplicateNode: (nodeId: string) => {
      set(state => {
        const sourceNode = state.nodes.find(node => node.id === nodeId);
        if (sourceNode) {
          const newNodeId = `node-${nanoid()}`;
          state.nodes.push({
            ...sourceNode,
            id: newNodeId,
            position: {
              x: sourceNode.position.x + 50,
              y: sourceNode.position.y + 50
            }
          });
        }
      });
      get().saveToHistory();
    },

    deleteNode: (nodeId: string) => {
      set(state => {
        state.nodes = state.nodes.filter(node => node.id !== nodeId);
        state.edges = state.edges.filter(
          edge => edge.source !== nodeId && edge.target !== nodeId
        );
      });
      get().saveToHistory();
    },

    deleteEdge: (edgeId: string) => {
      set(state => {
        state.edges = state.edges.filter(edge => edge.id !== edgeId);
      });
      get().saveToHistory();
    },

    setWorkflowDetails: (data: { name?: string; description?: string }) => {
      set(state => {
        if (data.name !== undefined) state.name = data.name;
        if (data.description !== undefined) state.description = data.description;
      });
    },

    // History management
    saveToHistory: () => {
      set(state => {
        state.history.past.push({
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          edges: JSON.parse(JSON.stringify(state.edges))
        });
        state.history.future = [];
        
        // Limit history size
        if (state.history.past.length > 30) {
          state.history.past.shift();
        }
      });
    },

    undo: () => {
      set(state => {
        const lastState = state.history.past.pop();
        if (lastState) {
          state.history.future.push({
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
          });
          state.nodes = lastState.nodes;
          state.edges = lastState.edges;
        }
      });
    },

    redo: () => {
      set(state => {
        const nextState = state.history.future.pop();
        if (nextState) {
          state.history.past.push({
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
          });
          state.nodes = nextState.nodes;
          state.edges = nextState.edges;
        }
      });
    },

    // Import/Export
    exportWorkflow: () => {
      const { name, description, nodes, edges } = get();
      return {
        name,
        description,
        nodes,
        edges,
        version: '1.0'
      };
    },

    importWorkflow: (data: { name?: string; description?: string; nodes: Node<WorkflowNodeData>[]; edges: Edge[] }) => {
      if (!data || !data.nodes || !data.edges) {
        console.error('Invalid workflow data for import');
        return;
      }
      
      set(state => {
        state.name = data.name || 'Imported Workflow';
        state.description = data.description || '';
        state.nodes = data.nodes;
        state.edges = data.edges;
        state.history = initialState.history;
      });
    },

    resetWorkflow: () => {
      set(initialState);
    }
  }))
);
import { useState, useRef, useCallback, useEffect, useMemo, type DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  type Node,
  type Edge,
  type OnConnect,
  type XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type {
  WorkflowFormData,
  WorkflowNode as WorkflowNodeType,
  WorkflowEdge as WorkflowEdgeType,
  SchemaField,
  SwitchCase
} from "@/types/workflow";


import TriggerNode from "./nodes/TriggerNode";
import type { BaseNodeData } from "../../types/NodeTypes";
import StopWorkflowNode from "./nodes/StopWorkflowNode";
import TryCatchNode from "./nodes/TryCatchNode";
import LLMCallNode from "./nodes/LLMCallNode";
import SwitchCaseNode from "./nodes/SwitchCaseNode";
import ToolCallNode from "./nodes/ToolCallNode";
import NodeEditModal from "./modals/NodeEditModal";

import { DnDProvider } from "../../contexts/DnDContext";
import { useDnD } from "@/hooks/useDnD";
import { Subheading } from "../ui/heading";

const Sidebar = () => {
  const [, setType] = useDnD();

  const onDragStart = (event: DragEvent, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex flex-col gap-4 pt-4">
      <Subheading className="text-base!">Workflow Blocks</Subheading>

      <div
        className="dndnode try-catch p-3 border border-yellow-400 rounded-md cursor-grab text-center text-sm font-medium bg-yellow-100 text-yellow-800"
        onDragStart={(event) => onDragStart(event, "try-catch")}
        draggable
      >
        Try/Catch
      </div>
      <div
        className="dndnode llm-call p-3 border border-purple-400 rounded-md cursor-grab text-center text-sm font-medium bg-purple-100 text-purple-800"
        onDragStart={(event) => onDragStart(event, "llm-call")}
        draggable
      >
        LLM Call
      </div>
      <div
        className="dndnode switch-case p-3 border border-indigo-400 rounded-md cursor-grab text-center text-sm font-medium bg-indigo-100 text-indigo-800"
        onDragStart={(event) => onDragStart(event, "switch-case")}
        draggable
      >
        Switch/Case
      </div>
      <div
        className="dndnode tool-call p-3 border border-indigo-400 rounded-md cursor-grab text-center text-sm font-medium bg-indigo-100 text-indigo-800"
        onDragStart={(event) => onDragStart(event, "tool-call")}
        draggable
      >
        Tool Call
      </div>
      <div
        className="dndnode action stop p-3 border border-red-400 rounded-md cursor-grab text-center text-sm font-medium bg-red-100 text-red-800"
        onDragStart={(event) => onDragStart(event, "stop-workflow")}
        draggable
      >
        Stop Workflow
      </div>
    </aside>
  );
};

const initialNodes: Node[] = [
  {
    type: "trigger",
    id: "dndnode_0",
    position: { x: 400, y: 100 }, // Better center position for most screens
    data: {
      label: "Workflow trigger",
      description: "",
      condition: "true"
    },
  },
];

let id = 1;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  trigger: TriggerNode,
  "stop-workflow": StopWorkflowNode,
  "try-catch": TryCatchNode,
  "llm-call": LLMCallNode,
  "switch-case": SwitchCaseNode,
  "tool-call": ToolCallNode,
};

interface WorkflowBuilderProps {
  workflowData: WorkflowFormData;
  onWorkflowDataChange: (data: WorkflowFormData) => void;
}

const DnDFlow = ({
  workflowData,
  onWorkflowDataChange,
}: WorkflowBuilderProps) => {
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  

  // Compute initial nodes and edges directly (not memoized) to ensure they update
  const computeInitialNodes = () => {
    
    if (workflowData.workflow_definition.nodes.length > 0) {
      const mappedNodes = workflowData.workflow_definition.nodes.map((node) => {
        let nodeType = 'action'; // default
        let nodeData: any = {
          label: node.data.label || '',
          description: node.data.description || '',
          enabled: node.data.enabled ?? true,
          config: node.data.config || {},
        };

        if (node.node_type.type === 'Trigger') {
          nodeType = 'trigger';
          nodeData.condition = node.node_type.condition || '';
        } else if (node.node_type.type === 'LLMCall') {
          nodeType = 'llm-call';
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === 'Switch') {
          nodeType = 'switch-case';
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === 'ToolCall') {
          nodeType = 'tool-call';
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === 'ErrorHandler') {
          nodeType = 'try-catch';
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        }

        const mappedNode = {
          id: node.id,
          type: nodeType,
          position: node.position,
          data: nodeData,
        };
        return mappedNode;
      });
      return mappedNodes;
    }
    return initialNodes;
  };

  const computeInitialEdges = () => {
    if (workflowData.workflow_definition.edges.length > 0) {
      return workflowData.workflow_definition.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.source_handle,
        targetHandle: edge.target_handle,
      }));
    }
    return [];
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(computeInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(computeInitialEdges());
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<BaseNodeData> | null>(
    null,
  );


  // Center the initial trigger node when component mounts and on window resize
  useEffect(() => {
    const centerInitialNode = () => {
      const canvasRect = reactFlowWrapper.current?.getBoundingClientRect();
      if (canvasRect && nodes.length >= 1 && nodes.find(n => n.id === "dndnode_0")) {
        // Calculate center position for the initial trigger node
        const flowCanvasWidth = canvasRect.width;

        // Simple calculation: center of the flow canvas minus node width offset
        const centerX = (flowCanvasWidth / 2) - 75; // 75px is roughly half a node width
        const topY = 100; // Fixed top position

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === "dndnode_0") {
              return {
                ...node,
                position: { x: centerX, y: topY },
              };
            }
            return node;
          })
        );
      }
    };

    // Center on mount
    const timer = setTimeout(centerInitialNode, 100);

    // Re-center on window resize
    const handleResize = () => {
      setTimeout(centerInitialNode, 50);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Only run once on mount

  // Helper function to map React Flow node to WorkflowNode
  const mapReactFlowNodeToWorkflowNode = useCallback((node: Node): WorkflowNodeType => {
    const nodeData = node.data as Record<string, unknown>;

    // Map based on node type
    if (node.type === "trigger") {
      return {
        id: node.id,
        node_type: {
          type: "Trigger",
          condition: (nodeData.condition as string) || "true",
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    } else if (node.type === "try-catch") {
      return {
        id: node.id,
        node_type: {
          type: "ErrorHandler",
          enable_retry: (nodeData.enable_retry as boolean) || false,
          max_retries: (nodeData.max_retries as number) || 3,
          retry_delay_seconds: (nodeData.retry_delay_seconds as number) || 5,
          log_errors: nodeData.log_errors !== false,
          custom_error_message: nodeData.custom_error_message as string | undefined,
          contained_nodes: (nodeData.contained_nodes as string[]) || [],
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    } else if (node.type === "llm-call") {
      return {
        id: node.id,
        node_type: {
          type: "LLMCall",
          prompt_template: (nodeData.prompt_template as string) || "",
          response_format: (nodeData.response_format as "text" | "json") || "text",
          json_schema: (nodeData.json_schema as SchemaField[]) || [],
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    } else if (node.type === "switch-case") {
      return {
        id: node.id,
        node_type: {
          type: "Switch",
          switch_condition: (nodeData.switch_condition as string) || "",
          cases: (nodeData.cases as SwitchCase[]) || [],
          default_case: nodeData.default_case !== false,
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    } else if (node.type === "tool-call") {
      return {
        id: node.id,
        node_type: {
          type: "ToolCall",
          tool_id: parseInt((nodeData.tool_id as string) || "0") || 0,
          input_parameters: (nodeData.input_parameters as Record<string, unknown>) || {},
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    } else if (node.type === "stop-workflow") {
      // Map stop-workflow to a simple ToolCall with a special identifier
      return {
        id: node.id,
        node_type: {
          type: "ToolCall",
          tool_id: -1, // Special ID to indicate stop workflow
          input_parameters: { action: "stop_workflow" },
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    } else {
      // Default fallback - treat as tool call
      return {
        id: node.id,
        node_type: {
          type: "ToolCall",
          tool_id: parseInt((nodeData.tool_id as string) || "0") || 0,
          input_parameters: (nodeData.input_parameters as Record<string, unknown>) || {},
        },
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: (nodeData.label as string) || "",
          description: (nodeData.description as string) || "",
          enabled: true,
          config: {},
        },
      };
    }
  }, []);

  // Update workflow definition when nodes/edges change
  useEffect(() => {
    // Skip the initial render when nodes are being loaded from workflowData
    if (nodes.length === 0 && edges.length === 0) return;
    
    const workflowNodes: WorkflowNodeType[] = nodes.map(mapReactFlowNodeToWorkflowNode);

    const workflowEdges: WorkflowEdgeType[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      source_handle: edge.sourceHandle || undefined,
      target_handle: edge.targetHandle || undefined,
    }));

    onWorkflowDataChange({
      ...workflowData,
      workflow_definition: {
        ...workflowData.workflow_definition,
        nodes: workflowNodes,
        edges: workflowEdges,
      },
    });
  }, [nodes, edges, onWorkflowDataChange, mapReactFlowNodeToWorkflowNode]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      console.log(sourceNode, targetNode);

      if (params.source === params.target) {
        console.warn("Cannot connect a node to itself.");
        return;
      }

      if (targetNode?.type === "trigger") {
        console.warn("A trigger node cannot be a target for an edge.");
        return;
      }



      if (sourceNode?.type === "switch-case") {
        const sourceData = sourceNode.data as Record<string, unknown>;

        let edgeLabel = "Default";
        if (params.sourceHandle?.startsWith("case-")) {
          const caseIndex = parseInt(params.sourceHandle.replace("case-", ""));
          edgeLabel = `Case ${caseIndex + 1}`;

          // Use case data if available
          const cases = (sourceData.cases as Array<{ case_label?: string; case_condition?: string }>) || [];
          if (cases[caseIndex]) {
            edgeLabel = cases[caseIndex].case_label || `Case ${caseIndex + 1}`;
          }
        }

        const outgoingEdges = edges.filter(
          (edge) => edge.source === sourceNode.id,
        );

        if (
          outgoingEdges.some(
            (edge) => edge.sourceHandle === params.sourceHandle,
          )
        ) {
          console.warn(
            `An edge already exists from handle ${params.sourceHandle} on this switch/case node.`,
          );
          return;
        }

        const edgeWithLabel = {
          ...params,
          label: edgeLabel,
          labelStyle: { fill: "#666", fontWeight: 700 },
          style: {
            stroke: params.sourceHandle === "default" ? "#6b7280" : "#3b82f6",
          },
        };

        setEdges((eds) => addEdge(edgeWithLabel, eds));
        return;
      }

      if (sourceNode?.type === "stop-workflow") {
        console.warn("Stop Workflow node cannot be a source for an edge.");
        return; // Prevent the edge from being added
      }

      if (sourceNode && sourceNode.type !== "conditional") {
        const outgoingEdges = edges.filter(
          (edge) => edge.source === sourceNode.id,
        );

        if (outgoingEdges.length > 0) {
          console.warn("This node already has an outgoing connection.");
          return;
        }
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#2563eb" },
            animated: true,
          },
          eds,
        ),
      );
    },
    [setEdges, nodes, edges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Helper function to calculate smart positioning for new nodes
  const getSmartPosition = useCallback((mousePosition: XYPosition): XYPosition => {
    // For new nodes (not the initial trigger), use mouse position
    return mousePosition;
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!type) {
        return;
      }

      // Calculate position using smart positioning
      const mousePosition = screenToFlowPosition({
        x: event.clientX - 125,
        y: event.clientY,
      });

      const position = getSmartPosition(mousePosition);

      const nodeLabel =
        type === "stop-workflow"
          ? "Stop Workflow"
          : type === "skip-step"
            ? "Skip Step"
            : type === "conditional"
              ? "Conditional Branching"
              : type === "trigger"
                ? "Workflow Trigger"
                : type === "try-catch"
                  ? "Try/Catch"
                  : type === "llm-call"
                    ? "LLM Call"
                    : type === "switch-case"
                      ? "Switch/Case"
                      : type === "tool-call"
                        ? "Tool Call"
                        : type === "store-context"
                          ? "Store Context"
                          : type === "fetch-context"
                            ? "Fetch Context"
                            : `${type} node`;

      const newNode: Node<BaseNodeData> = {
        id: getId(),
        type: type as string,
        position,
        data: {
          label: nodeLabel,
          description: "",
        },
      };

      // Set default data based on block type
      if (type === "tool-call") {
        (newNode.data as unknown as Record<string, unknown>).tool_id = "";
        (newNode.data as unknown as Record<string, unknown>).input_parameters = {};
      } else if (type === "trigger") {
        (newNode.data as unknown as Record<string, unknown>).condition = "true";
      } else if (type === "try-catch") {
        (newNode.data as unknown as Record<string, unknown>).enable_retry = false;
        (newNode.data as unknown as Record<string, unknown>).max_retries = 3;
        (newNode.data as unknown as Record<string, unknown>).retry_delay_seconds = 5;
        (newNode.data as unknown as Record<string, unknown>).log_errors = true;
        (newNode.data as unknown as Record<string, unknown>).contained_nodes = [];
        // Set larger default size for better usability
        newNode.style = { width: 500, height: 400 };
      } else if (type === "llm-call") {
        (newNode.data as unknown as Record<string, unknown>).prompt_template = "";
        (newNode.data as unknown as Record<string, unknown>).response_format = "text";
        (newNode.data as unknown as Record<string, unknown>).json_schema = "";
      } else if (type === "switch-case") {
        (newNode.data as unknown as Record<string, unknown>).switch_condition = "";
        (newNode.data as unknown as Record<string, unknown>).cases = [];
        (newNode.data as unknown as Record<string, unknown>).default_case = true;
      } else if (type === "store-context") {
        (newNode.data as unknown as Record<string, unknown>).context_data = "";
        (newNode.data as unknown as Record<string, unknown>).use_llm = false;
      } else if (type === "fetch-context") {
        (newNode.data as unknown as Record<string, unknown>).context_data = "";
        (newNode.data as unknown as Record<string, unknown>).use_llm = false;
      }

      console.log(newNode);

      setSelectedNode(newNode as Node<BaseNodeData>);
      setIsModalOpen(true);

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, setNodes, setSelectedNode, setIsModalOpen, getSmartPosition],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNode(null);
  }, []);

  const onSaveNode = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data };
          }
          return node;
        }),
      );
      closeModal();
    },
    [setNodes, closeModal],
  );

  // Manual containment detection on node drop/move (debounced to prevent infinite loops)
  const updateTryCatchContainment = useCallback(() => {
    setNodes((currentNodes) => {
      let hasChanges = false;
      const updatedNodes = currentNodes.map((node) => {
        if (node.type === "try-catch") {
          const containedNodeIds: string[] = [];

          // Check which nodes are inside this try/catch container (ONLY ONE ALLOWED)
          currentNodes.forEach((otherNode) => {
            if (otherNode.id !== node.id && otherNode.type !== "try-catch") {
              // Get the actual container dimensions (accounting for resizing)
              const containerWidth = typeof node.style?.width === 'number' ? node.style.width : 500;
              const containerHeight = typeof node.style?.height === 'number' ? node.style.height : 400;

              // Check if node is within try/catch boundaries
              const isInside = (
                otherNode.position.x >= node.position.x + 6 &&
                otherNode.position.x <= node.position.x + containerWidth - 6 &&
                otherNode.position.y >= node.position.y + 80 && // Header height
                otherNode.position.y <= node.position.y + containerHeight - 20 // Footer margin
              );

              if (isInside && containedNodeIds.length === 0) {
                // Only allow ONE protected node at a time
                containedNodeIds.push(otherNode.id);
              }
            }
          });

          const currentContainedNodes = ((node.data as Record<string, unknown>).contained_nodes as string[]) || [];
          const sortedNew = containedNodeIds.sort();
          const sortedCurrent = currentContainedNodes.sort();

          if (JSON.stringify(sortedNew) !== JSON.stringify(sortedCurrent)) {
            hasChanges = true;
            return {
              ...node,
              data: {
                ...node.data,
                contained_nodes: containedNodeIds,
              },
            };
          }
        }
        return node;
      });

      return hasChanges ? updatedNodes : currentNodes;
    });
  }, []);

  // Debounced containment update to prevent infinite loops
  useEffect(() => {
    const timeoutId = setTimeout(updateTryCatchContainment, 200);
    return () => clearTimeout(timeoutId);
  }, [nodes.map(n => `${n.id}-${Math.round(n.position.x/10)*10}-${Math.round(n.position.y/10)*10}-${n.type}`).join(','), updateTryCatchContainment]);



  return (
    <div className="flex h-[calc(100vh-200px)] w-full">
      <aside className="w-75 border-r border-gray-200 pr-4 flex flex-col gap-8 overflow-y-auto flex-shrink-0">
        <Sidebar />
      </aside>
      <div className="flex-1 h-full">
        <div className="reactflow-wrapper h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              setSelectedNode(null);
              closeModal();
              onNodesChange(changes);
            }}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            minZoom={0.2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => {
              setSelectedNode(node as Node<BaseNodeData>);
              setIsModalOpen(true);
            }}
            style={{ backgroundColor: "#F7F9FB" }}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>
        </div>
      </div>
      <NodeEditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        node={selectedNode}
        onSave={onSaveNode}
        availableNodes={nodes.filter(n => n.data && typeof n.data === 'object') as Node<BaseNodeData>[]}
      />
    </div>
  );
};

export default function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <DnDFlow {...props} />
      </DnDProvider>
    </ReactFlowProvider>
  );
}

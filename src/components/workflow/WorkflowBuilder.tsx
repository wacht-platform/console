import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
} from "react";
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
  SwitchCase,
} from "@/types/workflow";

import TriggerNode from "./nodes/TriggerNode";
import type { BaseNodeData } from "../../types/NodeTypes";
import StopWorkflowNode from "./nodes/StopWorkflowNode";
import TryCatchNode from "./nodes/TryCatchNode";
import LLMCallNode from "./nodes/LLMCallNode";
import SwitchCaseNode from "./nodes/SwitchCaseNode";
import ToolCallNode from "./nodes/ToolCallNode";
import UserInputNode from "./nodes/UserInputNode";
import NodeEditModal from "./modals/NodeEditModal";

import { DnDProvider } from "../../contexts/DnDContext";
import { useDnD } from "@/hooks/useDnD";
import { Subheading } from "../ui/heading";
import { NodeContextMenu } from "./NodeContextMenu";

const TopToolbar = () => {
  const [, setType] = useDnD();

  const onDragStart = (event: DragEvent, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const workflowBlocks = [
    {
      type: "try-catch",
      label: "Try/Catch",
      description: "Error handling",
      color:
        "border-yellow-400 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30",
    },
    {
      type: "llm-call",
      label: "LLM Call",
      description: "AI processing",
      color:
        "border-purple-400 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-500 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30",
    },
    {
      type: "switch-case",
      label: "Switch/Case",
      description: "Conditional logic",
      color:
        "border-indigo-400 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30",
    },
    {
      type: "tool-call",
      label: "Tool Call",
      description: "Execute tools",
      color:
        "border-blue-400 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30",
    },
    {
      type: "user-input",
      label: "User Input",
      description: "Get user data",
      color:
        "border-cyan-400 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:border-cyan-500 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:bg-cyan-900/30",
    },
    {
      type: "stop-workflow",
      label: "Stop Workflow",
      description: "End execution",
      color:
        "border-red-400 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-500 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30",
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <Subheading className="text-base font-medium">
          Workflow Components
        </Subheading>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Drag & Drop to Add
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {workflowBlocks.map((block) => (
          <div
            key={block.type}
            className={`dndnode ${block.type} p-2 border border-dashed rounded cursor-grab text-center transition-colors ${block.color}`}
            onDragStart={(event) => onDragStart(event, block.type)}
            draggable
          >
            <div className="font-medium text-sm mb-1">{block.label}</div>
            <div className="text-xs opacity-75">{block.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const initialNodes: Node[] = [
  {
    type: "trigger",
    id: "dndnode_0",
    position: { x: 50, y: 300 }, // 5% from left, roughly center vertically
    data: {
      label: "Workflow trigger",
      description: "",
      condition: "true",
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
  "user-input": UserInputNode,
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
        let nodeType = "action"; // default
        let nodeData: any = {
          label: node.data.label || "",
          description: node.data.description || "",
          enabled: node.data.enabled ?? true,
          config: node.data.config || {},
        };

        if (node.node_type.type === "Trigger") {
          nodeType = "trigger";
          nodeData.condition = node.node_type.condition || "";
        } else if (node.node_type.type === "LLMCall") {
          nodeType = "llm-call";
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === "Switch") {
          nodeType = "switch-case";
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === "ToolCall") {
          nodeType = "tool-call";
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === "ErrorHandler") {
          nodeType = "try-catch";
          nodeData = {
            ...nodeData,
            ...node.node_type,
          };
        } else if (node.node_type.type === "UserInput") {
          nodeType = "user-input";
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
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    computeInitialEdges(),
  );
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<BaseNodeData> | null>(
    null,
  );

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  // Position the initial trigger node at 5% from left and vertically centered
  useEffect(() => {
    const positionInitialNode = () => {
      const canvasRect = reactFlowWrapper.current?.getBoundingClientRect();
      if (
        canvasRect &&
        nodes.length >= 1 &&
        nodes.find((n) => n.id === "dndnode_0")
      ) {
        // Calculate position: 5% from left, vertically centered
        const flowCanvasWidth = canvasRect.width;
        const flowCanvasHeight = canvasRect.height;

        // 5% from the left edge
        const leftX = flowCanvasWidth * 0.05;
        // Vertically centered (accounting for node height ~50px)
        const centerY = (flowCanvasHeight / 2) - 25;

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === "dndnode_0") {
              return {
                ...node,
                position: { x: leftX, y: centerY },
              };
            }
            return node;
          }),
        );
      }
    };

    // Position on mount
    const timer = setTimeout(positionInitialNode, 100);

    // Re-position on window resize
    const handleResize = () => {
      setTimeout(positionInitialNode, 50);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Only run once on mount

  // Helper function to map React Flow node to WorkflowNode
  const mapReactFlowNodeToWorkflowNode = useCallback(
    (node: Node): WorkflowNodeType => {
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
            custom_error_message: nodeData.custom_error_message as
              | string
              | undefined,
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
            response_format:
              (nodeData.response_format as "text" | "json") || "text",
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
            input_parameters:
              (nodeData.input_parameters as Record<string, unknown>) || {},
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
      } else if (node.type === "user-input") {
        return {
          id: node.id,
          node_type: {
            type: "UserInput",
            prompt: (nodeData.prompt as string) || "",
            input_type:
              (nodeData.input_type as
                | "text"
                | "number"
                | "select"
                | "multiselect"
                | "boolean"
                | "date") || "text",
            default_value: nodeData.default_value as string | undefined,
            placeholder: nodeData.placeholder as string | undefined,
            options: (nodeData.options as string[]) || undefined,
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
            input_parameters:
              (nodeData.input_parameters as Record<string, unknown>) || {},
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
    },
    [],
  );

  // Update workflow definition when nodes/edges change
  useEffect(() => {
    // Skip the initial render when nodes are being loaded from workflowData
    if (nodes.length === 0 && edges.length === 0) return;

    const workflowNodes: WorkflowNodeType[] = nodes.map(
      mapReactFlowNodeToWorkflowNode,
    );

    const workflowEdges: WorkflowEdgeType[] = edges.map((edge) => ({
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
          const cases =
            (sourceData.cases as Array<{
              case_label?: string;
              case_condition?: string;
            }>) || [];
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
  const getSmartPosition = useCallback(
    (mousePosition: XYPosition): XYPosition => {
      // For new nodes (not the initial trigger), use mouse position
      return mousePosition;
    },
    [],
  );

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
        (newNode.data as unknown as Record<string, unknown>).input_parameters =
          {};
      } else if (type === "trigger") {
        (newNode.data as unknown as Record<string, unknown>).condition = "true";
      } else if (type === "try-catch") {
        (newNode.data as unknown as Record<string, unknown>).enable_retry =
          false;
        (newNode.data as unknown as Record<string, unknown>).max_retries = 3;
        (
          newNode.data as unknown as Record<string, unknown>
        ).retry_delay_seconds = 5;
        (newNode.data as unknown as Record<string, unknown>).log_errors = true;
        (newNode.data as unknown as Record<string, unknown>).contained_nodes =
          [];
        // Set larger default size for better usability
        newNode.style = { width: 500, height: 400 };
      } else if (type === "llm-call") {
        (newNode.data as unknown as Record<string, unknown>).prompt_template =
          "";
        (newNode.data as unknown as Record<string, unknown>).response_format =
          "text";
        (newNode.data as unknown as Record<string, unknown>).json_schema = "";
      } else if (type === "switch-case") {
        (newNode.data as unknown as Record<string, unknown>).switch_condition =
          "";
        (newNode.data as unknown as Record<string, unknown>).cases = [];
        (newNode.data as unknown as Record<string, unknown>).default_case =
          true;
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
    [
      screenToFlowPosition,
      type,
      setNodes,
      setSelectedNode,
      setIsModalOpen,
      getSmartPosition,
    ],
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

  // Context menu handlers
  const handleEditNode = useCallback(() => {
    if (contextMenu.nodeId) {
      const node = nodes.find((n) => n.id === contextMenu.nodeId);
      if (node) {
        setSelectedNode(node as Node<BaseNodeData>);
        setIsModalOpen(true);
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, [contextMenu.nodeId, nodes]);

  const handleDeleteNode = useCallback(() => {
    if (contextMenu.nodeId) {
      setNodes((nds) => nds.filter((node) => node.id !== contextMenu.nodeId));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== contextMenu.nodeId &&
            edge.target !== contextMenu.nodeId,
        ),
      );
    }
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, [contextMenu.nodeId, setNodes, setEdges]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, []);

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
              const containerWidth =
                typeof node.style?.width === "number" ? node.style.width : 500;
              const containerHeight =
                typeof node.style?.height === "number"
                  ? node.style.height
                  : 400;

              // Check if node is within try/catch boundaries
              const isInside =
                otherNode.position.x >= node.position.x + 6 &&
                otherNode.position.x <= node.position.x + containerWidth - 6 &&
                otherNode.position.y >= node.position.y + 80 && // Header height
                otherNode.position.y <= node.position.y + containerHeight - 20; // Footer margin

              if (isInside && containedNodeIds.length === 0) {
                // Only allow ONE protected node at a time
                containedNodeIds.push(otherNode.id);
              }
            }
          });

          const currentContainedNodes =
            ((node.data as Record<string, unknown>)
              .contained_nodes as string[]) || [];
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
  }, [
    nodes
      .map(
        (n) =>
          `${n.id}-${Math.round(n.position.x / 10) * 10}-${Math.round(n.position.y / 10) * 10}-${n.type}`,
      )
      .join(","),
    updateTryCatchContainment,
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full">
      <TopToolbar />

      <div className="flex-1 bg-gray-50 dark:bg-zinc-900">
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
            minZoom={0.3}
            maxZoom={1}
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={() => {
              // Prevent context menu from opening on regular click
              setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
            }}
            onNodeDoubleClick={(event, node) => {
              // Open settings modal on double click
              event.preventDefault();
              setSelectedNode(node as Node<BaseNodeData>);
              setIsModalOpen(true);
              // Also close any open context menu
              setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
            }}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();
              setContextMenu({
                visible: true,
                x: event.clientX,
                y: event.clientY,
                nodeId: node.id,
              });
            }}
            style={{ backgroundColor: "transparent" }}
            proOptions={{ hideAttribution: true }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background
              className="dark:opacity-30"
              color="#e2e8f0"
              gap={20}
              size={1}
            />
          </ReactFlow>
        </div>
      </div>

      <NodeEditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        node={selectedNode}
        onSave={onSaveNode}
        availableNodes={
          nodes.filter(
            (n) => n.data && typeof n.data === "object",
          ) as Node<BaseNodeData>[]
        }
      />

      <NodeContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onEdit={handleEditNode}
        onDelete={handleDeleteNode}
        onClose={handleCloseContextMenu}
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

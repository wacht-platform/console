import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";
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
import { Field, FieldGroup, Fieldset, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import type {
  WorkflowFormData,
  WorkflowNode as WorkflowNodeType,
  WorkflowEdge as WorkflowEdgeType
} from "@/types/workflow";
import { useCreateWorkflow, useUpdateWorkflow } from "@/lib/api/hooks/use-workflows";

import TriggerNode from "./nodes/TriggerNode";
import SearchKnowledgebaseNode from "./nodes/SearchKnowledgebaseNode";
import ApiCallNode from "./nodes/ApiCallNode";
import type { BaseNodeData } from "../../types/NodeTypes";
import StopWorkflowNode from "./nodes/StopWorkflowNode";
import ConditionalNode from "./nodes/ConditionalNode";
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
    <aside className="flex flex-col gap-4">
      <Subheading className="text-base!">Workflow Blocks</Subheading>

      <div
        className="dndnode conditional p-3 border border-amber-400 rounded-md cursor-grab text-center text-sm font-medium bg-amber-100 text-amber-800"
        onDragStart={(event) => onDragStart(event, "conditional")}
        draggable
      >
        Conditional Branching
      </div>
      <div
        className="dndnode action rest-api p-3 border border-orange-400 rounded-md cursor-grab text-center text-sm font-medium bg-orange-100 text-orange-800"
        onDragStart={(event) => onDragStart(event, "rest-api")}
        draggable
      >
        Rest API
      </div>
      <div
        className="dndnode action search-kb p-3 border border-green-400 rounded-md cursor-grab text-center text-sm font-medium bg-green-100 text-green-800"
        onDragStart={(event) => onDragStart(event, "search-knowledgebase")}
        draggable
      >
        Search Knowledgebase
      </div>
      <div
        className="dndnode trigger-new p-3 border border-indigo-400 rounded-md cursor-grab text-center text-sm font-medium bg-indigo-100 text-indigo-800"
        onDragStart={(event) => onDragStart(event, "trigger-new-workflow")}
        draggable
      >
        Trigger New Workflow
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
    position: { x: 200, y: 50 },
    data: { label: "Workflow trigger", description: "" },
  },
];

let id = 1;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  trigger: TriggerNode,
  "search-knowledgebase": SearchKnowledgebaseNode,
  "rest-api": ApiCallNode,
  "stop-workflow": StopWorkflowNode,
  conditional: ConditionalNode,
  "trigger-new-workflow": TriggerNode,
};

interface WorkflowBuilderProps {
  workflowId?: string;
  initialWorkflow?: WorkflowFormData;
  onSave?: (workflow: WorkflowFormData) => void;
}

const DnDFlow = ({ workflowId, initialWorkflow, onSave }: WorkflowBuilderProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<BaseNodeData> | null>(
    null,
  );

  // Workflow form state
  const [workflowData, setWorkflowData] = useState<WorkflowFormData>({
    name: initialWorkflow?.name || "Untitled Workflow",
    description: initialWorkflow?.description || "",
    configuration: initialWorkflow?.configuration || {
      timeout_seconds: 300,
      max_retries: 3,
      retry_delay_seconds: 5,
      enable_logging: true,
      enable_metrics: true,
      variables: {},
    },
    workflow_definition: initialWorkflow?.workflow_definition || {
      nodes: [],
      edges: [],
      version: "1.0.0",
    },
  });

  // API hooks
  const createWorkflowMutation = useCreateWorkflow();
  const updateWorkflowMutation = useUpdateWorkflow();

  // Update workflow definition when nodes/edges change
  useEffect(() => {
    const workflowNodes: WorkflowNodeType[] = nodes.map(node => ({
      id: node.id,
      node_type: { type: "Trigger", config: { trigger_type: "manual" } } as any, // TODO: Map properly
      position: { x: node.position.x, y: node.position.y },
      data: {
        label: (node.data.label as string) || "",
        description: (node.data.description as string) || "",
        enabled: true,
        config: (node.data.config as Record<string, unknown>) || {},
      },
    }));

    const workflowEdges: WorkflowEdgeType[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      source_handle: edge.sourceHandle || undefined,
      target_handle: edge.targetHandle || undefined,
    }));

    setWorkflowData(prev => ({
      ...prev,
      workflow_definition: {
        ...prev.workflow_definition,
        nodes: workflowNodes,
        edges: workflowEdges,
      },
    }));
  }, [nodes, edges]);

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

      if (sourceNode?.type === "conditional") {
        const edgeLabel = params.sourceHandle === "true" ? "True" : "False";

        if (targetNode?.type === "conditional") {
          console.warn(
            "Conditional node cannot connect directly to another conditional node.",
          );
          return;
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
            `An edge already exists from handle ${params.sourceHandle} on this conditional node.`,
          );
          return;
        }

        const edgeWithLabel = {
          ...params,
          label: edgeLabel,
          labelStyle: { fill: "#666", fontWeight: 700 },
          style: {
            stroke: params.sourceHandle === "true" ? "#10b981" : "#ef4444",
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

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!type) {
        return;
      }

      const position: XYPosition = screenToFlowPosition({
        x: event.clientX - 125,
        y: event.clientY,
      });

      const nodeLabel =
        type === "search-knowledgebase"
          ? "Search Knowledgebase"
          : type === "rest-api"
            ? "Rest API"
            : type === "stop-workflow"
              ? "Stop Workflow"
              : type === "skip-step"
                ? "Skip Step"
                : type === "conditional"
                  ? "Conditional Branching"
                  : type === "trigger"
                    ? "Workflow Trigger"
                    : type === "trigger-new-workflow"
                      ? "Trigger New Workflow"
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

      if (type === "trigger-new-workflow") {
        (newNode.data as unknown as Record<string, unknown>).outputNode = true;
      }

      console.log(newNode);

      setSelectedNode(newNode as Node<BaseNodeData>);
      setIsModalOpen(true);

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, setNodes, setSelectedNode, setIsModalOpen],
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

  const handleSaveWorkflow = useCallback(async () => {
    try {
      if (workflowId) {
        await updateWorkflowMutation.mutateAsync({
          workflowId,
          workflow: {
            name: workflowData.name,
            description: workflowData.description,
            configuration: workflowData.configuration,
            workflow_definition: workflowData.workflow_definition,
          },
        });
      } else {
        await createWorkflowMutation.mutateAsync({
          name: workflowData.name,
          description: workflowData.description,
          configuration: workflowData.configuration,
          workflow_definition: workflowData.workflow_definition,
        });
      }

      if (onSave) {
        onSave(workflowData);
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
    }
  }, [workflowId, workflowData, updateWorkflowMutation, createWorkflowMutation, onSave]);

  return (
    <div className="flex h-[calc(100vh-200px)] w-full">
      <aside className="w-75 border-r border-gray-200 pr-4 flex flex-col gap-8 overflow-y-auto flex-shrink-0">
        <Fieldset className="[&>*+[data-slot=control]]:mt-4!">
          <FieldGroup>
            <Field>
              <Label>Name</Label>
              <Input
                name="name"
                value={workflowData.name}
                onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <Label>Description</Label>
              <Textarea
                name="description"
                value={workflowData.description}
                onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveWorkflow}
                disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
              >
                {createWorkflowMutation.isPending || updateWorkflowMutation.isPending
                  ? "Saving..."
                  : workflowId ? "Update Workflow" : "Save Workflow"
                }
              </Button>
            </div>
          </FieldGroup>
        </Fieldset>

        <Divider />

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

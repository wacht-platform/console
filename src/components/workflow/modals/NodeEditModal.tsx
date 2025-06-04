import React, { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";

import type { BaseNodeData } from "../../../types/NodeTypes";
import type {
  ActionType,
  ApiActionConfig,
  KnowledgeBaseActionConfig,
  TriggerWorkflowActionConfig,
  TriggerType
} from "../../../types/workflow";
import { useWorkflows } from "../../../lib/api/hooks/use-workflows";

import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";


interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<BaseNodeData> | null;
  onSave: (nodeId: string, data: Record<string, unknown>) => void;
}

interface NodeFormData {
  label: string;
  description?: string;
  node_type: "trigger" | "action" | "condition" | "transform";
  // Trigger node fields
  trigger_type?: TriggerType;
  scheduled_at?: string;
  // Action node fields
  action_type?: ActionType;
  api_config?: ApiActionConfig;
  knowledge_base_config?: KnowledgeBaseActionConfig;
  trigger_workflow_config?: TriggerWorkflowActionConfig;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
}) => {
  const { data } = useWorkflows();
  const workflows = data?.workflows || [];

  // Initialize formData with node data or defaults
  const [formData, setFormData] = useState<NodeFormData>({
    label: "",
    description: "",
    node_type: "action",
    action_type: "api_call",
    api_config: {
      endpoint: "",
      method: "GET",
      headers: {},
      body: "",
      timeout_seconds: 30,
    },
  });

  // Update formData when the selected node changes
  useEffect(() => {
    if (node?.data) {
      // Determine node type from the node type or data
      let nodeType: "trigger" | "action" | "condition" | "transform" = "action";
      if (node.type?.includes("trigger")) {
        nodeType = "trigger";
      } else if (node.type?.includes("conditional")) {
        nodeType = "condition";
      } else if (node.type?.includes("transform")) {
        nodeType = "transform";
      }

      setFormData({
        label: (node.data.label as string) || "",
        description: (node.data.description as string) || "",
        node_type: nodeType,
        trigger_type: node.data.trigger_type as TriggerType,
        scheduled_at: node.data.scheduled_at as string,
        action_type: node.data.action_type as ActionType,
        api_config: node.data.api_config as ApiActionConfig,
        knowledge_base_config: node.data.knowledge_base_config as KnowledgeBaseActionConfig,
        trigger_workflow_config: node.data.trigger_workflow_config as TriggerWorkflowActionConfig,
      });
    }
  }, [node]);

  // Don't render the modal if it's not open or no node is selected
  if (!isOpen || !node) {
    return null;
  }

  // Handle action type change
  const handleActionTypeChange = (actionType: ActionType) => {
    const newFormData: NodeFormData = {
      ...formData,
      action_type: actionType,
    };

    // Reset configs when changing action type
    if (actionType === "api_call") {
      newFormData.api_config = {
        endpoint: "",
        method: "GET",
        headers: {},
        body: "",
        timeout_seconds: 30,
      };
      newFormData.knowledge_base_config = undefined;
      newFormData.trigger_workflow_config = undefined;
    } else if (actionType === "knowledge_base_search") {
      newFormData.knowledge_base_config = {
        knowledge_base_id: "",
        query: "",
        max_results: 10,
        similarity_threshold: 0.7,
      };
      newFormData.api_config = undefined;
      newFormData.trigger_workflow_config = undefined;
    } else if (actionType === "trigger_workflow") {
      newFormData.trigger_workflow_config = {
        target_workflow_id: "",
        input_mapping: {},
        wait_for_completion: true,
        timeout_seconds: 300,
      };
      newFormData.api_config = undefined;
      newFormData.knowledge_base_config = undefined;
    }

    setFormData(newFormData);
  };

  // Handle trigger type change
  const handleTriggerTypeChange = (triggerType: TriggerType) => {
    setFormData({
      ...formData,
      trigger_type: triggerType,
      scheduled_at: triggerType === "scheduled" ? "" : undefined,
    });
  };

  // Handle save action
  const handleSave = () => {
    onSave(node!.id, formData as unknown as Record<string, unknown>);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        Edit {formData.node_type === "trigger" ? "Trigger" : formData.node_type === "action" ? "Action" : "Node"}
      </DialogTitle>
      <DialogBody>
        <div className="space-y-4">
          {/* Basic node information */}
          <Field>
            <Label htmlFor="label">Node Label:</Label>
            <Input
              id="label"
              name="label"
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Enter node label"
            />
          </Field>

          <Field>
            <Label htmlFor="description">Description:</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter node description"
              className="h-20"
            />
          </Field>

          {/* Trigger Node Configuration */}
          {formData.node_type === "trigger" && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Trigger Configuration</h4>
              <Field>
                <Label htmlFor="trigger_type">Trigger Type:</Label>
                <Select
                  id="trigger_type"
                  name="trigger_type"
                  value={formData.trigger_type || "manual"}
                  onChange={(e) => handleTriggerTypeChange(e.target.value as TriggerType)}
                >
                  <option value="manual">Manual</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="webhook">Webhook</option>
                  <option value="event">Event</option>
                  <option value="api_call">API Call</option>
                </Select>
              </Field>

              {/* Scheduled trigger configuration */}
              {formData.trigger_type === "scheduled" && (
                <Field>
                  <Label htmlFor="scheduled_at">Schedule Date & Time:</Label>
                  <Input
                    id="scheduled_at"
                    name="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at || ""}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                  />
                </Field>
              )}
            </div>
          )}

          {/* Action Node Configuration */}
          {formData.node_type === "action" && (
            <>
              <Field>
                <Label htmlFor="action_type">Action Type:</Label>
                <Select
                  id="action_type"
                  name="action_type"
                  value={formData.action_type || "api_call"}
                  onChange={(e) => handleActionTypeChange(e.target.value as ActionType)}
                >
                  <option value="api_call">API Call</option>
                  <option value="knowledge_base_search">Knowledge Base Search</option>
                  <option value="trigger_workflow">Trigger Workflow</option>
                </Select>
              </Field>
            </>
          )}

          {/* API Call Configuration */}
          {formData.node_type === "action" && formData.action_type === "api_call" && formData.api_config && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">API Configuration</h4>
              <Field>
                <Label htmlFor="endpoint">API Endpoint:</Label>
                <Input
                  id="endpoint"
                  name="endpoint"
                  type="text"
                  value={formData.api_config.endpoint}
                  onChange={(e) => setFormData({
                    ...formData,
                    api_config: { ...formData.api_config!, endpoint: e.target.value }
                  })}
                  placeholder="https://api.example.com/endpoint"
                />
              </Field>
              <Field>
                <Label htmlFor="method">HTTP Method:</Label>
                <Select
                  id="method"
                  name="method"
                  value={formData.api_config.method}
                  onChange={(e) => setFormData({
                    ...formData,
                    api_config: { ...formData.api_config!, method: e.target.value }
                  })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="body">Request Body:</Label>
                <Textarea
                  id="body"
                  name="body"
                  value={formData.api_config.body || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    api_config: { ...formData.api_config!, body: e.target.value }
                  })}
                  placeholder="Request body (JSON)"
                  className="h-20 font-mono text-sm"
                />
              </Field>
            </div>
          )}

          {/* Knowledge Base Search Configuration */}
          {formData.node_type === "action" && formData.action_type === "knowledge_base_search" && formData.knowledge_base_config && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Knowledge Base Configuration</h4>
              <Field>
                <Label htmlFor="knowledge_base_id">Knowledge Base ID:</Label>
                <Input
                  id="knowledge_base_id"
                  name="knowledge_base_id"
                  type="text"
                  value={formData.knowledge_base_config.knowledge_base_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    knowledge_base_config: { ...formData.knowledge_base_config!, knowledge_base_id: e.target.value }
                  })}
                  placeholder="Enter knowledge base ID"
                />
              </Field>
              <Field>
                <Label htmlFor="query">Search Query:</Label>
                <Input
                  id="query"
                  name="query"
                  type="text"
                  value={formData.knowledge_base_config.query}
                  onChange={(e) => setFormData({
                    ...formData,
                    knowledge_base_config: { ...formData.knowledge_base_config!, query: e.target.value }
                  })}
                  placeholder="Enter search query"
                />
              </Field>
              <Field>
                <Label htmlFor="max_results">Max Results:</Label>
                <Input
                  id="max_results"
                  name="max_results"
                  type="number"
                  value={formData.knowledge_base_config.max_results || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    knowledge_base_config: {
                      ...formData.knowledge_base_config!,
                      max_results: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="10"
                />
              </Field>
            </div>
          )}

          {/* Trigger Workflow Configuration */}
          {formData.node_type === "action" && formData.action_type === "trigger_workflow" && formData.trigger_workflow_config && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Trigger Workflow Configuration</h4>
              <Field>
                <Label htmlFor="target_workflow_id">Target Workflow:</Label>
                <Select
                  id="target_workflow_id"
                  name="target_workflow_id"
                  value={formData.trigger_workflow_config.target_workflow_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_workflow_config: { ...formData.trigger_workflow_config!, target_workflow_id: e.target.value }
                  })}
                >
                  <option value="">Select a workflow</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.trigger_workflow_config.wait_for_completion}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_workflow_config: { ...formData.trigger_workflow_config!, wait_for_completion: e.target.checked }
                    })}
                  />
                  <span>Wait for completion</span>
                </label>
              </Field>
              {formData.trigger_workflow_config.wait_for_completion && (
                <Field>
                  <Label htmlFor="timeout_seconds">Timeout (seconds):</Label>
                  <Input
                    id="timeout_seconds"
                    name="timeout_seconds"
                    type="number"
                    value={formData.trigger_workflow_config.timeout_seconds || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_workflow_config: {
                        ...formData.trigger_workflow_config!,
                        timeout_seconds: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                    placeholder="300"
                  />
                </Field>
              )}
            </div>
          )}
        </div>
      </DialogBody>

      <DialogActions>
        <Button onClick={handleSave}>Save</Button>
        <Button plain onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NodeEditModal;

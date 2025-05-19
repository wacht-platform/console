import React, { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";

import type { BaseNodeData } from "../../../types/NodeTypes";

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
import { Text } from "@/components/ui/text";

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<BaseNodeData> | null;
  onSave: (nodeId: string, data: Record<string, unknown>) => void;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
}) => {
  // Initialize formData with node data or a default object with label
  const [formData, setFormData] = useState<BaseNodeData>(
    node?.data || { label: "" },
  );

  // Update formData when the selected node changes
  useEffect(() => {
    setFormData(node?.data || { label: "" });
  }, [node]);

  // Don't render the modal if it's not open or no node is selected
  if (!isOpen || !node) {
    return null;
  }

  // Handle input changes and update formData
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle save action
  const handleSave = () => {
    onSave(node!.id, formData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Edit Node: {node.data.label}</DialogTitle>
      <DialogBody>
        <div>
          {(node.type === "trigger" ||
            node.type === "trigger-new-workflow") && (
            <Field>
              <Label htmlFor="triggerPhrase">Trigger Phrase:</Label>
              <Input
                id="triggerPhrase"
                name="triggerPhrase"
                type="text"
                value={(formData.triggerPhrase as string) || ""}
                onChange={handleInputChange}
                placeholder="Enter the phrase that will trigger this workflow"
              />
            </Field>
          )}

          {/* Conditional node specific fields */}
          {node.type === "conditional" && (
            <Field>
              <Label htmlFor="condition">Condition:</Label>
              <Textarea
                id="condition"
                name="condition"
                value={(formData.condition as string) || ""}
                onChange={handleInputChange}
                placeholder="Enter the condition for branching (e.g., 'user.isAuthenticated === true')"
                className="h-20"
              />
            </Field>
          )}
          {/* Search Knowledgebase node specific fields */}
          {node.type === "search-knowledgebase" && (
            <div className="space-y-4">
              <Field>
                <Label htmlFor="query">Query:</Label>
                <Input
                  id="query"
                  name="query"
                  type="text"
                  value={(formData.query as string) || ""}
                  onChange={handleInputChange}
                  placeholder="Enter the search query"
                />
              </Field>
              <Field>
                <Label htmlFor="knowledgebaseId">Knowledge Base ID:</Label>
                <Input
                  id="knowledgebaseId"
                  name="knowledgebaseId"
                  type="text"
                  value={(formData.knowledgebaseId as string) || ""}
                  onChange={handleInputChange}
                  placeholder="Enter the knowledge base identifier"
                />
              </Field>
            </div>
          )}

          {/* Rest API node specific fields */}
          {node.type === "rest-api" && (
            <div className="space-y-4">
              <Field>
                <Label htmlFor="endpoint">API Endpoint:</Label>
                <Input
                  id="endpoint"
                  name="endpoint"
                  type="text"
                  value={(formData.endpoint as string) || ""}
                  onChange={handleInputChange}
                  placeholder="Enter the API endpoint URL"
                />
              </Field>
              <Field>
                <Label htmlFor="method">HTTP Method:</Label>
                <Select
                  id="method"
                  name="method"
                  value={(formData.method as string) || "GET"}
                  onChange={handleInputChange}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="requestBody">Request Body (JSON):</Label>
                <Textarea
                  id="requestBody"
                  name="requestBody"
                  value={(formData.requestBody as string) || ""}
                  onChange={handleInputChange}
                  placeholder="Enter the request body in JSON format"
                  className="h-20 font-mono text-sm"
                />
              </Field>
            </div>
          )}
          {node.type === "rest-api" && (
            <div>
              <Field>
                <Label htmlFor="url">URL:</Label>
                {/* Access formData properties safely with type assertion or optional chaining */}
                <Input
                  id="url"
                  name="url"
                  type="text"
                  value={(formData.url as string) || ""}
                  onChange={handleInputChange}
                />
              </Field>
              <Field>
                <Label htmlFor="method">Method:</Label>
                {/* Access formData properties safely with type assertion or optional chaining */}
                <Select
                  id="method"
                  name="method"
                  value={(formData.method as string) || "GET"}
                  onChange={handleInputChange}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </Select>
              </Field>
              {/* Headers and Body inputs would be more complex, adding simple textareas for now */}
              <Field>
                <Label htmlFor="headers">Headers (JSON):</Label>
                {/* Access formData properties safely with type assertion or optional chaining */}
                <Textarea
                  id="headers"
                  name="headers"
                  value={(formData.headers as string) || ""}
                  onChange={handleInputChange}
                />
              </Field>
              <Field>
                <Label htmlFor="body">Body:</Label>
                {/* Access formData properties safely with type assertion or optional chaining */}
                <Textarea
                  id="body"
                  name="body"
                  value={(formData.body as string) || ""}
                  onChange={handleInputChange}
                />
              </Field>
            </div>
          )}

          {(node.type === "stop-workflow" || node.type === "skip-step") && (
            <Text>This node does not require parameters.</Text>
          )}
          {/* Default node or other types not explicitly handled */}
          {![
            "trigger",
            "search-knowledgebase",
            "rest-api",
            "conditional",
            "stop-workflow",
            "skip-step",
          ].includes(node.type!) && (
            <Text>No specific parameters for this node type.</Text>
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

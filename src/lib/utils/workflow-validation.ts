import type { WorkflowFormData, WorkflowNode, WorkflowEdge, WorkflowConfiguration } from "@/types/workflow";

export interface ValidationError {
  field: string;
  message: string;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation constants
const WORKFLOW_NAME_MIN_LENGTH = 1;
const WORKFLOW_NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MIN_TIMEOUT_SECONDS = 1;
const MAX_TIMEOUT_SECONDS = 3600; // 1 hour
const MIN_RETRIES = 0;
const MAX_RETRIES = 10;
const MIN_RETRY_DELAY = 1;
const MAX_RETRY_DELAY = 300; // 5 minutes

/**
 * Validates workflow basic information (name, description)
 */
export function validateWorkflowBasics(data: WorkflowFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name || !data.name.trim()) {
    errors.push({
      field: "name",
      message: "Workflow name is required"
    });
  } else if (data.name.trim().length < WORKFLOW_NAME_MIN_LENGTH) {
    errors.push({
      field: "name",
      message: `Workflow name must be at least ${WORKFLOW_NAME_MIN_LENGTH} character long`
    });
  } else if (data.name.trim().length > WORKFLOW_NAME_MAX_LENGTH) {
    errors.push({
      field: "name",
      message: `Workflow name must be no more than ${WORKFLOW_NAME_MAX_LENGTH} characters long`
    });
  }

  // Validate description (optional but has max length)
  if (data.description && data.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: "description",
      message: `Description must be no more than ${DESCRIPTION_MAX_LENGTH} characters long`
    });
  }

  return errors;
}

/**
 * Validates workflow configuration settings
 */
export function validateWorkflowConfiguration(config: WorkflowConfiguration): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate timeout_seconds
  if (config.timeout_seconds !== undefined) {
    if (config.timeout_seconds < MIN_TIMEOUT_SECONDS) {
      errors.push({
        field: "configuration.timeout_seconds",
        message: `Timeout must be at least ${MIN_TIMEOUT_SECONDS} second`
      });
    } else if (config.timeout_seconds > MAX_TIMEOUT_SECONDS) {
      errors.push({
        field: "configuration.timeout_seconds",
        message: `Timeout must be no more than ${MAX_TIMEOUT_SECONDS} seconds (1 hour)`
      });
    }
  }

  // Validate max_retries
  if (config.max_retries !== undefined) {
    if (config.max_retries < MIN_RETRIES) {
      errors.push({
        field: "configuration.max_retries",
        message: `Max retries must be at least ${MIN_RETRIES}`
      });
    } else if (config.max_retries > MAX_RETRIES) {
      errors.push({
        field: "configuration.max_retries",
        message: `Max retries must be no more than ${MAX_RETRIES}`
      });
    }
  }

  // Validate retry_delay_seconds
  if (config.retry_delay_seconds !== undefined) {
    if (config.retry_delay_seconds < MIN_RETRY_DELAY) {
      errors.push({
        field: "configuration.retry_delay_seconds",
        message: `Retry delay must be at least ${MIN_RETRY_DELAY} second`
      });
    } else if (config.retry_delay_seconds > MAX_RETRY_DELAY) {
      errors.push({
        field: "configuration.retry_delay_seconds",
        message: `Retry delay must be no more than ${MAX_RETRY_DELAY} seconds (5 minutes)`
      });
    }
  }

  // Validate variables
  if (config.variables) {
    Object.entries(config.variables).forEach(([varName, variable]) => {
      if (!varName.trim()) {
        errors.push({
          field: `configuration.variables.${varName}`,
          message: "Variable name cannot be empty"
        });
      }

      if (!variable.name || !variable.name.trim()) {
        errors.push({
          field: `configuration.variables.${varName}.name`,
          message: "Variable name is required"
        });
      }

      if (!variable.value_type) {
        errors.push({
          field: `configuration.variables.${varName}.value_type`,
          message: "Variable type is required"
        });
      }

      // Validate default value based on type
      if (variable.default_value !== undefined && variable.default_value !== null) {
        const isValidDefault = validateVariableDefaultValue(variable.default_value, variable.value_type);
        if (!isValidDefault) {
          errors.push({
            field: `configuration.variables.${varName}.default_value`,
            message: `Default value must match the variable type (${variable.value_type})`
          });
        }
      }
    });
  }

  return errors;
}

/**
 * Validates variable default value against its type
 */
function validateVariableDefaultValue(value: string, type: string): boolean {
  switch (type) {
    case "number":
      return !isNaN(Number(value));
    case "boolean":
      return value === "true" || value === "false";
    case "object":
    case "array":
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    case "string":
    default:
      return true; // Strings are always valid
  }
}

/**
 * Validates workflow definition (nodes and edges)
 */
export function validateWorkflowDefinition(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if workflow has at least one node
  if (!nodes || nodes.length === 0) {
    errors.push({
      field: "workflow_definition.nodes",
      message: "Workflow must have at least one node"
    });
    return errors; // Return early if no nodes
  }

  // Check for trigger node
  const triggerNodes = nodes.filter(node =>
    node.node_type.type === "Trigger" ||
    (node.data.config && typeof node.data.config === 'object' && 'trigger_type' in node.data.config)
  );

  if (triggerNodes.length === 0) {
    errors.push({
      field: "workflow_definition.nodes",
      message: "Workflow must have at least one trigger node"
    });
  } else if (triggerNodes.length > 1) {
    errors.push({
      field: "workflow_definition.nodes",
      message: "Workflow can only have one trigger node"
    });
  }

  // Validate individual nodes
  nodes.forEach((node, index) => {
    const nodeErrors = validateWorkflowNode(node, index);
    errors.push(...nodeErrors);
  });

  // Validate edges
  edges.forEach((edge, index) => {
    const edgeErrors = validateWorkflowEdge(edge, nodes, index);
    errors.push(...edgeErrors);
  });

  // Check for disconnected nodes (except trigger)
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const disconnectedNodes = nodes.filter(node =>
    !connectedNodeIds.has(node.id) &&
    node.node_type.type !== "Trigger" &&
    !(node.data.config && typeof node.data.config === 'object' && 'trigger_type' in node.data.config)
  );

  if (disconnectedNodes.length > 0) {
    disconnectedNodes.forEach(node => {
      errors.push({
        field: `workflow_definition.nodes.${node.id}`,
        message: `Node "${node.data.label}" is not connected to the workflow`
      });
    });
  }

  return errors;
}

/**
 * Validates individual workflow node
 */
function validateWorkflowNode(node: WorkflowNode, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate node ID
  if (!node.id || !node.id.trim()) {
    errors.push({
      field: `workflow_definition.nodes[${index}].id`,
      message: "Node ID is required"
    });
  }

  // Validate node label
  if (!node.data.label || !node.data.label.trim()) {
    errors.push({
      field: `workflow_definition.nodes[${index}].label`,
      message: "Node label is required"
    });
  }

  // Validate node position
  if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    errors.push({
      field: `workflow_definition.nodes[${index}].position`,
      message: "Node position must have valid x and y coordinates"
    });
  }

  // Validate node type specific requirements
  if (node.node_type.type === "Trigger") {
    const triggerErrors = validateTriggerNode(node, index);
    errors.push(...triggerErrors);
  } else if (node.node_type.type === "Action") {
    const actionErrors = validateActionNode(node, index);
    errors.push(...actionErrors);
  }

  return errors;
}

/**
 * Validates trigger node specific requirements
 */
function validateTriggerNode(node: WorkflowNode, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (node.node_type.type === "Trigger") {
    const config = node.node_type.config;

    // Validate webhook trigger
    if (config.webhook_config) {
      if (!config.webhook_config.endpoint) {
        errors.push({
          field: `workflow_definition.nodes[${index}].config.webhook_config.endpoint`,
          message: "Webhook endpoint is required for webhook triggers"
        });
      }
    }
  }

  return errors;
}

/**
 * Validates action node specific requirements
 */
function validateActionNode(node: WorkflowNode, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (node.node_type.type === "Action") {
    const config = node.node_type.config;

    if (!config.action_type) {
      errors.push({
        field: `workflow_definition.nodes[${index}].config.action_type`,
        message: "Action type is required"
      });
    }

    // Validate API call action
    if (config.action_type === "api_call") {
      if (!config.api_config?.endpoint) {
        errors.push({
          field: `workflow_definition.nodes[${index}].config.api_config.endpoint`,
          message: "API endpoint is required for API call actions"
        });
      }

      if (!config.api_config?.method) {
        errors.push({
          field: `workflow_definition.nodes[${index}].config.api_config.method`,
          message: "HTTP method is required for API call actions"
        });
      }
    }

    // Validate knowledge base search action
    if (config.action_type === "knowledge_base_search") {
      if (!config.knowledge_base_config?.knowledge_base_id) {
        errors.push({
          field: `workflow_definition.nodes[${index}].config.knowledge_base_config.knowledge_base_id`,
          message: "Knowledge base ID is required for knowledge base search actions"
        });
      }

      if (!config.knowledge_base_config?.query) {
        errors.push({
          field: `workflow_definition.nodes[${index}].config.knowledge_base_config.query`,
          message: "Search query is required for knowledge base search actions"
        });
      }
    }
  }

  return errors;
}

/**
 * Validates workflow edge
 */
function validateWorkflowEdge(edge: WorkflowEdge, nodes: WorkflowNode[], index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate edge ID
  if (!edge.id || !edge.id.trim()) {
    errors.push({
      field: `workflow_definition.edges[${index}].id`,
      message: "Edge ID is required"
    });
  }

  // Validate source and target nodes exist
  const sourceNode = nodes.find(node => node.id === edge.source);
  const targetNode = nodes.find(node => node.id === edge.target);

  if (!sourceNode) {
    errors.push({
      field: `workflow_definition.edges[${index}].source`,
      message: "Source node does not exist"
    });
  }

  if (!targetNode) {
    errors.push({
      field: `workflow_definition.edges[${index}].target`,
      message: "Target node does not exist"
    });
  }

  // Validate that source and target are different
  if (edge.source === edge.target) {
    errors.push({
      field: `workflow_definition.edges[${index}]`,
      message: "Edge cannot connect a node to itself"
    });
  }

  // Validate that target is not a trigger node
  if (targetNode && (
    targetNode.node_type.type === "Trigger" ||
    (targetNode.data.config && typeof targetNode.data.config === 'object' && 'trigger_type' in targetNode.data.config)
  )) {
    errors.push({
      field: `workflow_definition.edges[${index}].target`,
      message: "Trigger nodes cannot be targets of edges"
    });
  }

  return errors;
}

/**
 * Main validation function that validates the entire workflow
 */
export function validateWorkflow(data: WorkflowFormData): WorkflowValidationResult {
  const errors: ValidationError[] = [];

  // Validate basic workflow information
  const basicErrors = validateWorkflowBasics(data);
  errors.push(...basicErrors);

  // Validate configuration
  const configErrors = validateWorkflowConfiguration(data.configuration);
  errors.push(...configErrors);

  // Validate workflow definition
  const definitionErrors = validateWorkflowDefinition(
    data.workflow_definition.nodes,
    data.workflow_definition.edges
  );
  errors.push(...definitionErrors);

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single field and returns error message if invalid
 */
export function validateField(fieldName: string, value: any): string | undefined {
  switch (fieldName) {
    case "name":
      if (!value || !value.trim()) {
        return "Workflow name is required";
      }
      if (value.trim().length > WORKFLOW_NAME_MAX_LENGTH) {
        return `Workflow name must be no more than ${WORKFLOW_NAME_MAX_LENGTH} characters long`;
      }
      break;

    case "description":
      if (value && value.length > DESCRIPTION_MAX_LENGTH) {
        return `Description must be no more than ${DESCRIPTION_MAX_LENGTH} characters long`;
      }
      break;

    case "timeout_seconds":
      if (value !== undefined && value !== null) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < MIN_TIMEOUT_SECONDS) {
          return `Timeout must be at least ${MIN_TIMEOUT_SECONDS} second`;
        }
        if (numValue > MAX_TIMEOUT_SECONDS) {
          return `Timeout must be no more than ${MAX_TIMEOUT_SECONDS} seconds (1 hour)`;
        }
      }
      break;

    case "max_retries":
      if (value !== undefined && value !== null) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < MIN_RETRIES) {
          return `Max retries must be at least ${MIN_RETRIES}`;
        }
        if (numValue > MAX_RETRIES) {
          return `Max retries must be no more than ${MAX_RETRIES}`;
        }
      }
      break;

    case "retry_delay_seconds":
      if (value !== undefined && value !== null) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < MIN_RETRY_DELAY) {
          return `Retry delay must be at least ${MIN_RETRY_DELAY} second`;
        }
        if (numValue > MAX_RETRY_DELAY) {
          return `Retry delay must be no more than ${MAX_RETRY_DELAY} seconds (5 minutes)`;
        }
      }
      break;

    default:
      return undefined;
  }

  return undefined;
}

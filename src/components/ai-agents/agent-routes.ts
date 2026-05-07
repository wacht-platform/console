export interface AgentRouteParams {
  projectId?: string;
  deploymentId?: string;
  agentId?: string;
}

export function buildAgentBasePath(params: AgentRouteParams): string {
  return `/project/${params.projectId}/deployment/${params.deploymentId}/llms/ai-agents/${params.agentId}`;
}

export function buildAgentResourcePath(
  params: AgentRouteParams,
  suffix:
    | ""
    | "/skills"
    | "/tools"
    | "/knowledge-bases"
    | "/sub-agents"
    | "/models"
    | "/hooks"
    | "/approvals"
    | "/debug",
): string {
  return `${buildAgentBasePath(params)}${suffix}`;
}

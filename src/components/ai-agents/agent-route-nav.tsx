import { useLocation, useNavigate, useParams } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildAgentResourcePath } from "./agent-routes";

const items = [
  { key: "overview", label: "Overview", suffix: "" },
  { key: "skills", label: "Agent Skills", suffix: "/skills" },
  { key: "tools", label: "Agent Tools", suffix: "/tools" },
  { key: "knowledge-bases", label: "Knowledge Bases", suffix: "/knowledge-bases" },
  { key: "sub-agents", label: "Sub-Agents", suffix: "/sub-agents" },
  { key: "models", label: "Model Routing", suffix: "/models" },
  { key: "hooks", label: "Execution Hooks", suffix: "/hooks" },
  { key: "approvals", label: "Tool Approvals", suffix: "/approvals" },
] as const;

export function AgentRouteNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const activeItem =
    items.find((item) => location.pathname === buildAgentResourcePath(params, item.suffix)) ?? items[0];

  return (
    <Tabs
      value={activeItem.key}
      onValueChange={(value) => {
        const item = items.find((entry) => entry.key === value);
        if (item) navigate(buildAgentResourcePath(params, item.suffix));
      }}
    >
      <TabsList variant="pill">
        {items.map((item) => (
          <TabsTrigger
            key={item.key}
            value={item.key}
            data-tour-id={`agent-tab-${item.key}`}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

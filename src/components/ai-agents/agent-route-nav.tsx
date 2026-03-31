import { Link, useLocation, useParams } from "react-router";
import {
  BookOpenIcon,
  CodeBracketIcon,
  CommandLineIcon,
  LinkIcon,
  Squares2X2Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { buildAgentResourcePath } from "./agent-routes";

const items = [
  { key: "overview", label: "Overview", icon: Squares2X2Icon, suffix: "" },
  { key: "integrations", label: "Integrations", icon: LinkIcon, suffix: "/integrations" },
  { key: "tools", label: "Tools", icon: WrenchScrewdriverIcon, suffix: "/tools" },
  { key: "knowledge-bases", label: "Knowledge Bases", icon: BookOpenIcon, suffix: "/knowledge-bases" },
  { key: "mcp-servers", label: "MCP Servers", icon: CodeBracketIcon, suffix: "/mcp-servers" },
  { key: "sub-agents", label: "Sub-Agents", icon: UserGroupIcon, suffix: "/sub-agents" },
  { key: "debug", label: "Debug", icon: CommandLineIcon, suffix: "/debug" },
] as const;

export function AgentRouteNav() {
  const location = useLocation();
  const params = useParams();

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const href = buildAgentResourcePath(params, item.suffix);
        const active = location.pathname === href;
        const Icon = item.icon;

        return (
          <Link
            key={item.key}
            to={href}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-primary bg-primary/8 text-foreground"
                : "border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

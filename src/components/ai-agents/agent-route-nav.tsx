import { Link, useLocation, useParams } from "react-router";
import {
  BoltIcon,
  BookOpenIcon,
  CpuChipIcon,
  QueueListIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { buildAgentResourcePath } from "./agent-routes";

const groups = [
  {
    group: "Configure",
    items: [
      { key: "overview", label: "Overview", icon: Squares2X2Icon, suffix: "" },
      { key: "skills", label: "Agent Skills", icon: QueueListIcon, suffix: "/skills" },
      { key: "tools", label: "Agent Tools", icon: WrenchScrewdriverIcon, suffix: "/tools" },
      {
        key: "knowledge-bases",
        label: "Knowledge Bases",
        icon: BookOpenIcon,
        suffix: "/knowledge-bases",
      },
      { key: "sub-agents", label: "Sub-Agents", icon: UserGroupIcon, suffix: "/sub-agents" },
      { key: "models", label: "Model Routing", icon: CpuChipIcon, suffix: "/models" },
    ],
  },
  {
    group: "Controls",
    items: [
      { key: "hooks", label: "Execution Hooks", icon: BoltIcon, suffix: "/hooks" },
      { key: "approvals", label: "Tool Approvals", icon: ShieldCheckIcon, suffix: "/approvals" },
    ],
  },
] as const;

export function AgentRouteNav() {
  const location = useLocation();
  const params = useParams();

  return (
    <nav className="flex flex-col gap-1.5 lg:sticky lg:top-4">
      {groups.map((grp) => (
        <div key={grp.group} className="mb-1">
          <div className="px-2.5 pb-[7px] pt-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
            {grp.group}
          </div>
          {grp.items.map((item) => {
            const href = buildAgentResourcePath(params, item.suffix);
            const active = location.pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={href}
                data-tour-id={`agent-tab-${item.key}`}
                className={cn(
                  "relative flex h-[34px] items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {active ? (
                  <span className="absolute bottom-[7px] left-[-2px] top-[7px] w-0.5 rounded-full bg-primary" />
                ) : null}
                <Icon
                  className={cn(
                    "h-[15px] w-[15px] shrink-0",
                    active ? "opacity-100" : "opacity-75",
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

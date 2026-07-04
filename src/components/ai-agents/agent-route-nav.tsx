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
    <nav className="overflow-x-auto border-b border-border pb-2">
      <div className="flex min-w-max items-center gap-2">
        {groups.flatMap((grp) =>
          grp.items.map((item) => {
            const href = buildAgentResourcePath(params, item.suffix);
            const active = location.pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                to={href}
                data-tour-id={`agent-tab-${item.key}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors",
                  active
                    ? "border-primary/20 bg-primary/10 font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[15px] w-[15px] shrink-0",
                    active ? "opacity-100" : "opacity-75",
                  )}
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          }),
        )}
      </div>
    </nav>
  );
}

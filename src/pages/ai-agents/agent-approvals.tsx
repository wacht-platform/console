import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { InlineLoader } from "@/components/ui/loading-screen";
import {
  type AgentToolApprovalRule,
  type ApprovalAction,
  useAgentById,
  useUpdateAgent,
} from "@/lib/api/hooks/use-agents";

const ACTION_OPTIONS: { value: ApprovalAction; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "review", label: "Review" },
  { value: "deny", label: "Deny" },
];

interface FormState {
  require_approval_mcp: boolean;
  require_approval_virtual: boolean;
  rules: AgentToolApprovalRule[];
}

function fromAgent(agent: {
  require_approval_mcp?: boolean;
  require_approval_virtual?: boolean;
  tool_approval_rules?: AgentToolApprovalRule[];
}): FormState {
  return {
    require_approval_mcp: agent.require_approval_mcp ?? false,
    require_approval_virtual: agent.require_approval_virtual ?? false,
    rules: (agent.tool_approval_rules ?? []).map((rule) => ({ ...rule })),
  };
}

function isInvalidRegex(pattern: string): boolean {
  if (!pattern.trim()) return true;
  try {
    new RegExp(pattern);
    return false;
  } catch {
    return true;
  }
}

export default function AgentApprovalsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const updateAgent = useUpdateAgent();

  const original = useMemo(
    () =>
      fromAgent(
        agent ?? { require_approval_mcp: false, require_approval_virtual: false },
      ),
    [agent],
  );
  const [form, setForm] = useState<FormState>(original);

  useEffect(() => {
    setForm(original);
  }, [original]);

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);
  const ruleHasInvalidRegex = form.rules.some((r) => isInvalidRegex(r.pattern));

  const onSave = async () => {
    if (ruleHasInvalidRegex) {
      toast.error("Every rule needs a valid regex pattern");
      return;
    }
    try {
      await updateAgent.mutateAsync({
        agentId: agent.id,
        agent: {
          require_approval_mcp: form.require_approval_mcp,
          require_approval_virtual: form.require_approval_virtual,
          tool_approval_rules: form.rules,
        },
      });
      toast.success("Approval policy updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update approval policy",
      );
    }
  };

  const updateRule = (index: number, partial: Partial<AgentToolApprovalRule>) =>
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? { ...r, ...partial } : r)),
    }));

  const moveRule = (index: number, delta: -1 | 1) =>
    setForm((prev) => {
      const next = [...prev.rules];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, rules: next };
    });

  return (
    <div className="space-y-8">
      <p className="text-[13px] leading-5 text-muted-foreground">
        Resolution order: regex rules → per-tool action → MCP/virtual toggle → allow.
        First match wins.{" "}
        <a
          href="https://wacht.dev/docs/guides/agents/approval-policy"
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
        .
      </p>

      <ToggleRow
        title="Require approval for MCP tools"
        description="Every mcp_* tool call goes through review unless overridden by a regex rule."
        checked={form.require_approval_mcp}
        onChange={(checked) =>
          setForm((prev) => ({ ...prev, require_approval_mcp: checked }))
        }
      />

      <div className="border-t border-border/40" />

      <ToggleRow
        title="Require approval for virtual tools"
        description="Every v_* tool (Composio etc.) goes through review unless overridden by a regex rule."
        checked={form.require_approval_virtual}
        onChange={(checked) =>
          setForm((prev) => ({ ...prev, require_approval_virtual: checked }))
        }
      />

      <div className="border-t border-border/40" />

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-medium leading-5">Regex rules</div>
            <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
              Match tool names with a regex; first matching rule wins.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                rules: [...prev.rules, { pattern: "", action: "review" }],
              }))
            }
          >
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            Add rule
          </Button>
        </div>

        {form.rules.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No rules configured.</p>
        ) : (
          <ol className="space-y-2">
            {form.rules.map((rule, index) => {
              const invalid = isInvalidRegex(rule.pattern);
              return (
                <li key={index} className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Input
                    value={rule.pattern}
                    placeholder="^mcp_linear_"
                    spellCheck={false}
                    className={
                      "flex-1 font-mono text-[12.5px] " +
                      (invalid ? "border-destructive" : "")
                    }
                    onChange={(e) => updateRule(index, { pattern: e.target.value })}
                  />
                  <Select
                    value={rule.action}
                    onValueChange={(value) =>
                      updateRule(index, { action: value as ApprovalAction })
                    }
                  >
                    <SelectTrigger className="h-9 w-[110px] text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => moveRule(index, -1)}
                  >
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={index === form.rules.length - 1}
                    onClick={() => moveRule(index, 1)}
                  >
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        rules: prev.rules.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-5">
        <Button
          variant="outline"
          onClick={() => setForm(original)}
          disabled={!isDirty || updateAgent.isPending}
        >
          Reset
        </Button>
        <Button
          onClick={onSave}
          disabled={!isDirty || ruleHasInvalidRegex || updateAgent.isPending}
        >
          {updateAgent.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Label className="text-[14px] font-medium leading-5">{title}</Label>
        <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

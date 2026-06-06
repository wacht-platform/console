import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoltIcon,
  TrashIcon,
  PlusIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SectionLabel } from "@/components/ui/section-label";
import { EmptyState } from "@/components/ui/empty-state";
import SavePopup from "@/components/save-popup";
import { InlineLoader } from "@/components/ui/loading-screen";
import {
  type AgentHookStep,
  type AgentHooksConfig,
  useAgentById,
  useUpdateAgent,
} from "@/lib/api/hooks/use-agents";
import { useAgentTools, useInternalTools } from "@/lib/api/hooks/use-tools";
import { useMcpServers } from "@/lib/api/hooks/use-mcp-servers";
import { useComposioTools } from "@/lib/api/hooks/use-composio-config";
import type { ComposioToolSummary, InternalToolSummary } from "@/types/composio";
import type { McpServer } from "@/types/mcp-server";
import { Switch } from "@/components/ui/switch";

interface DraftStep {
  tool_name: string;
  args_text: string;
}

interface HooksFormState {
  execution_start: DraftStep[];
  execution_end: DraftStep[];
}

const EMPTY_STEP: DraftStep = { tool_name: "", args_text: "{}" };

function fromHooks(hooks?: AgentHooksConfig): HooksFormState {
  return {
    execution_start: (hooks?.execution_start ?? []).map(stepToDraft),
    execution_end: (hooks?.execution_end ?? []).map(stepToDraft),
  };
}

function stepToDraft(step: AgentHookStep): DraftStep {
  return {
    tool_name: step.tool_name,
    args_text: JSON.stringify(step.args ?? {}, null, 2),
  };
}

function draftToStep(
  draft: DraftStep,
  kind: string,
  index: number,
): AgentHookStep {
  let parsed: Record<string, unknown> = {};
  if (draft.args_text.trim() !== "") {
    try {
      const value = JSON.parse(draft.args_text);
      if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        throw new Error("must be a JSON object");
      }
      parsed = value as Record<string, unknown>;
    } catch (err) {
      throw new Error(
        `${kind}[${index}].args is not valid JSON: ${(err as Error).message}`,
      );
    }
  }
  return { tool_name: draft.tool_name.trim(), args: parsed };
}

interface AgentToolOption {
  name: string;
  description?: string;
  kind: string;
}

type SchemaMap = Record<string, Record<string, unknown> | undefined>;

export default function AgentHooksPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: agentTools = [] } = useAgentTools(agentId || "");
  const { data: internalTools = [] } = useInternalTools();
  const { data: mcpServersResp } = useMcpServers({ limit: 100 });
  const { data: composioToolsResp } = useComposioTools();
  const updateAgent = useUpdateAgent();

  const agentToolOptions: AgentToolOption[] = useMemo(
    () =>
      agentTools.map((t) => ({
        name: t.name,
        description: t.description ?? undefined,
        kind: t.tool_type,
      })),
    [agentTools],
  );

  const mcpServers: McpServer[] = mcpServersResp?.mcpServers ?? [];
  const composioTools: ComposioToolSummary[] = composioToolsResp?.tools ?? [];

  // Schemas keyed by tool name so the form can look one up regardless of
  // which group the user picked from. Internal first, Composio overlays it
  // (no overlap expected — internal tools are bare names, Composio is `v_…`).
  const schemasByName: SchemaMap = useMemo(() => {
    const map: SchemaMap = {};
    for (const tool of internalTools) {
      if (tool.input_schema && typeof tool.input_schema === "object") {
        map[tool.name] = tool.input_schema as Record<string, unknown>;
      }
    }
    for (const tool of composioTools) {
      if (tool.input_schema && typeof tool.input_schema === "object") {
        map[tool.name] = tool.input_schema as Record<string, unknown>;
      }
    }
    return map;
  }, [internalTools, composioTools]);

  const [form, setForm] = useState<HooksFormState>({
    execution_start: [],
    execution_end: [],
  });
  const original = useMemo(() => fromHooks(agent?.hooks), [agent?.hooks]);

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

  const updateKind = (
    kind: keyof HooksFormState,
    update: (steps: DraftStep[]) => DraftStep[],
  ) => {
    setForm((prev) => ({ ...prev, [kind]: update(prev[kind]) }));
  };

  const onSave = async () => {
    let payload: AgentHooksConfig;
    try {
      payload = {
        execution_start: form.execution_start.map((d, i) =>
          draftToStep(d, "execution_start", i),
        ),
        execution_end: form.execution_end.map((d, i) =>
          draftToStep(d, "execution_end", i),
        ),
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid hook config");
      return;
    }

    const emptyName = [
      ...(payload.execution_start ?? []),
      ...(payload.execution_end ?? []),
    ].some((s) => !s.tool_name);
    if (emptyName) {
      toast.error("Every hook step needs a tool_name");
      return;
    }

    try {
      await updateAgent.mutateAsync({
        agentId: agent.id,
        agent: { hooks: payload },
      });
      toast.success("Hooks updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update hooks",
      );
    }
  };

  return (
    <div>
      <p className="mb-6 text-[13px] leading-6 text-muted-foreground">
        Steps run sequentially with a 60s cap each. Failures are reported via
        webhook and don't block the run.{" "}
        <a
          href="https://wacht.dev/docs/guides/agents/hooks"
          className="text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
        .
      </p>

      <div className="flex flex-col gap-10">
        <HookSection
          title="Execution start"
          description="Runs once at the top of every run, before the first model call."
          steps={form.execution_start}
          agentTools={agentToolOptions}
          internalTools={internalTools}
          composioTools={composioTools}
          mcpServers={mcpServers}
          schemas={schemasByName}
          onChange={(update) => updateKind("execution_start", update)}
        />

        <HookSection
          title="Execution end"
          description="Runs once on the way out — success, abort, or budget cap. Fire-and-observe."
          steps={form.execution_end}
          agentTools={agentToolOptions}
          internalTools={internalTools}
          composioTools={composioTools}
          mcpServers={mcpServers}
          schemas={schemasByName}
          onChange={(update) => updateKind("execution_end", update)}
        />
      </div>

      <SavePopup
        isDirty={isDirty}
        isSaving={updateAgent.isPending}
        onSave={onSave}
        onCancel={() => setForm(original)}
      />
    </div>
  );
}

interface HookSectionProps {
  title: string;
  description: string;
  steps: DraftStep[];
  agentTools: AgentToolOption[];
  internalTools: InternalToolSummary[];
  composioTools: ComposioToolSummary[];
  mcpServers: McpServer[];
  schemas: SchemaMap;
  onChange: (update: (steps: DraftStep[]) => DraftStep[]) => void;
}

function HookSection({
  title,
  description,
  steps,
  agentTools,
  internalTools,
  composioTools,
  mcpServers,
  schemas,
  onChange,
}: HookSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange((prev) => [...prev, { ...EMPTY_STEP }])}
          >
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            Add step
          </Button>
        }
      >
        {title}
      </SectionLabel>
      <p className="-mt-1 text-[12px] leading-5 text-muted-foreground">
        {description}
      </p>

      {steps.length === 0 ? (
        <EmptyState
          compact
          icon={<BoltIcon />}
          title="No steps yet"
          description="Add a step to run a tool automatically when this hook fires — failures are reported but never block the run."
        />
      ) : (
        <ol className="divide-y divide-border">
          {steps.map((step, index) => {
            const schema = step.tool_name ? schemas[step.tool_name] : undefined;
            return (
              <li key={index} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] font-medium text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ToolPicker
                    value={step.tool_name}
                    agentTools={agentTools}
                    internalTools={internalTools}
                    composioTools={composioTools}
                    mcpServers={mcpServers}
                    onChange={(name) =>
                      onChange((prev) =>
                        prev.map((s, i) =>
                          i === index
                            ? { ...s, tool_name: name, args_text: "{}" }
                            : s,
                        ),
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    disabled={index === 0}
                    onClick={() =>
                      onChange((prev) => {
                        if (index === 0) return prev;
                        const next = [...prev];
                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];
                        return next;
                      })
                    }
                  >
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    disabled={index === steps.length - 1}
                    onClick={() =>
                      onChange((prev) => {
                        if (index === prev.length - 1) return prev;
                        const next = [...prev];
                        [next[index], next[index + 1]] = [
                          next[index + 1],
                          next[index],
                        ];
                        return next;
                      })
                    }
                  >
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {step.tool_name ? (
                  <div className="mt-3">
                    <ArgsEditor
                      step={step}
                      schema={schema}
                      onChange={(next) =>
                        onChange((prev) =>
                          prev.map((s, i) =>
                            i === index ? { ...s, ...next } : s,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

interface PropertyDef {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  items?: { type?: string };
  default?: unknown;
  properties?: Record<string, unknown>;
  required?: string[];
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function primaryType(def: PropertyDef): string {
  if (Array.isArray(def.type)) {
    const filtered = def.type.filter((t) => t !== "null");
    return filtered[0] ?? "string";
  }
  return def.type ?? "string";
}

/**
 * Args editor — schema-driven form when we know the schema, JSON textarea
 * otherwise. The textarea is also reachable from the form via "Edit as JSON"
 * for nested/complex inputs the form can't represent.
 */
function ArgsEditor({
  step,
  schema,
  onChange,
}: {
  step: DraftStep;
  schema?: Record<string, unknown>;
  onChange: (next: Partial<DraftStep>) => void;
}) {
  const [rawMode, setRawMode] = useState(false);
  const hasSchema = Boolean(schema);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[12px] text-muted-foreground">Args</Label>
        {hasSchema ? (
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Edit as JSON</span>
            <Switch checked={rawMode} onCheckedChange={setRawMode} />
          </label>
        ) : null}
      </div>

      {hasSchema && !rawMode ? (
        <SchemaForm
          schema={schema!}
          argsText={step.args_text}
          onChange={(text) => onChange({ args_text: text })}
        />
      ) : (
        <Textarea
          value={step.args_text}
          rows={4}
          spellCheck={false}
          onChange={(e) => onChange({ args_text: e.target.value })}
          className="font-mono text-[12px]"
        />
      )}
    </div>
  );
}

/**
 * Top-level schema-driven args editor. Parses args_text once, hands control to
 * the recursive object renderer, and re-serialises on every change.
 */
function SchemaForm({
  schema,
  argsText,
  onChange,
}: {
  schema: Record<string, unknown>;
  argsText: string;
  onChange: (next: string) => void;
}) {
  const properties = asObject(schema.properties);
  const required = Array.isArray(schema.required)
    ? (schema.required as string[])
    : [];

  const parsed: Record<string, unknown> = useMemo(() => {
    try {
      const value = JSON.parse(argsText || "{}");
      return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }, [argsText]);

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground">
        This tool takes no arguments.
      </p>
    );
  }

  return (
    <div className="rounded border border-border bg-secondary p-3">
      <SchemaObjectFields
        properties={properties}
        required={required}
        value={parsed}
        onChange={(next) => onChange(JSON.stringify(next, null, 2))}
      />
    </div>
  );
}

function SchemaObjectFields({
  properties,
  required,
  value,
  onChange,
}: {
  properties: Record<string, unknown>;
  required: string[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const requiredSet = new Set(required);
  const setField = (key: string, fieldValue: unknown) => {
    const next: Record<string, unknown> = { ...value };
    if (fieldValue === undefined || fieldValue === "") {
      delete next[key];
    } else {
      next[key] = fieldValue;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {Object.entries(properties).map(([key, raw]) => {
        const def = (raw && typeof raw === "object" ? raw : {}) as PropertyDef;
        const type = primaryType(def);
        const isRequired = requiredSet.has(key);
        const current = value[key];

        return (
          <div key={key} className="space-y-1">
            <Label className="flex items-baseline gap-2 text-[12.5px]">
              <span className="font-mono">{key}</span>
              {isRequired ? (
                <span className="text-[10px] uppercase tracking-wide text-destructive">
                  required
                </span>
              ) : null}
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {type}
                {def.format ? `:${def.format}` : ""}
              </span>
            </Label>
            <SchemaField
              def={def}
              type={type}
              value={current}
              onChange={(v) => setField(key, v)}
            />
            {def.description ? (
              <p className="text-[11.5px] leading-4 text-muted-foreground">
                {def.description}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ArrayField({
  def,
  value,
  onChange,
}: {
  def: PropertyDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const itemType = def.items?.type ?? "string";

  const toText = (v: unknown) =>
    Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : "";

  const computeValue = (raw: string): unknown => {
    const items = raw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (itemType === "integer" || itemType === "number") {
      const nums = items.map((s) =>
        itemType === "integer" ? parseInt(s, 10) : parseFloat(s),
      );
      return nums.some((n) => Number.isNaN(n)) ? items : nums;
    }
    return items.length > 0 ? items : undefined;
  };

  const ser = (v: unknown) => JSON.stringify(v === undefined ? null : v);

  // Hold the raw text locally so in-progress lines (incl. the trailing newline
  // when you press Enter) survive — deriving the textarea value from the parsed
  // array would strip empty lines and make a second line impossible to start.
  const [text, setText] = useState(() => toText(value));
  const [syncedKey, setSyncedKey] = useState(() => ser(value));

  // Resync only when the value changes from the outside (form reset, tool
  // switch) — never from our own emits, which would clobber what's being typed.
  const valueKey = ser(value);
  if (valueKey !== syncedKey) {
    setSyncedKey(valueKey);
    setText(toText(value));
  }

  return (
    <Textarea
      value={text}
      rows={3}
      placeholder={`One ${itemType} per line`}
      spellCheck={false}
      className="font-mono text-[12px]"
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const next = computeValue(raw);
        setSyncedKey(ser(next));
        onChange(next);
      }}
    />
  );
}

function SchemaField({
  def,
  type,
  value,
  onChange,
}: {
  def: PropertyDef;
  type: string;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (Array.isArray(def.enum) && def.enum.length > 0) {
    const stringValue = value === undefined || value === null ? "" : String(value);
    return (
      <Select
        value={stringValue}
        onValueChange={(v) => onChange(v === "" ? undefined : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Pick ${type}`} />
        </SelectTrigger>
        <SelectContent>
          {def.enum.map((opt) => (
            <SelectItem key={String(opt)} value={String(opt)}>
              {String(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <span className="text-[12px] text-muted-foreground">
          {value === true ? "true" : "false"}
        </span>
      </div>
    );
  }

  if (type === "integer" || type === "number") {
    return (
      <Input
        type="number"
        value={value === undefined || value === null ? "" : String(value)}
        min={def.minimum}
        max={def.maximum}
        step={type === "integer" ? 1 : "any"}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(undefined);
            return;
          }
          const num = type === "integer" ? parseInt(raw, 10) : parseFloat(raw);
          onChange(Number.isNaN(num) ? raw : num);
        }}
      />
    );
  }

  if (type === "array") {
    return <ArrayField def={def} value={value} onChange={onChange} />;
  }

  if (type === "object") {
    const nestedProperties = asObject(def.properties);
    if (nestedProperties && Object.keys(nestedProperties).length > 0) {
      const nestedRequired = Array.isArray(def.required) ? def.required : [];
      const nestedValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};
      return (
        <div className="rounded border border-border bg-card p-2.5 pl-3">
          <SchemaObjectFields
            properties={nestedProperties}
            required={nestedRequired}
            value={nestedValue}
            onChange={(next) =>
              onChange(Object.keys(next).length === 0 ? undefined : next)
            }
          />
        </div>
      );
    }
    const text =
      value === undefined ? "" : JSON.stringify(value, null, 2);
    return (
      <Textarea
        value={text}
        rows={4}
        placeholder="{}"
        spellCheck={false}
        className="font-mono text-[12px]"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw.trim() === "") {
            onChange(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            onChange(parsed);
          } catch {
            onChange(raw);
          }
        }}
      />
    );
  }

  // string / fallback
  return (
    <Input
      type="text"
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
    />
  );
}

type PickerTab = "catalog" | "mcp";

interface ToolPickerProps {
  value: string;
  agentTools: AgentToolOption[];
  internalTools: InternalToolSummary[];
  composioTools: ComposioToolSummary[];
  mcpServers: McpServer[];
  onChange: (name: string) => void;
}

function ToolPicker({
  value,
  agentTools,
  internalTools,
  composioTools,
  mcpServers,
  onChange,
}: ToolPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PickerTab>("catalog");
  const [query, setQuery] = useState("");

  const showMcpTab = mcpServers.length > 0;

  const close = (name: string) => {
    onChange(name);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between font-mono text-[13px] font-normal"
        >
          {value ? (
            value
          ) : (
            <span className="text-muted-foreground font-sans">Pick a tool…</span>
          )}
          <ChevronUpDownIcon className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[28rem] p-0"
        align="start"
      >
        {showMcpTab ? (
          <div className="flex border-b border-border">
            <PickerTabButton
              label="Catalog"
              active={tab === "catalog"}
              onClick={() => setTab("catalog")}
            />
            <PickerTabButton
              label="MCP"
              active={tab === "mcp"}
              onClick={() => setTab("mcp")}
            />
          </div>
        ) : null}

        {tab === "catalog" ? (
          <CatalogPicker
            query={query}
            onQueryChange={setQuery}
            agentTools={agentTools}
            internalTools={internalTools}
            composioTools={composioTools}
            onPick={close}
          />
        ) : (
          <McpPicker mcpServers={mcpServers} onPick={close} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function PickerTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 px-3 py-2 text-[12.5px] font-medium transition-colors " +
        (active
          ? "border-b-2 border-foreground text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}

function CatalogPicker({
  query,
  onQueryChange,
  agentTools,
  internalTools,
  composioTools,
  onPick,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  agentTools: AgentToolOption[];
  internalTools: InternalToolSummary[];
  composioTools: ComposioToolSummary[];
  onPick: (name: string) => void;
}) {
  const trimmed = query.trim();
  const allKnown = useMemo(() => {
    const set = new Set<string>();
    agentTools.forEach((t) => set.add(t.name));
    internalTools.forEach((t) => set.add(t.name));
    composioTools.forEach((t) => set.add(t.name));
    return set;
  }, [agentTools, internalTools, composioTools]);
  const exactMatch = allKnown.has(trimmed);

  return (
    <Command shouldFilter>
      <CommandInput
        placeholder="Search agent tools and Composio…"
        value={query}
        onValueChange={onQueryChange}
      />
      <CommandList className="max-h-[18rem]">
        <CommandEmpty>
          {trimmed ? (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-[13px]"
              onClick={() => onPick(trimmed)}
            >
              Use{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">
                {trimmed}
              </code>{" "}
              as a custom tool name
            </button>
          ) : (
            <span className="block px-3 py-2 text-[13px] text-muted-foreground">
              No tools match.
            </span>
          )}
        </CommandEmpty>

        {agentTools.length > 0 ? (
          <CommandGroup heading="Agent tools">
            {agentTools.map((tool) => (
              <CommandItem
                key={`a-${tool.name}`}
                value={tool.name}
                keywords={tool.description ? [tool.description] : undefined}
                onSelect={() => onPick(tool.name)}
              >
                <span className="flex-1 truncate font-mono text-[12.5px]">
                  {tool.name}
                </span>
                <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {tool.kind}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {internalTools.length > 0 ? (
          <CommandGroup heading="Internal">
            {internalTools.map((tool) => (
              <CommandItem
                key={`i-${tool.name}`}
                value={tool.name}
                keywords={tool.description ? [tool.description] : undefined}
                onSelect={() => onPick(tool.name)}
              >
                <span className="flex-1 truncate font-mono text-[12.5px]">
                  {tool.name}
                </span>
                <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  internal
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {composioTools.length > 0 ? (
          <CommandGroup heading="Composio">
            {composioTools.map((tool) => (
              <CommandItem
                key={`c-${tool.name}`}
                value={tool.name}
                keywords={[
                  tool.toolkit_slug,
                  tool.remote_tool_slug,
                  tool.display_name ?? "",
                  tool.description ?? "",
                ]}
                onSelect={() => onPick(tool.name)}
              >
                <span className="flex-1 truncate font-mono text-[12.5px]">
                  {tool.name}
                </span>
                <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {tool.toolkit_slug}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {trimmed && !exactMatch ? (
          <CommandGroup heading="Custom">
            <CommandItem
              value={`__use_${trimmed}`}
              onSelect={() => onPick(trimmed)}
            >
              <span className="text-[13px]">
                Use{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">
                  {trimmed}
                </code>
              </span>
            </CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}

/**
 * MCP picker is intentionally schema-less: pick a server, type a tool name.
 * Composes the runtime name as `mcp_{server.slug}_{tool}`. We don't enumerate
 * MCP tools because most servers require a per-user OAuth before listing.
 */
function McpPicker({
  mcpServers,
  onPick,
}: {
  mcpServers: McpServer[];
  onPick: (name: string) => void;
}) {
  const [serverId, setServerId] = useState<string>(mcpServers[0]?.id ?? "");
  const [toolName, setToolName] = useState("");

  const server = mcpServers.find((s) => s.id === serverId);
  const trimmedTool = toolName.trim();
  const preview = server && trimmedTool
    ? `mcp_${server.slug}_${trimmedTool}`
    : "";

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-1">
        <Label className="text-[12px] text-muted-foreground">MCP server</Label>
        <Select value={serverId} onValueChange={setServerId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pick a server" />
          </SelectTrigger>
          <SelectContent>
            {mcpServers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="font-mono text-[12.5px]">{s.slug}</span>
                <span className="ml-2 text-muted-foreground">{s.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[12px] text-muted-foreground">Tool name</Label>
        <Input
          value={toolName}
          spellCheck={false}
          placeholder="create_issue"
          className="font-mono text-[13px]"
          onChange={(e) => setToolName(e.target.value)}
        />
      </div>
      <div className="rounded border border-border bg-secondary px-2.5 py-1.5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Resolves to
        </div>
        <div className="mt-0.5 font-mono text-[12px] truncate">
          {preview || <span className="text-muted-foreground">—</span>}
        </div>
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={!preview}
        onClick={() => onPick(preview)}
      >
        Use
      </Button>
    </div>
  );
}

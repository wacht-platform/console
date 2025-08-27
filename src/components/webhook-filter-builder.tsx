import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "@/components/ui/listbox";
import { Field, Label, Description } from "@/components/ui/fieldset";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export interface FilterRule {
  field: string;
  operator: string;
  value: any;
}

export interface FilterGroup {
  operator: "$and" | "$or";
  rules: FilterRule[];
}

interface FilterBuilderProps {
  value?: any;
  onChange: (value: any) => void;
  className?: string;
}

const OPERATORS = [
  { value: "$eq", label: "Equals" },
  { value: "$ne", label: "Not Equals" },
  { value: "$gt", label: "Greater Than" },
  { value: "$gte", label: "Greater Than or Equal" },
  { value: "$lt", label: "Less Than" },
  { value: "$lte", label: "Less Than or Equal" },
  { value: "$in", label: "In Array" },
  { value: "$nin", label: "Not In Array" },
  { value: "$contains", label: "Contains" },
  { value: "$not_contains", label: "Does Not Contain" },
  { value: "$starts_with", label: "Starts With" },
  { value: "$ends_with", label: "Ends With" },
];

export function WebhookFilterBuilder({ value, onChange, className }: FilterBuilderProps) {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(() => {
    if (value && typeof value === 'object') {
      if (value.$and && Array.isArray(value.$and)) {
        const rules = value.$and.map((rule: any) => {
          const field = Object.keys(rule)[0];
          const condition = rule[field];
          const operator = Object.keys(condition)[0];
          return {
            field,
            operator,
            value: condition[operator]
          };
        });
        return { operator: "$and", rules };
      } else if (value.$or && Array.isArray(value.$or)) {
        const rules = value.$or.map((rule: any) => {
          const field = Object.keys(rule)[0];
          const condition = rule[field];
          const operator = Object.keys(condition)[0];
          return {
            field,
            operator,
            value: condition[operator]
          };
        });
        return { operator: "$or", rules };
      }
    }
    return { operator: "$and", rules: [] };
  });

  const addRule = () => {
    const newRules = [...filterGroup.rules, { field: "", operator: "$eq", value: "" }];
    const newGroup = { ...filterGroup, rules: newRules };
    setFilterGroup(newGroup);
    updateValue(newGroup);
  };

  const updateRule = (index: number, updates: Partial<FilterRule>) => {
    const newRules = [...filterGroup.rules];
    newRules[index] = { ...newRules[index], ...updates };
    const newGroup = { ...filterGroup, rules: newRules };
    setFilterGroup(newGroup);
    updateValue(newGroup);
  };

  const removeRule = (index: number) => {
    const newRules = filterGroup.rules.filter((_, i) => i !== index);
    const newGroup = { ...filterGroup, rules: newRules };
    setFilterGroup(newGroup);
    updateValue(newGroup);
  };

  const updateGroupOperator = (operator: "$and" | "$or") => {
    const newGroup = { ...filterGroup, operator };
    setFilterGroup(newGroup);
    updateValue(newGroup);
  };

  const updateValue = (group: FilterGroup) => {
    if (group.rules.length === 0) {
      onChange(null);
      return;
    }

    const rules = group.rules
      .filter(rule => rule.field && rule.value !== "")
      .map(rule => ({
        [rule.field]: { [rule.operator]: parseValue(rule.value) }
      }));

    if (rules.length === 0) {
      onChange(null);
    } else {
      onChange({ [group.operator]: rules });
    }
  };

  const parseValue = (value: string) => {
    // Try to parse as JSON for arrays or objects
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    // Try to parse as number
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Return as string
    return value;
  };

  return (
    <div className={className}>
      <Field>
        <Label>Filter Rules (Optional)</Label>
        <Description>
          Define conditions to filter when events are sent. For example, only send when user.role equals "admin" or amount is greater than 100.
        </Description>
      </Field>

      {filterGroup.rules.length > 0 && (
        <div className="mt-4 space-y-4">
          {filterGroup.rules.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Match</span>
              <Listbox value={filterGroup.operator} onChange={updateGroupOperator}>
                <ListboxOption value="$and">
                  <ListboxLabel>All conditions (AND)</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="$or">
                  <ListboxLabel>Any condition (OR)</ListboxLabel>
                </ListboxOption>
              </Listbox>
            </div>
          )}

          <div className="space-y-3">
            {filterGroup.rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Field path (e.g., user.role)"
                    value={rule.field}
                    onChange={(e) => updateRule(index, { field: e.target.value })}
                    className="text-sm"
                  />
                  
                  <Listbox 
                    value={rule.operator} 
                    onChange={(value) => updateRule(index, { operator: value })}
                  >
                    {OPERATORS.map(op => (
                      <ListboxOption key={op.value} value={op.value}>
                        <ListboxLabel>{op.label}</ListboxLabel>
                      </ListboxOption>
                    ))}
                  </Listbox>

                  <Input
                    placeholder="Value"
                    value={rule.value}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    className="text-sm"
                  />
                </div>
                
                <Button
                  plain
                  onClick={() => removeRule(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        plain
        onClick={addRule}
        className="mt-4"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Filter Rule
      </Button>

      {filterGroup.rules.length > 0 && (
        <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Preview (JSON)</p>
          <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
            {JSON.stringify(
              filterGroup.rules.length > 0 ? 
                { [filterGroup.operator]: filterGroup.rules
                  .filter(r => r.field && r.value !== "")
                  .map(r => ({ [r.field]: { [r.operator]: parseValue(r.value) } })) 
                } : null, 
              null, 
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
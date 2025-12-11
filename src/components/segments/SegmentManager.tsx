import { useState } from "react";
import {
  useSegments,
  useAssignSegment,
  useRemoveSegment,
} from "@/lib/api/hooks/use-segments";
import { Segment, SegmentType } from "@/types/segment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxOption,
  ComboboxLabel,
} from "@/components/ui/combobox";
import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface SegmentManagerProps {
  targetId: string;
  targetType: SegmentType;
  currentSegments: Segment[] | undefined;
}

export function SegmentManager({
  targetId,
  targetType,
  currentSegments = [],
}: SegmentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { data: allSegments, isLoading } = useSegments();
  const assignSegment = useAssignSegment();
  const removeSegment = useRemoveSegment();

  // Filter segments that are relevant for this target type
  // And exclude already assigned segments
  const availableSegments =
    allSegments
      ?.filter((s) => s.type === targetType)
      .filter((s) => !currentSegments.some((cs) => cs.id === s.id)) || [];

  const handleAssign = (segment: Segment | null) => {
    if (!segment) return;
    assignSegment.mutate(
      { targetId, targetType, segmentId: segment.id },
      {
        onSuccess: () => {
          setIsAdding(false);
        },
      },
    );
  };

  const handleRemove = (segmentId: string) => {
    removeSegment.mutate({ targetId, targetType, segmentId });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {currentSegments.map((segment) => (
        <Badge
          key={segment.id}
          color="zinc"
          className="pl-2.5 pr-1 py-1 flex items-center gap-1.5 transition-all"
        >
          {segment.name}
          <button
            onClick={() => handleRemove(segment.id)}
            className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 p-0.5 transition-colors cursor-pointer group"
            aria-label={`Remove ${segment.name}`}
          >
            <XMarkIcon className="h-3 w-3 text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
          </button>
        </Badge>
      ))}

      {isAdding ? (
        <div
          className={cn("min-w-48", currentSegments.length === 0 && "w-full")}
        >
          {isLoading ? (
            <div className="flex items-center px-2 py-1">
              <Spinner size="sm" />
            </div>
          ) : (
            <Combobox
              options={availableSegments}
              displayValue={(segment) => segment?.name}
              onChange={handleAssign}
              placeholder="Select segment..."
              autoFocus
              onBlur={() => {
                // Small delay to allow click to register if clicking an option
                setTimeout(() => setIsAdding(false), 200);
              }}
              className="text-sm w-full"
            >
              {(segment) => (
                <ComboboxOption key={segment.id} value={segment}>
                  <ComboboxLabel>{segment.name}</ComboboxLabel>
                </ComboboxOption>
              )}
            </Combobox>
          )}
        </div>
      ) : (
        <Button
          plain
          className={cn(
            "h-7 px-3 text-xs font-medium flex items-center gap-1.5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-full hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-zinc-600 dark:text-zinc-400",
            currentSegments.length === 0 && "w-full justify-center h-9 mt-2 ",
          )}
          onClick={() => setIsAdding(true)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Segment
        </Button>
      )}
    </div>
  );
}

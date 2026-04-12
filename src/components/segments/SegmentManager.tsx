import { useState } from "react";
import {
  useSegments,
  useAssignSegment,
  useRemoveSegment,
} from "@/lib/api/hooks/use-segments";
import { Segment, SegmentType } from "@/types/segment";
import { Badge } from "@/components/ui/badge";
import type { SimpleComboboxOption } from "@/components/ui/simple-combobox";
import { SimpleCombobox } from "@/components/ui/simple-combobox";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Spinner } from "@/components/ui/spinner";

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
  const [selectedSegment, setSelectedSegment] = useState<Segment | undefined>(undefined);
  const { data: allSegments, isLoading } = useSegments();
  const assignSegment = useAssignSegment();
  const removeSegment = useRemoveSegment();

  const availableSegments =
    allSegments
      ?.filter((s) => s.type === targetType)
      .filter((s) => !currentSegments.some((cs) => cs.id === s.id)) || [];

  const segmentOptions: SimpleComboboxOption<Segment>[] = availableSegments.map((segment) => ({
    value: segment,
    label: segment.name,
  }));

  const handleAssign = (segment: Segment) => {
    if (!segment) return;
    assignSegment.mutate(
      { targetId, targetType, segmentId: segment.id },
      {
        onSuccess: () => {
          setSelectedSegment(undefined);
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

      {isLoading ? (
        <div className="flex items-center px-2 py-1">
          <Spinner size="sm" />
        </div>
      ) : (
        <SimpleCombobox
          options={segmentOptions}
          value={selectedSegment}
          onChange={handleAssign}
          placeholder="Select segment..."
          className="text-sm w-full"
        />
      )}
    </div>
  );
}

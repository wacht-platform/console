import { useState } from "react";
import {
  useSegments,
  useAssignSegment,
  useRemoveSegment,
} from "@/lib/api/hooks/use-segments";
import { Segment, SegmentType } from "@/types/segment";
import { Tag } from "@/components/ui/tag";
import type { SimpleComboboxOption } from "@/components/ui/simple-combobox";
import { SimpleCombobox } from "@/components/ui/simple-combobox";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Spinner } from "@/components/ui/app-spinner";

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
        <Tag key={segment.id} className="h-6 gap-1 pr-1">
          {segment.name}
          <button
            onClick={() => handleRemove(segment.id)}
            className="cursor-pointer rounded-sm p-0.5 text-primary/60 transition-colors hover:bg-primary/20 hover:text-primary"
            aria-label={`Remove ${segment.name}`}
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </Tag>
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

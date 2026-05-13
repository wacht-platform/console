import { useEffect } from "react";
import { Heading } from "@/components/ui/heading";
import { SegmentsManageTab } from "@/components/segments/SegmentsManageTab";
import { usePostHog } from "@posthog/react";
import { useTour, useTourCompletion } from "@/lib/tour";
import { useSegments } from "@/lib/api/hooks/use-segments";

export default function SegmentsManagePage() {
  const posthog = usePostHog();
  const { data: segments, isLoading } = useSegments({});

  useEffect(() => {
    posthog?.capture("segment_viewed");
  }, [posthog]);

  useTour("first-segments", !isLoading);
  useTourCompletion("first-segments", (segments?.length ?? 0) > 0);

  return (
    <div>
      <div className="flex flex-col gap-2 mb-6">
        <Heading>Manage Segments</Heading>
      </div>
      <SegmentsManageTab />
    </div>
  );
}

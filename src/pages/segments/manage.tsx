import { useEffect } from "react";
import { Heading } from "@/components/ui/heading";
import { SegmentsManageTab } from "@/components/segments/SegmentsManageTab";
import { usePostHog } from "@posthog/react";

export default function SegmentsManagePage() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("segment_viewed");
  }, [posthog]);

  return (
    <div>
      <div className="flex flex-col gap-2 mb-6">
        <Heading>Manage Segments</Heading>
      </div>
      <SegmentsManageTab />
    </div>
  );
}

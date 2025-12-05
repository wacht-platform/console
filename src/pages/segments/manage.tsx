import { Heading } from "@/components/ui/heading";
import { SegmentsManageTab } from "@/components/segments/SegmentsManageTab";

export default function SegmentsManagePage() {
  return (
    <div>
      <div className="flex flex-col gap-2 mb-6">
        <Heading>Manage Segments</Heading>
      </div>
      <SegmentsManageTab />
    </div>
  );
}

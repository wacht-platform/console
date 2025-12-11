import { DomainManagement } from "./DomainManagement";
import { ConnectionSetup } from "./ConnectionSetup";
import { Divider } from "@/components/ui/divider";

interface EnterpriseSSOProps {
  organizationId: string;
}

export function EnterpriseSSO({ organizationId }: EnterpriseSSOProps) {
  return (
    <div className="space-y-6 pt-6">
      <DomainManagement organizationId={organizationId} />

      <Divider />

      <ConnectionSetup organizationId={organizationId} />
    </div>
  );
}

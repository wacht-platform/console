import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router";

export default function WebhooksEmbedPage() {
  const navigate = useNavigate();
  const { projectId, deploymentId } = useParams();
  const basePath = `/project/${projectId}/deployment/${deploymentId}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => navigate(`${basePath}/webhooks/catalogs`)}
        >
          Event Catalogs
        </Button>
      </div>
      <VanityEmbedShell kind="webhook" />
    </div>
  );
}

import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router";

export default function ApiKeysEmbedPage() {
  const navigate = useNavigate();
  const { projectId, deploymentId } = useParams();
  const basePath = `/project/${projectId}/deployment/${deploymentId}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => navigate(`${basePath}/api-keys/rate-limit-schemes`)}
        >
          Rate Limit Schemes
        </Button>
      </div>
      <VanityEmbedShell kind="api-auth" />
    </div>
  );
}

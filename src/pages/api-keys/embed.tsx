import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { useTour } from "@/lib/tour";

export default function ApiKeysEmbedPage() {
  useTour("first-api-auth");
  return (
    <div className="-m-5" data-tour-id="api-auth-content">
      <VanityEmbedShell kind="api-auth" />
    </div>
  );
}

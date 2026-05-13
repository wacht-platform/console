import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { useTour } from "@/lib/tour";

export default function WebhooksEmbedPage() {
  useTour("first-webhooks");
  return (
    <div className="-m-5" data-tour-id="webhooks-content">
      <VanityEmbedShell kind="webhook" />
    </div>
  );
}

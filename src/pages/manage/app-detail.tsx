import { useParams } from "react-router";
import { VanityEmbedShell } from "@/components/vanity-embed-shell";

export function AppDetail({ kind }: { kind: "api-auth" | "webhook" }) {
    const { slug } = useParams();

    return (
        <div className="-mx-4 -my-4 md:-my-6 lg:-mx-6">
            <VanityEmbedShell kind={kind} appSlug={slug} />
        </div>
    );
}

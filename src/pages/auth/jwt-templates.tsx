import { useNavigate } from "react-router";
import { PlusIcon, KeyIcon } from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { useDeploymentJWTTemplates } from "@/lib/api/hooks/use-deployment-jwt-templates";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";

export default function JWTTemplatesPage() {
    const { jwtTemplates, isLoadingJWTTemplates } = useDeploymentJWTTemplates();
    const navigate = useNavigate();

    const handleCreateNew = () => {
        navigate("./new");
    };

    const isEmpty = !jwtTemplates || jwtTemplates.length === 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    Manage JSON Web Token templates for secure authentication.
                </p>
                <Button onClick={handleCreateNew} className="shrink-0 gap-1.5">
                    <PlusIcon className="size-4" />
                    Create template
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Lifetime</TableHead>
                        <TableHead>Signing key</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoadingJWTTemplates ? (
                        <SkeletonTableRows rows={5} columns={5} withAvatar={false} />
                    ) : isEmpty ? (
                        <TableEmptyRow
                            colSpan={5}
                            icon={<KeyIcon className="h-8 w-8 text-muted-foreground/50" />}
                            title="No JWT templates yet"
                            description="Templates let you customize the claims in tokens issued to your users."
                            action={
                                <Button
                                    onClick={handleCreateNew}
                                    className="gap-1.5"
                                >
                                    <PlusIcon className="size-4" />
                                    Create template
                                </Button>
                            }
                        />
                    ) : (
                        jwtTemplates.map((template) => (
                            <TableRow
                                key={template.id}
                                className="cursor-pointer"
                                onClick={() => navigate(`./${template.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <KeyIcon className="size-4" />
                                        </div>
                                        <span className="font-medium text-foreground">
                                            {template.name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {template.token_lifetime}s
                                </TableCell>
                                <TableCell>
                                    {template.custom_signing_key?.enabled ? (
                                        <Tag>custom key</Tag>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Default
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                        new Date(template.updated_at),
                                    )}{" "}
                                    ago
                                </TableCell>
                                <TableCell className="w-10 text-muted-foreground">
                                    <ChevronRightIcon className="size-4" />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

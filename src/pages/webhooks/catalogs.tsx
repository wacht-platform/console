import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWebhookEventCatalogs } from "@/lib/api/hooks/use-webhook-event-catalogs";
import type { WebhookEventCatalog } from "@/types/webhook-catalog";
import { WebhookCatalogModal } from "@/components/webhooks/webhook-catalog-modal";

export default function WebhookCatalogsPage() {
  const { data = [], isLoading } = useWebhookEventCatalogs();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catalogToEdit, setCatalogToEdit] = useState<WebhookEventCatalog | null>(null);

  const filteredCatalogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...data]
      .filter((catalog) => {
        if (!term) return true;
        const haystack = `${catalog.name} ${catalog.slug} ${catalog.description ?? ""}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [data, search]);

  const openCreateModal = () => {
    setCatalogToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (catalog: WebhookEventCatalog) => {
    setCatalogToEdit(catalog);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCatalogToEdit(null);
  };

  const getEventSummary = (eventCount: number) =>
    eventCount === 1 ? "1 event" : `${eventCount} events`;

  const columns = 6;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-normal tracking-tight">Webhook Catalogs</h1>
        <p className="text-sm text-muted-foreground">
          Create shared event catalogs and reuse them across webhook apps.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search catalogs..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreateModal} className="ml-auto">
          Create Catalog
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonTableRows rows={10} columns={columns} withAvatar={false} />
          ) : filteredCatalogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Squares2X2Icon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No catalogs found" : "No catalogs yet"}
                  </p>
                  {search && (
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredCatalogs.map((catalog) => (
              <TableRow key={catalog.slug}>
                <TableCell className="font-medium">{catalog.name}</TableCell>
                <TableCell className="text-muted-foreground">{catalog.slug}</TableCell>
                <TableCell className="max-w-[280px] truncate text-muted-foreground">
                  {catalog.description || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getEventSummary(catalog.events?.length ?? 0)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(catalog.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(catalog)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <WebhookCatalogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        catalogToEdit={catalogToEdit}
      />
    </div>
  );
}

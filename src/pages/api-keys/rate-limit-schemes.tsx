import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, ScaleIcon } from "@heroicons/react/24/outline";
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
import { useRateLimitSchemes } from "@/lib/api/hooks/use-rate-limit-schemes";
import type { RateLimitScheme } from "@/types/rate-limit-scheme";
import { RateLimitSchemeModal } from "@/components/api-keys/rate-limit-scheme-modal";

export default function ApiKeyRateLimitSchemesPage() {
  const { data = [], isLoading } = useRateLimitSchemes();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schemeToEdit, setSchemeToEdit] = useState<RateLimitScheme | null>(null);

  const filteredSchemes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...data]
      .filter((scheme) => {
        if (!term) return true;
        const haystack = `${scheme.name} ${scheme.slug} ${scheme.description ?? ""}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [data, search]);

  const openCreateModal = () => {
    setSchemeToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: RateLimitScheme) => {
    setSchemeToEdit(scheme);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSchemeToEdit(null);
  };

  const getRuleSummary = (ruleCount: number) =>
    ruleCount === 1 ? "1 rule" : `${ruleCount} rules`;

  const columns = 6;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-normal tracking-tight">Rate Limit Schemes</h1>
        <p className="text-sm text-muted-foreground">
          Define reusable API auth policies and assign them to apps.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schemes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreateModal} className="ml-auto">
          Create Scheme
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Rules</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonTableRows rows={10} columns={columns} withAvatar={false} />
          ) : filteredSchemes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <ScaleIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No schemes found" : "No schemes yet"}
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
            filteredSchemes.map((scheme) => (
              <TableRow key={scheme.slug}>
                <TableCell className="font-medium">{scheme.name}</TableCell>
                <TableCell className="text-muted-foreground">{scheme.slug}</TableCell>
                <TableCell className="max-w-[280px] truncate text-muted-foreground">
                  {scheme.description || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getRuleSummary(scheme.rules?.length ?? 0)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(scheme.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(scheme)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <RateLimitSchemeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        schemeToEdit={schemeToEdit}
      />
    </div>
  );
}

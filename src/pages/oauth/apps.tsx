import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import {
  MagnifyingGlassIcon,
  PhotoIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, Label } from "@/components/ui/fieldset";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useCreateOAuthApp, useOAuthApps } from "@/lib/api/hooks/use-oauth-management";
import { useProjects } from "@/lib/api/hooks/use-projects";

function CreateOAuthAppDialog({
  open,
  onClose,
  onCreated,
  isProduction,
  rootDomain,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (slug: string) => void;
  isProduction: boolean;
  rootDomain: string;
}) {
  const createOAuthApp = useCreateOAuthApp();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [fqdn, setFqdn] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSlug("");
    setName("");
    setFqdn("");
    setDescription("");
    setLogoFile(null);
    setLogoPreview("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    onClose();
  };

  const handleLogoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleCreate = async () => {
    if (!slug.trim() || !name.trim()) {
      toast.error("Slug and name are required");
      return;
    }
    if (isProduction && !fqdn.trim()) {
      toast.error("FQDN is required for production deployments");
      return;
    }

    const created = await createOAuthApp.mutateAsync({
      slug: slug.trim(),
      name: name.trim(),
      fqdn: isProduction ? fqdn.trim() : undefined,
      description: description.trim() || undefined,
      logo_file: logoFile || undefined,
    });
    onCreated(created.slug);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create OAuth App</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center pb-1">
            <div
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-600 dark:hover:border-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="OAuth app logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PhotoIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {logoPreview ? "Change photo" : "Add photo"}
              </button>
              {logoPreview ? (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  >
                    Remove
                  </button>
                </>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-zinc-500">PNG, JPG, GIF, WEBP, ICO up to 2MB</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoSelect}
            />
          </div>

          <Field>
            <Label>Slug</Label>
            <Input
              placeholder="mcp-auth"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          <Field>
            <Label>Name</Label>
            <Input
              placeholder="MCP Auth Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {isProduction ? (
            <Field>
              <Label>OAuth Domain</Label>
              <div className="flex items-center rounded-md border bg-background">
                <Input
                  placeholder={`oauth.${rootDomain}`}
                  value={fqdn}
                  onChange={(e) => setFqdn(e.target.value.toLowerCase())}
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Required for production. We will provision this as a Cloudflare custom hostname.
              </p>
            </Field>
          ) : null}
          <Field>
            <Label>
              Description
              <span className="ml-1 text-zinc-400 font-normal">optional</span>
            </Label>
            <Textarea
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createOAuthApp.isPending}>
            {createOAuthApp.isPending ? "Creating..." : "Create OAuth App"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OAuthAppsIndexPage() {
  const navigate = useNavigate();
  const { projectId, deploymentId } = useParams();
  const { selectedDeployment } = useProjects();
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: oauthApps = [], isLoading } = useOAuthApps();
  const isProduction = selectedDeployment?.mode === "production";
  const rootDomain = useMemo(() => {
    if (!selectedDeployment) return "";
    if (selectedDeployment.frontend_host.startsWith("accounts.")) {
      return selectedDeployment.frontend_host.slice("accounts.".length);
    }
    if (selectedDeployment.backend_host.startsWith("frontend.")) {
      return selectedDeployment.backend_host.slice("frontend.".length);
    }
    return selectedDeployment.frontend_host;
  }, [selectedDeployment]);

  const filteredApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    return oauthApps.filter((app) => {
      if (!term) return true;
      return `${app.name} ${app.slug} ${app.description ?? ""}`.toLowerCase().includes(term);
    });
  }, [oauthApps, search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-normal tracking-tight">OAuth Apps</h1>
        <p className="text-sm text-muted-foreground">
          OAuth app servers for this deployment.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search OAuth apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} className="ml-auto">
          Create OAuth App
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OAuth App</TableHead>
            <TableHead>FQDN</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonTableRows rows={10} columns={4} withAvatar={false} />
          ) : filteredApps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Squares2X2Icon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No OAuth apps found" : "No OAuth apps yet"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredApps.map((app) => (
              <TableRow
                key={app.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/project/${projectId}/deployment/${deploymentId}/oauth/${app.slug}`)
                }
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={app.logo_url} />
                      <AvatarFallback className="text-xs">
                        {app.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{app.name}</span>
                      <span className="text-xs text-muted-foreground">{app.slug}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{app.fqdn || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(app.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{app.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CreateOAuthAppDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        isProduction={isProduction}
        rootDomain={rootDomain}
        onCreated={(slug) =>
          navigate(`/project/${projectId}/deployment/${deploymentId}/oauth/${slug}`)
        }
      />
    </div>
  );
}

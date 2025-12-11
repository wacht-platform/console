import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useOrganizationDomains,
  useCreateOrganizationDomain,
  useDeleteOrganizationDomain,
  useVerifyOrganizationDomain,
} from "@/lib/api/hooks/use-organization-sso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription, AlertActions } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const createDomainSchema = z.object({
  fqdn: z
    .string()
    .min(1, "Domain is required")
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/, "Invalid domain format"),
});

type CreateDomainFormValues = z.infer<typeof createDomainSchema>;

interface DomainManagementProps {
  organizationId: string;
}

export function DomainManagement({ organizationId }: DomainManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null);
  const { data: domains, isLoading } = useOrganizationDomains(organizationId);
  const createDomain = useCreateOrganizationDomain();
  const deleteDomain = useDeleteOrganizationDomain();
  const verifyDomain = useVerifyOrganizationDomain();

  const form = useForm<CreateDomainFormValues>({
    resolver: zodResolver(createDomainSchema),
  });

  const onSubmit = async (data: CreateDomainFormValues) => {
    try {
      await createDomain.mutateAsync({
        organizationId,
        data,
      });
      setIsCreateDialogOpen(false);
      form.reset();
      toast.success("Domain added successfully");
    } catch (error) {
      toast.error("Failed to add domain", {
        description: "Please check if the domain already exists.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingDomainId) return;
    try {
      await deleteDomain.mutateAsync({ organizationId, domainId: deletingDomainId });
      setDeletingDomainId(null);
      toast.success("Domain deleted successfully");
    } catch (error) {
      toast.error("Failed to delete domain");
    }
  };

  const handleVerify = async (domainId: string) => {
    try {
      const result = await verifyDomain.mutateAsync({
        organizationId,
        domainId,
      });
      if (result.verified) {
        toast.success(result.message || "Domain verified successfully");
      } else {
        toast.error(result.message || "Verification failed");
      }
    } catch (error) {
      toast.error("Failed to verify domain");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Domains
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Verify domains to enable SSO for your organization.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Add Domain</Button>

        <Dialog open={isCreateDialogOpen} onClose={setIsCreateDialogOpen}>
          <DialogTitle>Add New Domain</DialogTitle>
          <DialogDescription className="mt-2 text-zinc-500 dark:text-zinc-400">
            Verify a domain to enable Single Sign-On (SSO) for your organization users.
            We'll ask you to add a DNS record to prove ownership.
          </DialogDescription>
          <DialogBody className="mt-6">
            <form
              id="create-domain-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="space-y-3">
                <label
                  htmlFor="fqdn"
                  className="block text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100"
                >
                  Domain Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <GlobeAltIcon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                  </div>
                  <Input
                    id="fqdn"
                    placeholder="e.g. acme.com"
                    {...form.register("fqdn")}
                    className="pl-10 dark:bg-zinc-800/50"
                    autoFocus
                  />
                </div>
                {form.formState.errors.fqdn && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" />
                    {form.formState.errors.fqdn.message}
                  </p>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter the root domain (e.g., example.com) or subdomain (e.g., mail.example.com) where your users receive emails.
                </p>
              </div>
            </form>
          </DialogBody>
          <DialogActions className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button plain onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-domain-form"
              disabled={createDomain.isPending}
            >
              {createDomain.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                "Add Domain"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      {domains?.length === 0 ? (
        <EmptyState
          title="No domains added yet"
          description="Add a domain to start configuring SSO."
          icon={<GlobeAltIcon className="h-12 w-12 text-zinc-400" />}
        />
      ) : (
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-zinc-200 dark:divide-zinc-800">
            {domains?.map((domain) => (
              <li
                key={domain.id}
                className="py-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <GlobeAltIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {domain.fqdn}
                          </h4>
                          {domain.verified ? (
                            <Badge
                              color="green"
                              className="inline-flex items-center gap-1.5 px-1.5 py-0 rounded text-[10px] font-medium"
                            >
                              <CheckCircleIcon className="w-3 h-3" /> Verified
                            </Badge>
                          ) : (
                            <Badge
                              color="yellow"
                              className="inline-flex items-center gap-1.5 px-1.5 py-0 rounded text-[10px] font-medium"
                            >
                              <XCircleIcon className="w-3 h-3" /> Unverified
                            </Badge>
                          )}
                        </div>
                        {domain.verified ? (
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                            <span>Domain verified and active</span>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Verification required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!domain.verified && (
                      <Button
                        outline
                        className="text-xs h-8"
                        onClick={() => handleVerify(domain.id)}
                        disabled={verifyDomain.isPending}
                      >
                        {verifyDomain.isPending ? (
                          <Spinner className="h-3 w-3 mr-1" />
                        ) : null}
                        Verify
                      </Button>
                    )}
                    <Button
                      plain
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      onClick={() => setDeletingDomainId(domain.id)}
                      title="Delete domain"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {!domain.verified && (
                  <div className="mt-6">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                      <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        Verification Required
                        <span className="font-normal text-zinc-500 dark:text-zinc-400 ml-auto">Add this TXT record to your DNS provider</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type</label>
                          <Input
                            readOnly
                            value="TXT"
                            className="font-mono text-xs h-9 bg-white dark:bg-zinc-800"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name / Host</label>
                          <Input
                            readOnly
                            value={`${domain.verification_dns_record_name || "_wacht-verification"}.${domain.fqdn}`}
                            className="font-mono text-xs h-9 bg-white dark:bg-zinc-800"
                          />
                        </div>
                        <div className="sm:col-span-7 space-y-1.5">
                          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Value</label>
                          <div className="relative">
                            <Input
                              readOnly
                              value={domain.verification_dns_record_data || domain.verification_token || ""}
                              className="font-mono text-xs  h-9 pr-24 bg-white dark:bg-zinc-800"
                            />
                            <div className="absolute inset-y-0 right-1 flex items-center">
                              <Button
                                plain
                                className="h-7 text-xs px-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded transition-all"
                                onClick={() => copyToClipboard(domain.verification_dns_record_data || domain.verification_token || "")}
                              >
                                <ClipboardDocumentIcon className="w-3.5 h-3.5 mr-1.5" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Delete Domain Confirmation */}
      <Alert open={!!deletingDomainId} onClose={() => setDeletingDomainId(null)}>
        <AlertTitle>Delete Domain</AlertTitle>
        <AlertDescription>
          Are you sure you want to delete this domain? Any SSO connections using this domain will be affected.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setDeletingDomainId(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} disabled={deleteDomain.isPending}>
            {deleteDomain.isPending ? <Spinner className="h-4 w-4" /> : "Delete"}
          </Button>
        </AlertActions>
      </Alert>
    </div>
  );
}

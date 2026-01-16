import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { SectionCards } from "@/components/section-cards";
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeysApi } from "@/lib/api/api-keys";
import type { ApiKey, ApiKeyWithSecret } from "@/types/api-key";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/fieldset";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, NoteDescription, NoteTitle } from "@/components/ui/note";

export default function ApiKeysPage() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  // Fetch API key status
  const { data: status, isLoading } = useQuery({
    queryKey: ["api-key-status", deploymentId],
    queryFn: () => apiKeysApi.getStatus(deploymentId!),
  });

  // Fetch API keys
  const { data: keys = [], refetch: refetchKeys, isLoading: keysLoading } = useQuery({
    queryKey: ["api-keys", deploymentId],
    queryFn: () => apiKeysApi.getKeys(deploymentId!),
    enabled: !!status?.is_activated,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["api-key-stats", deploymentId],
    queryFn: () => apiKeysApi.getStats(deploymentId!),
    enabled: !!status?.is_activated,
  });

  // Activate API keys mutation
  const activateMutation = useMutation({
    mutationFn: () => apiKeysApi.activate(deploymentId!),
    onSuccess: () => {
      toast.success("API keys activated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["api-key-status", deploymentId],
      });
    },
    onError: () => {
      toast.error("Failed to activate API keys");
    },
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; permissions?: string[]; expires_at?: string }) =>
      apiKeysApi.createKey(deploymentId!, data),
    onSuccess: (data: ApiKeyWithSecret) => {
      toast.success("API key created successfully!");
      setNewKeySecret(data.secret);
      setShowKeyModal(true);
      setShowCreateModal(false);
      refetchKeys();
      queryClient.invalidateQueries({
        queryKey: ["api-key-stats", deploymentId],
      });
    },
    onError: () => {
      toast.error("Failed to create API key");
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: ({ keyId, reason }: { keyId: string; reason?: string }) =>
      apiKeysApi.revokeKey(deploymentId!, keyId, { reason }),
    onSuccess: () => {
      toast.success("API key revoked successfully!");
      setShowRevokeModal(false);
      setSelectedKey(null);
      refetchKeys();
      queryClient.invalidateQueries({
        queryKey: ["api-key-stats", deploymentId],
      });
    },
    onError: () => {
      toast.error("Failed to revoke API key");
    },
  });

  // Rotate API key mutation
  const rotateKeyMutation = useMutation({
    mutationFn: (keyId: string) =>
      apiKeysApi.rotateKey(deploymentId!, keyId),
    onSuccess: (data: ApiKeyWithSecret) => {
      toast.success("API key rotated successfully!");
      setNewKeySecret(data.secret);
      setShowKeyModal(true);
      refetchKeys();
    },
    onError: () => {
      toast.error("Failed to rotate API key");
    },
  });

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading API keys...
          </span>
        </div>
      </div>
    );
  }

  if (!status?.is_activated) {
    return (
      <div>
        <Heading>API Keys</Heading>
        <EmptyState
          title="API Keys not enabled"
          description="Enable API keys to allow programmatic access to your deployment."
          icon={<KeyIcon className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />}
          actionLabel={activateMutation.isPending ? "Activating..." : "Enable API Keys"}
          onAction={() => activateMutation.mutate()}
        />
      </div>
    );
  }

  const activeKeys = keys.filter(k => k.is_active);
  const revokedKeys = keys.filter(k => !k.is_active);

  const statsData = [
    {
      title: "Total Keys",
      value: stats?.total_keys?.toString() || "0",
      change: 0,
    },
    {
      title: "Active Keys",
      value: stats?.active_keys?.toString() || "0",
      change: 0,
    },
    {
      title: "Revoked Keys",
      value: stats?.revoked_keys?.toString() || "0",
      change: 0,
    },
    {
      title: "Used (24h)",
      value: stats?.keys_used_24h?.toString() || "0",
      change: 0,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Heading>API Keys</Heading>
          <p className="text-zinc-500 mt-1 dark:text-zinc-400">
            Manage API keys for programmatic access
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <SectionCards data={statsData} />
      </div>

      {/* Keys Management */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Keys</TabsTrigger>
          <TabsTrigger value="revoked">Revoked Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Active API Keys
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Keys that can currently access your deployment
                </p>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </div>

            <div className="border rounded-md dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keysLoading ? (
                    <SkeletonTableRows rows={5} columns={7} withAvatar={false} />
                  ) : activeKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center py-6">
                          <KeyIcon className="h-8 w-8 text-zinc-400 mb-2" />
                          <p className="text-sm text-zinc-500 mb-4">No active API keys found</p>
                          <Button size="sm" onClick={() => setShowCreateModal(true)}>
                            Create First Key
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono dark:bg-zinc-800 dark:text-gray-100">
                            {key.key_prefix}...{key.key_suffix}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(key.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {key.last_used_at
                            ? format(new Date(key.last_used_at), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {key.expires_at ? (
                            <span className="text-yellow-600">
                              {format(new Date(key.expires_at), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge color="green">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => rotateKeyMutation.mutate(key.id)}
                              disabled={rotateKeyMutation.isPending}
                              title="Rotate key"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedKey(key);
                                setShowRevokeModal(true);
                              }}
                              title="Revoke key"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revoked">
          <div className="mt-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Revoked API Keys
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Keys that have been revoked and can no longer access your deployment
              </p>
            </div>
            <div className="border rounded-md dark:border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Revoked</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keysLoading ? (
                    <SkeletonTableRows rows={5} columns={6} withAvatar={false} />
                  ) : revokedKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                        No revoked keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    revokedKeys.map((key) => (
                      <TableRow key={key.id} className="opacity-60">
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono dark:bg-zinc-800 dark:text-gray-100">
                            {key.key_prefix}...{key.key_suffix}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(key.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {key.revoked_at
                            ? format(new Date(key.revoked_at), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {key.revoked_reason || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge color="red">Revoked</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Key Modal */}
      <CreateKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createKeyMutation.mutate(data)}
        isLoading={createKeyMutation.isPending}
      />

      {/* Show New Key Secret Modal */}
      <ShowKeySecretModal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setNewKeySecret("");
        }}
        secret={newKeySecret}
        onCopy={() => copyToClipboard(newKeySecret)}
      />

      {/* Revoke Key Modal */}
      <RevokeKeyModal
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedKey(null);
        }}
        keyName={selectedKey?.name || ""}
        onConfirm={(reason) => {
          if (selectedKey) {
            revokeKeyMutation.mutate({ keyId: selectedKey.id, reason });
          }
        }}
        isLoading={revokeKeyMutation.isPending}
      />
    </div>
  );
}

// Create Key Modal Component
function CreateKeyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; permissions?: string[]; expires_at?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      expires_at: expiresAt || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access to your deployment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Field>
            <Label>Key Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Server Key"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              A descriptive name to identify this key
            </p>
          </Field>
          <Field>
            <Label>Expiration (Optional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for a key that never expires
            </p>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? (
                "Creating Key..."
              ) : (
                "Create Key"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Show Key Secret Modal Component
function ShowKeySecretModal({
  isOpen,
  onClose,
  secret,
  onCopy,
}: {
  isOpen: boolean;
  onClose: () => void;
  secret: string;
  onCopy: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()} onClose={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <DialogTitle>API Key Created Successfully</DialogTitle>
          <DialogDescription>
            Your API key has been created. Use it to authenticate your requests.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field>
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
              API Key
            </Label>
            <div className="relative">
              <div className="group relative">
                <code className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 pr-10 font-mono text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  {secret}
                </code>
                <div className="absolute inset-y-0 right-1 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    onClick={onCopy}
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Field>

          <Note variant="warning">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <NoteTitle>Save this key now</NoteTitle>
              <NoteDescription>
                For security, we will not show it again. If you lose it, you'll need to generate a new one.
              </NoteDescription>
            </div>
          </Note>
        </div>
        <DialogFooter className="sm:justify-between sm:gap-0">
          <div className="text-xs text-zinc-500 self-center flex-1">
            Make sure to store it securely.
          </div>
          <Button onClick={onClose} className="w-full sm:w-auto">I've saved it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Revoke Key Modal Component
function RevokeKeyModal({
  isOpen,
  onClose,
  keyName,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  keyName: string;
  onConfirm: (reason?: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke the key "{keyName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Field>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Key compromised, no longer needed, etc."
              rows={3}
            />
          </Field>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Applications using this key will immediately lose access.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Revoking...
              </>
            ) : (
              "Revoke Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
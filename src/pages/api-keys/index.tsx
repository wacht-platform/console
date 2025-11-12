import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import { Heading } from "@/components/ui/heading";
import { Stat } from "@/components/stat";
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
import { Dialog, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/fieldset";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SkeletonTableRows } from "@/components/ui/skeleton";

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
        <div className="text-center py-12">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            API Keys not enabled
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Enable API keys to allow programmatic access to your deployment.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <>
                  <Spinner size="xs" className="mr-2" />
                  Activating...
                </>
              ) : (
                <>
                  <KeyIcon className="mr-2 h-4 w-4" />
                  Enable API Keys
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeKeys = keys.filter(k => k.is_active);
  const revokedKeys = keys.filter(k => !k.is_active);

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <Heading>API Keys</Heading>
          <p className="text-zinc-500 mt-1 dark:text-zinc-400">
            Manage API keys for programmatic access
          </p>
        </div>
        <Badge color={status?.app?.is_active ? "green" : "zinc"}>
          {status?.app?.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Total Keys"
          value={stats?.total_keys?.toString() || "0"}
          change=""
        />
        <Stat
          title="Active Keys"
          value={stats?.active_keys?.toString() || "0"}
          change=""
        />
        <Stat
          title="Revoked Keys"
          value={stats?.revoked_keys?.toString() || "0"}
          change=""
        />
        <Stat
          title="Used (24h)"
          value={stats?.keys_used_24h?.toString() || "0"}
          change=""
        />
      </div>

      {/* Keys Management */}
      <div className="mt-14">
        <SimpleTabs>
          <Tab label="Active Keys">
            <div className="mt-4">
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden dark:bg-zinc-900 dark:ring-white/10">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center">
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
                </div>
                <div className="px-6 pb-4">
                  <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Key</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader>Last Used</TableHeader>
                      <TableHeader>Expires</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {keysLoading ? (
                      <SkeletonTableRows rows={5} columns={7} withAvatar={false} />
                    ) : activeKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <KeyIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                          <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            No active keys
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Create your first API key to get started.
                          </p>
                          <div className="mt-6">
                            <Button onClick={() => setShowCreateModal(true)}>
                              <PlusIcon className="mr-2 h-4 w-4" />
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
                                outline
                                onClick={() => rotateKeyMutation.mutate(key.id)}
                                disabled={rotateKeyMutation.isPending}
                                title="Rotate key"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                outline
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
            </div>
          </Tab>

          <Tab label="Revoked Keys">
            <div className="mt-4">
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden dark:bg-zinc-900 dark:ring-white/10">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Revoked API Keys
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                    Keys that have been revoked and can no longer access your deployment
                  </p>
                </div>
                <div className="px-6 pb-4">
                  <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Key</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader>Revoked</TableHeader>
                      <TableHeader>Reason</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {keysLoading ? (
                      <SkeletonTableRows rows={5} columns={6} withAvatar={false} />
                    ) : revokedKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <KeyIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                          <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            No revoked keys
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Revoked API keys will appear here.
                          </p>
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
            </div>
          </Tab>
        </SimpleTabs>
      </div>

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
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Create API Key</DialogTitle>
      <DialogDescription>
        Create a new API key for programmatic access to your deployment.
      </DialogDescription>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" outline onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? (
                <>
                  <Spinner size="xs" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Key"
              )}
            </Button>
          </div>
        </form>
      </DialogBody>
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
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          API Key Created Successfully
        </div>
      </DialogTitle>
      <DialogDescription>
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 mt-2">
          <ExclamationTriangleIcon className="h-4 w-4" />
          Save this key now. You won't be able to see it again!
        </div>
      </DialogDescription>
      <DialogBody>
        <div className="space-y-4">
          <Field>
            <Label>Your API Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm font-mono text-gray-900 dark:bg-zinc-800 dark:text-gray-100 break-all">
                {secret}
              </code>
              <Button outline onClick={onCopy}>
                <ClipboardDocumentIcon className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Security Tips:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
              <li>Store this key in a secure location</li>
              <li>Never commit it to version control</li>
              <li>Use environment variables in production</li>
              <li>Rotate keys regularly for better security</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogBody>
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
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Revoke API Key</DialogTitle>
      <DialogDescription>
        Are you sure you want to revoke the key "{keyName}"? This action cannot be undone.
      </DialogDescription>
      <DialogBody>
        <div className="space-y-4">
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
          <div className="flex justify-end gap-2">
            <Button type="button" outline onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="red"
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
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
}
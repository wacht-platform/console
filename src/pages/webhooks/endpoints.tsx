import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heading } from "@/components/ui/heading";
import { Field, Description, Label } from "@/components/ui/fieldset";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";

import { WebhookEventSubscription, EventSubscription } from "@/components/webhook-event-subscription";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  GlobeAltIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhookApi, WebhookEndpoint, WebhookAppEvent, CreateEndpointRequest, UpdateEndpointRequest } from "@/lib/api/webhooks";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";

interface EndpointFormData {
  url: string;
  description: string;
  max_retries: number;
  timeout_seconds: number;
  subscriptions: EventSubscription[];
}

export default function WebhookEndpointsPage() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const [formData, setFormData] = useState<EndpointFormData>({
    url: "",
    description: "",
    max_retries: 5,
    timeout_seconds: 30,
    subscriptions: [],
  });

  // Fetch endpoints
  const { data, isLoading: endpointsLoading } = useQuery({
    queryKey: ["webhook-endpoints", deploymentId, currentPage],
    queryFn: () => webhookApi.getEndpoints(deploymentId!, {
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
    staleTime: 0, // Consider data immediately stale
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes after unmount
  });
  
  const endpoints = data?.endpoints;
  const hasMore = data?.has_more || false;

  // Fetch available events
  const { data: availableEvents } = useQuery({
    queryKey: ["webhook-events", deploymentId],
    queryFn: () => webhookApi.getAvailableEvents(deploymentId!),
  });

  // Group events by category
  const eventsByCategory = (availableEvents || []).reduce((acc, event) => {
    const category = event.event_name.split('.')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, WebhookAppEvent[]>);

  // Create endpoint mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEndpointRequest) => 
      webhookApi.createEndpoint(deploymentId!, data),
    onSuccess: () => {
      toast.success("Endpoint created successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", deploymentId] });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create endpoint");
    },
  });

  // Update endpoint mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEndpointRequest }) =>
      webhookApi.updateEndpoint(deploymentId!, id, data),
    onSuccess: () => {
      toast.success("Endpoint updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", deploymentId] });
      setEditingEndpoint(null);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update endpoint");
    },
  });

  // Delete endpoint mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => webhookApi.deleteEndpoint(deploymentId!, id),
    onSuccess: () => {
      toast.success("Endpoint deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", deploymentId] });
      setDeleteConfirmOpen(false);
      setSelectedEndpoint(null);
    },
    onError: () => {
      toast.error("Failed to delete endpoint");
    },
  });

  // Test endpoint mutation
  const testMutation = useMutation({
    mutationFn: (id: string) => 
      webhookApi.testEndpoint(deploymentId!, id, {
        event_name: "test.webhook",
        payload: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      }),
    onSuccess: () => {
      toast.success("Test webhook sent successfully!");
      setTestModalOpen(false);
      setSelectedEndpoint(null);
    },
    onError: () => {
      toast.error("Failed to send test webhook");
    },
  });

  const resetForm = () => {
    setFormData({
      url: "",
      description: "",
      max_retries: 5,
      timeout_seconds: 30,
      subscriptions: [],
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      url: formData.url,
      description: formData.description,
      max_retries: formData.max_retries,
      timeout_seconds: formData.timeout_seconds,
      subscriptions: formData.subscriptions,
    });
  };

  const handleUpdate = () => {
    if (!editingEndpoint) return;

    updateMutation.mutate({
      id: editingEndpoint.id,
      data: {
        url: formData.url,
        description: formData.description,
        max_retries: formData.max_retries,
        timeout_seconds: formData.timeout_seconds,
        subscriptions: formData.subscriptions,
      },
    });
  };

  const handleEdit = (endpoint: WebhookEndpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      url: endpoint.url,
      description: endpoint.description || "",
      max_retries: endpoint.max_retries || 5,
      timeout_seconds: endpoint.timeout_seconds || 30,
      subscriptions: endpoint.subscriptions?.map(s => ({
        event_name: s.event_name || "",
        filter_rules: s.filter_rules
      })) || [],
    });
  };

  const handleDelete = (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint);
    setDeleteConfirmOpen(true);
  };

  const handleTest = (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint);
    setTestModalOpen(true);
  };



  return (
    <div>
      {/* Create/Edit Modal */}
      <Dialog 
        open={createModalOpen || !!editingEndpoint} 
        onClose={() => {
          setCreateModalOpen(false);
          setEditingEndpoint(null);
          resetForm();
        }}
        className="sm:max-w-2xl lg:max-w-4xl"
      >
        <DialogTitle>{editingEndpoint ? "Edit Endpoint" : "Create Endpoint"}</DialogTitle>
        <DialogDescription>
          {editingEndpoint ? "Update your webhook endpoint configuration" : "Configure a new webhook endpoint to receive events"}
        </DialogDescription>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden">
          <Field>
            <Label>URL</Label>
            <Input
              type="url"
              placeholder="https://example.com/webhooks"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </Field>
          
          <Field>
            <Label>Description</Label>
            <Textarea
              placeholder="Optional description for this endpoint"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Max Retries</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={formData.max_retries}
                onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
              />
            </Field>
            <Field>
              <Label>Timeout (seconds)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
              />
            </Field>
          </div>

          <Field>
            <Label>Event Subscriptions</Label>
            <Description>Select events and optionally add filters for each</Description>
              <div className="mt-4 space-y-6">
                {Object.entries(eventsByCategory).map(([category, events]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="space-y-2">
                      {events.map((event) => {
                        const subscription = formData.subscriptions.find(
                          s => s.event_name === event.event_name
                        );
                        return (
                          <WebhookEventSubscription
                            key={event.id}
                            event={event}
                            subscription={subscription}
                            onChange={(newSub) => {
                              if (newSub) {
                                // Add or update subscription
                                const exists = formData.subscriptions.some(
                                  s => s.event_name === event.event_name
                                );
                                if (exists) {
                                  setFormData({
                                    ...formData,
                                    subscriptions: formData.subscriptions.map(s =>
                                      s.event_name === event.event_name ? newSub : s
                                    ),
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    subscriptions: [...formData.subscriptions, newSub],
                                  });
                                }
                              } else {
                                // Remove subscription
                                setFormData({
                                  ...formData,
                                  subscriptions: formData.subscriptions.filter(
                                    s => s.event_name !== event.event_name
                                  ),
                                });
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => {
            setCreateModalOpen(false);
            setEditingEndpoint(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingEndpoint ? handleUpdate : handleCreate}
            disabled={!formData.url || formData.subscriptions.length === 0 || (createMutation.isPending || updateMutation.isPending)}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Spinner size="xs" className="mr-2" />
                {editingEndpoint ? "Updating..." : "Creating..."}
              </>
            ) : (
              editingEndpoint ? "Update" : "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Endpoint</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this endpoint? This action cannot be undone.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => selectedEndpoint && deleteMutation.mutate(selectedEndpoint.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Modal */}
      <Dialog open={testModalOpen} onClose={() => setTestModalOpen(false)}>
        <DialogTitle>Test Endpoint</DialogTitle>
        <DialogDescription>
          Send a test webhook to {selectedEndpoint?.url}
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setTestModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedEndpoint && testMutation.mutate(selectedEndpoint.id)}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Sending...
              </>
            ) : (
              <>
                <BeakerIcon className="mr-2 h-4 w-4" />
                Send Test
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Heading>Webhook Endpoints</Heading>
        <Button onClick={() => setCreateModalOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Endpoint
        </Button>
      </div>

      {/* Endpoints Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>URL</TableHeader>
            <TableHeader>Events</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Created</TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {endpointsLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="flex items-center justify-center gap-3">
                  <Spinner size="sm" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading endpoints...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : !endpoints || endpoints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No endpoints configured</p>
              </TableCell>
            </TableRow>
          ) : (
            endpoints.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{endpoint.url}</div>
                    {endpoint.description && (
                      <div className="text-sm text-zinc-500">{endpoint.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{endpoint.subscriptions?.length || 0} events</span>
                      {endpoint.subscriptions?.some(s => s.filter_rules) && (
                        <Badge color="amber" className="text-xs">
                          {endpoint.subscriptions?.filter(s => s.filter_rules).length} filtered
                        </Badge>
                      )}
                    </div>
                    {endpoint.subscriptions && endpoint.subscriptions.length > 0 && (
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {endpoint.subscriptions.slice(0, 3).map(s => s.event_name).join(', ')}
                        {endpoint.subscriptions.length > 3 && ` +${endpoint.subscriptions.length - 3} more`}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color={endpoint.is_active ? "green" : "zinc"}>
                    {endpoint.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(endpoint.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button plain onClick={() => handleTest(endpoint)}>
                      <BeakerIcon className="h-4 w-4" />
                    </Button>
                    <Button plain onClick={() => handleEdit(endpoint)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button plain onClick={() => handleDelete(endpoint)}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      {endpoints && endpoints.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, currentPage * pageSize + endpoints.length)} of {hasMore ? 'many' : currentPage * pageSize + endpoints.length} endpoints
          </div>
          <div className="flex items-center gap-2">
            <Button
              plain
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              plain
              disabled={!hasMore}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
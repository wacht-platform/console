import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  PencilIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebhookEndpoint {
  id: number;
  app_id: number;
  url: string;
  description?: string;
  headers?: Record<string, string>;
  is_active: boolean;
  max_retries: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

interface EventSubscription {
  event_name: string;
  filter_rules?: any;
}

const AVAILABLE_EVENTS = [
  { name: "user.created", description: "New user signed up" },
  { name: "user.updated", description: "User profile updated" },
  { name: "user.deleted", description: "User account deleted" },
  { name: "organization.created", description: "New organization created" },
  { name: "workspace.created", description: "New workspace created" },
];

export default function WebhookEndpointsPage() {
  const { deploymentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEndpointUrl, setNewEndpointUrl] = useState("");
  const [newEndpointDescription, setNewEndpointDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Fetch endpoints
  const { data: endpoints, isLoading } = useQuery({
    queryKey: ["webhook-endpoints", deploymentId],
    queryFn: async () => {
      const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/endpoints`);
      return response.data.endpoints as WebhookEndpoint[];
    },
  });

  // Create endpoint mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const subscriptions: EventSubscription[] = selectedEvents.map(event => ({
        event_name: event,
      }));

      const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/endpoints`, {
        url: newEndpointUrl,
        description: newEndpointDescription,
        subscriptions,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Webhook endpoint created successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", deploymentId] });
      setShowCreateDialog(false);
      setNewEndpointUrl("");
      setNewEndpointDescription("");
      setSelectedEvents([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create webhook endpoint");
    },
  });

  // Delete endpoint mutation
  const deleteMutation = useMutation({
    mutationFn: async (endpointId: number) => {
      await apiClient.delete(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}`);
    },
    onSuccess: () => {
      toast.success("Webhook endpoint deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", deploymentId] });
    },
    onError: () => {
      toast.error("Failed to delete webhook endpoint");
    },
  });

  // Toggle endpoint active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ endpointId, isActive }: { endpointId: number; isActive: boolean }) => {
      const response = await apiClient.patch(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}`, {
        is_active: isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Endpoint status updated!");
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", deploymentId] });
    },
    onError: () => {
      toast.error("Failed to update endpoint status");
    },
  });

  const handleEventToggle = (eventName: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventName)
        ? prev.filter(e => e !== eventName)
        : [...prev, eventName]
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/deployments/${deploymentId}/webhooks`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Webhooks
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Webhook Endpoints</h1>
            <p className="text-muted-foreground mt-1">
              Manage endpoints to receive platform events
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {/* Endpoints List */}
      {endpoints && endpoints.length > 0 ? (
        <div className="grid gap-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <GlobeAltIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{endpoint.url}</p>
                        <Badge variant={endpoint.is_active ? "default" : "secondary"}>
                          {endpoint.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {endpoint.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {endpoint.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Max retries: {endpoint.max_retries}</span>
                        <span>Timeout: {endpoint.timeout_seconds}s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActiveMutation.mutate({
                        endpointId: endpoint.id,
                        isActive: !endpoint.is_active
                      })}
                    >
                      {endpoint.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this endpoint?")) {
                          deleteMutation.mutate(endpoint.id);
                        }
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BoltIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No endpoints configured</h3>
              <p className="text-muted-foreground mb-4">
                Add an endpoint to start receiving webhook events
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Endpoint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Endpoint Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Configure an endpoint to receive platform events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://api.example.com/webhooks"
                value={newEndpointUrl}
                onChange={(e) => setNewEndpointUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Production webhook endpoint"
                value={newEndpointDescription}
                onChange={(e) => setNewEndpointDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subscribe to Events</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.name}
                      checked={selectedEvents.includes(event.name)}
                      onCheckedChange={() => handleEventToggle(event.name)}
                    />
                    <label
                      htmlFor={event.name}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      <span className="font-mono">{event.name}</span>
                      <span className="text-muted-foreground ml-2">- {event.description}</span>
                    </label>
                  </div>
                ))}
              </div>
              {selectedEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Select at least one event to subscribe to
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={!newEndpointUrl || selectedEvents.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
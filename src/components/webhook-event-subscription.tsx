import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { WebhookFilterBuilder } from "./webhook-filter-builder";
import { Badge } from "@/components/ui/badge";

export interface EventSubscription {
  event_name: string;
  filter_rules?: any;
}

interface WebhookEventSubscriptionProps {
  event: {
    id: string;
    event_name: string;
    description?: string;
  };
  subscription?: EventSubscription;
  onChange: (subscription: EventSubscription | null) => void;
}

export function WebhookEventSubscription({
  event,
  subscription,
  onChange
}: WebhookEventSubscriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isSubscribed = !!subscription;
  const hasFilters = subscription?.filter_rules != null;

  const handleToggleSubscription = (checked: boolean) => {
    if (checked) {
      onChange({
        event_name: event.event_name,
        filter_rules: null
      });
    } else {
      onChange(null);
      setExpanded(false);
    }
  };

  const handleFilterChange = (filterRules: any) => {
    if (subscription) {
      onChange({
        ...subscription,
        filter_rules: filterRules
      });
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-card">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSubscribed}
            onCheckedChange={handleToggleSubscription}
            className="mt-0.5"
          />

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {event.event_name}
                  </span>
                  {hasFilters && (
                    <Badge color="amber" className="text-xs">
                      <FunnelIcon className="h-3 w-3 mr-1" />
                      Filtered
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.description}
                  </p>
                )}
              </div>

              {isSubscribed && (
                <Button
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs"
                >
                  {expanded ? (
                    <>
                      <ChevronUpIcon className="h-3 w-3 mr-1" />
                      Hide Filters
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-3 w-3 mr-1" />
                      {hasFilters ? 'Edit Filters' : 'Add Filters'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSubscribed && expanded && (
        <div className="px-4 py-3 bg-secondary border-t border-border">
          <WebhookFilterBuilder
            value={subscription.filter_rules}
            onChange={handleFilterChange}
          />
        </div>
      )}
    </div>
  );
}
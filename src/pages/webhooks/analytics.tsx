import { useState } from "react";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Heading, Subheading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { Stat } from "@/components/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "@/components/ui/listbox";
import {
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { webhookApi } from "@/lib/api/webhooks";
import { Spinner } from "@/components/ui/spinner";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function WebhookAnalyticsPage() {
  const { deploymentId } = useParams();
  const [timeRange, setTimeRange] = useState("7d");
  const [interval, setInterval] = useState("hour");

  // Calculate date range based on selection
  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start;
    switch (timeRange) {
      case "24h":
        start = subDays(end, 1);
        break;
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subDays(end, 30);
        break;
      default:
        start = subDays(end, 7);
    }
    return { start: startOfDay(start), end };
  };

  const { start, end } = getDateRange();

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["webhook-analytics", deploymentId, timeRange],
    queryFn: () => webhookApi.getAnalytics(deploymentId!, {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    }),
  });

  // Fetch timeseries data
  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ["webhook-timeseries", deploymentId, timeRange, interval],
    queryFn: () => webhookApi.getTimeseries(deploymentId!, {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      interval: interval as "minute" | "hour" | "day",
    }),
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (analyticsLoading || timeseriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Heading>Webhook Analytics</Heading>
        <div className="flex gap-2">
          <Listbox value={timeRange} onChange={setTimeRange}>
            <ListboxOption value="24h">
              <ListboxLabel>Last 24h</ListboxLabel>
            </ListboxOption>
            <ListboxOption value="7d">
              <ListboxLabel>Last 7 days</ListboxLabel>
            </ListboxOption>
            <ListboxOption value="30d">
              <ListboxLabel>Last 30 days</ListboxLabel>
            </ListboxOption>
          </Listbox>
          <Listbox value={interval} onChange={setInterval}>
            <ListboxOption value="minute">
              <ListboxLabel>Per Minute</ListboxLabel>
            </ListboxOption>
            <ListboxOption value="hour">
              <ListboxLabel>Hourly</ListboxLabel>
            </ListboxOption>
            <ListboxOption value="day">
              <ListboxLabel>Daily</ListboxLabel>
            </ListboxOption>
          </Listbox>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Total Deliveries"
          value={formatNumber(analytics?.total_deliveries || 0)}
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Success Rate"
          value={formatPercentage(analytics?.success_rate || 0)}
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Avg Response Time"
          value={`${analytics?.avg_response_time_ms?.toFixed(0) || 0}ms`}
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Failed Deliveries"
          value={formatNumber(analytics?.failed_deliveries || 0)}
          change=""
          showPeriodText={false}
        />
      </div>

      {/* Performance Overview */}
      <div className="mt-8">
        <Subheading>Performance Overview</Subheading>

        {/* Delivery Timeline Chart */}
        <div className="mt-4 rounded-lg border border-zinc-950/10 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Delivery Timeline</h3>
            <ChartBarIcon className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="h-[300px]">
            {timeseries?.data && timeseries.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeseries.data.map((point: any) => ({
                    ...point,
                    timestamp: interval === "minute"
                      ? format(new Date(point.timestamp), "HH:mm")
                      : interval === "hour"
                        ? format(new Date(point.timestamp), "MMM dd HH:mm")
                        : format(new Date(point.timestamp), "MMM dd"),
                    success_rate: point.success_rate?.toFixed(1) || 0,
                    // Ensure failed_deliveries is 0 when undefined/null
                    failed_deliveries: point.failed_deliveries || 0,
                    successful_deliveries: point.successful_deliveries || 0,
                  }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                  <XAxis
                    dataKey="timestamp"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    domain={[0, 'dataMax']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="successful_deliveries"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#colorSuccess)"
                    name="Successful"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed_deliveries"
                    stackId="1"
                    stroke="#ef4444"
                    fill="url(#colorFailed)"
                    name="Failed"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No data available for the selected period
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response Time Percentiles */}
        {analytics && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">P50 Response Time</p>
              <p className="text-lg font-medium">
                {analytics.p50_response_time_ms?.toFixed(0) || 0}ms
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">P95 Response Time</p>
              <p className="text-lg font-medium">
                {analytics.p95_response_time_ms?.toFixed(0) || 0}ms
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">P99 Response Time</p>
              <p className="text-lg font-medium">
                {analytics.p99_response_time_ms?.toFixed(0) || 0}ms
              </p>
            </div>
          </div>
        )}
      </div>

      <Divider className="my-8" />

      {/* Event Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Events */}
        <div>
          <Subheading>Top Events</Subheading>
          {analytics?.top_events && analytics.top_events.length > 0 ? (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHeader>Rank</TableHeader>
                  <TableHeader>Event</TableHeader>
                  <TableHeader>Count</TableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.top_events.slice(0, 10).map((event, index) => (
                  <TableRow key={event.event_name}>
                    <TableCell>
                      <span className="text-sm font-medium text-zinc-500">#{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{event.event_name}</code>
                    </TableCell>
                    <TableCell>
                      <Badge>{formatNumber(event.count)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-4 text-center py-12 border border-zinc-950/10 dark:border-white/10 rounded-lg">
              <ChartBarIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
              <h3 className="mt-2 text-sm font-normal text-zinc-900 dark:text-zinc-100">
                No events triggered yet
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Event data will appear once webhooks are triggered.
              </p>
            </div>
          )}
        </div>

        {/* Failure Reasons */}
        <div>
          <Subheading>Common Failure Reasons</Subheading>
          {analytics?.failure_reasons && analytics.failure_reasons.length > 0 ? (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHeader>Reason</TableHeader>
                  <TableHeader>Occurrences</TableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.failure_reasons.slice(0, 10).map((reason) => (
                  <TableRow key={reason.reason}>
                    <TableCell>
                      <span className="text-sm">{reason.reason}</span>
                    </TableCell>
                    <TableCell>
                      <Badge color="red">{formatNumber(reason.count)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-4 text-center py-12 border border-zinc-950/10 dark:border-white/10 rounded-lg">
              <ChartBarIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
              <h3 className="mt-2 text-sm font-normal text-zinc-900 dark:text-zinc-100">
                No failures recorded
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                This is good! Your webhooks are performing well.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Endpoint Performance Table */}
      {analytics?.endpoint_performance && analytics.endpoint_performance.length > 0 && (
        <>
          <Divider className="my-8" />
          <div>
            <Subheading>Endpoint Performance</Subheading>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHeader>Endpoint</TableHeader>
                  <TableHeader>Attempts</TableHeader>
                  <TableHeader>Success Rate</TableHeader>
                  <TableHeader>Avg Response</TableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.endpoint_performance.map((endpoint) => (
                  <TableRow key={endpoint.endpoint_id}>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm" title={endpoint.endpoint_url}>
                        {endpoint.endpoint_url}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatNumber(endpoint.total_attempts)}
                    </TableCell>
                    <TableCell>
                      <Badge color={endpoint.success_rate > 95 ? "green" : "red"}>
                        {formatPercentage(endpoint.success_rate)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {endpoint.avg_response_time_ms?.toFixed(0) || 0}ms
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
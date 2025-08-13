import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface WebhookAnalytics {
  total_events: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  filtered_deliveries: number;
  avg_response_time_ms: number;
  p50_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  success_rate: number;
  top_events: Array<{
    event_name: string;
    count: number;
  }>;
  endpoint_performance: Array<{
    endpoint_id: number;
    endpoint_url: string;
    total_attempts: number;
    successful_attempts: number;
    failed_attempts: number;
    avg_response_time_ms: number;
    success_rate: number;
  }>;
  failure_reasons: Array<{
    reason: string;
    count: number;
  }>;
}

interface TimeseriesData {
  timeseries: Array<{
    timestamp: string;
    total_events: number;
    successful_deliveries: number;
    failed_deliveries: number;
    avg_response_time_ms: number;
  }>;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function WebhookAnalyticsPage() {
  const { deploymentId } = useParams();
  const navigate = useNavigate();
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
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });
      
      const response = await apiClient.get(
        `/deployments/${deploymentId}/webhooks/analytics?${params.toString()}`
      );
      return response.data as WebhookAnalytics;
    },
  });

  // Fetch timeseries data
  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ["webhook-timeseries", deploymentId, timeRange, interval],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        interval,
      });
      
      const response = await apiClient.get(
        `/deployments/${deploymentId}/webhooks/analytics/timeseries?${params.toString()}`
      );
      return response.data as TimeseriesData;
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  if (analyticsLoading || timeseriesLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const pieData = analytics ? [
    { name: 'Successful', value: analytics.successful_deliveries },
    { name: 'Failed', value: analytics.failed_deliveries },
    { name: 'Filtered', value: analytics.filtered_deliveries },
  ].filter(d => d.value > 0) : [];

  const chartData = timeseries?.timeseries.map(point => ({
    time: format(new Date(point.timestamp), timeRange === "24h" ? "HH:mm" : "MMM d"),
    success: point.successful_deliveries,
    failed: point.failed_deliveries,
    responseTime: point.avg_response_time_ms,
    total: point.total_events,
  })) || [];

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
            <h1 className="text-3xl font-bold">Webhook Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor webhook performance and delivery metrics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <BoltIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics?.total_deliveries || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics?.total_events || 0)} events triggered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analytics?.success_rate || 0)}
            </div>
            <div className="flex items-center text-xs">
              {analytics && analytics.success_rate > 0.95 ? (
                <>
                  <ArrowTrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">Healthy</span>
                </>
              ) : (
                <>
                  <ArrowTrendingDownIcon className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">Needs attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.avg_response_time_ms?.toFixed(0) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {analytics?.p95_response_time_ms?.toFixed(0) || 0}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics?.failed_deliveries || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics?.filtered_deliveries || 0)} filtered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Timeline</CardTitle>
          <CardDescription>
            Webhook deliveries over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="success" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
                name="Successful"
              />
              <Area 
                type="monotone" 
                dataKey="failed" 
                stackId="1"
                stroke="#ef4444" 
                fill="#ef4444"
                fillOpacity={0.6}
                name="Failed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
            <CardDescription>
              Average response time over period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3b82f6" 
                  name="Response Time (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            {analytics && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">P50</p>
                  <p className="text-sm font-medium">
                    {analytics.p50_response_time_ms?.toFixed(0) || 0}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P95</p>
                  <p className="text-sm font-medium">
                    {analytics.p95_response_time_ms?.toFixed(0) || 0}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P99</p>
                  <p className="text-sm font-medium">
                    {analytics.p99_response_time_ms?.toFixed(0) || 0}ms
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of delivery outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Events</CardTitle>
            <CardDescription>
              Most frequently triggered events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.top_events && analytics.top_events.length > 0 ? (
              <div className="space-y-4">
                {analytics.top_events.slice(0, 5).map((event, index) => (
                  <div key={event.event_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-sm">{event.event_name}</span>
                    </div>
                    <Badge variant="secondary">{formatNumber(event.count)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events triggered yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Failure Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Failure Reasons</CardTitle>
            <CardDescription>
              Common causes of delivery failures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.failure_reasons && analytics.failure_reasons.length > 0 ? (
              <div className="space-y-4">
                {analytics.failure_reasons.slice(0, 5).map((reason) => (
                  <div key={reason.reason} className="flex items-center justify-between">
                    <span className="text-sm">{reason.reason}</span>
                    <Badge variant="destructive">{formatNumber(reason.count)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No failures recorded
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Performance */}
      {analytics?.endpoint_performance && analytics.endpoint_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Performance</CardTitle>
            <CardDescription>
              Individual endpoint delivery metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium text-sm">Endpoint</th>
                    <th className="pb-2 font-medium text-sm text-right">Attempts</th>
                    <th className="pb-2 font-medium text-sm text-right">Success Rate</th>
                    <th className="pb-2 font-medium text-sm text-right">Avg Response</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.endpoint_performance.map((endpoint) => (
                    <tr key={endpoint.endpoint_id} className="border-b">
                      <td className="py-2">
                        <p className="text-sm truncate max-w-xs" title={endpoint.endpoint_url}>
                          {endpoint.endpoint_url}
                        </p>
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-sm">{formatNumber(endpoint.total_attempts)}</span>
                      </td>
                      <td className="py-2 text-right">
                        <Badge 
                          variant={endpoint.success_rate > 0.95 ? "default" : "destructive"}
                          className="ml-auto"
                        >
                          {formatPercentage(endpoint.success_rate)}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-sm">
                          {endpoint.avg_response_time_ms?.toFixed(0) || 0}ms
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
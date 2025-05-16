import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Heading, Subheading } from "../../components/ui/heading";
import { Button } from "../../components/ui/button";
import { Input, InputGroup } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const apiEndpoints = [
  {
    id: "api-1",
    endpoint: "/api/v1/agents",
    description: "Manage AI agents",
    access: "All agents",
  },
  {
    id: "api-2",
    endpoint: "/api/v1/workflows",
    description: "Workflow management",
    access: "Workflow agents only",
  },
  {
    id: "api-3",
    endpoint: "/api/v1/data",
    description: "Data access and storage",
    access: "Restricted",
  },
  {
    id: "api-4",
    endpoint: "/api/v1/users",
    description: "User management",
    access: "Admin agents only",
  },
];

export default function ConfigureMCPPage() {
  return (
    <div>
      <div className="flex flex-col gap-2 mb-2">
        <Heading>MCP Configuration</Heading>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="sm:flex-1">
          <div className="mt-4 flex max-w-md gap-2">
            <InputGroup className="w-64">
              <MagnifyingGlassIcon className="size-4" />
              <Input name="search" placeholder="Search endpoints..." />
            </InputGroup>
          </div>
        </div>
        <Button outline>
          <AdjustmentsHorizontalIcon className="mr-2 h-4 w-4" />
          Advanced Settings
        </Button>
      </div>

      <div className="mt-6">
        <Subheading className="mb-4">API Endpoints</Subheading>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Endpoint</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Access</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiEndpoints.map((api) => (
              <TableRow key={api.id}>
                <TableCell className="font-mono text-sm">
                  {api.endpoint}
                </TableCell>
                <TableCell>{api.description}</TableCell>
                <TableCell>{api.access}</TableCell>
                <TableCell>
                  <Button outline>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        <Subheading className="mb-4">MCP Status</Subheading>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-zinc-50 p-4 border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-700">Uptime</h4>
            <p className="mt-1 text-xl font-semibold">14d 7h 32m</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-4 border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-700">Active Agents</h4>
            <p className="mt-1 text-xl font-semibold">12 / 20</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-4 border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-700">CPU Usage</h4>
            <p className="mt-1 text-xl font-semibold">27%</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-4 border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-700">Memory Usage</h4>
            <p className="mt-1 text-xl font-semibold">3.2 GB</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button outline>Restart MCP</Button>
          <Button outline className="text-red-600 hover:bg-red-50">
            Stop MCP
          </Button>
        </div>
      </div>
    </div>
  );
}

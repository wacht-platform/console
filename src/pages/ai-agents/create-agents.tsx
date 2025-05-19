import {
  PlusIcon,
  CodeBracketSquareIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "../../components/ui/heading";
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

interface Agent {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  lastModified: string;
}

const agents: Agent[] = [
  {
    id: "agent-1",
    name: "Customer Support Agent",
    description: "Handles customer inquiries and support tickets",
    status: "active",
    lastModified: "2023-09-15",
  },
];

export default function CreateAgentsPage() {
  return (
    <div>
      <div className="flex flex-col gap-2 mb-2">
        <Heading>AI Agents</Heading>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="sm:flex-1">
          <div className="mt-4 flex max-w-md gap-2">
            <InputGroup className="w-64">
              <MagnifyingGlassIcon className="size-4" />
              <Input name="search" placeholder="Search agents..." />
            </InputGroup>
          </div>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Last Modified</TableHeader>
              <TableHeader className="w-[100px]">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <CodeBracketSquareIcon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{agent.name}</span>
                  </div>
                </TableCell>
                <TableCell>{agent.description}</TableCell>
                <TableCell>{agent.lastModified}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button outline>Edit</Button>
                    <Button outline className="text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import {
  FireIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";
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
import { Badge } from "../../components/ui/badge";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  agentsCount: number;
  lastRun: string;
}

const workflows: Workflow[] = [
  {
    id: "wf-1",
    name: "Customer Onboarding",
    description: "Automate new customer setup and welcome process",
    status: "active",
    agentsCount: 3,
    lastRun: "2023-09-15 14:30",
  },
  {
    id: "wf-2",
    name: "Data Processing Pipeline",
    description: "Process incoming data from multiple sources",
    status: "active",
    agentsCount: 5,
    lastRun: "2023-09-14 09:45",
  },
  {
    id: "wf-3",
    name: "Support Ticket Triage",
    description: "Categorize and route incoming support tickets",
    status: "draft",
    agentsCount: 2,
    lastRun: "-",
  },
  {
    id: "wf-4",
    name: "Content Approval",
    description: "Review and approve content before publication",
    status: "inactive",
    agentsCount: 4,
    lastRun: "2023-08-30 11:20",
  },
];

export default function WorkflowsPage() {
  const navigate = useNavigate();

  const handleCreateWorkflow = () => {
    navigate("./create-workflow");
  };

  return (
    <div>
      <div className="flex flex-col gap-2 mb-2">
        <Heading>AI Workflows</Heading>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="sm:flex-1">
          <div className="mt-4 flex max-w-md gap-2">
            <InputGroup className="w-64">
              <MagnifyingGlassIcon className="size-4" />
              <Input name="search" placeholder="Search workflows..." />
            </InputGroup>
          </div>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Agents</TableHeader>
              <TableHeader className="w-[150px]">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <FireIcon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{workflow.name}</span>
                  </div>
                </TableCell>
                <TableCell>{workflow.description}</TableCell>
                <TableCell>
                  <Badge>{workflow.status}</Badge>
                </TableCell>
                <TableCell>{workflow.agentsCount} agents</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      outline
                      onClick={() =>
                        navigate(`/ai-agents/create-workflow?id=${workflow.id}`)
                      }
                    >
                      Edit
                    </Button>
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

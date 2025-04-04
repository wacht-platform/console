import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Heading } from "../components/ui/heading";
import { Input, InputGroup } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../components/ui/table";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface Workspace {
	id: string;
	name: string;
	organization_name: string;
	created_at: string;
	status: "active" | "inactive";
}

const DUMMY_DATA: Workspace[] = [
	{
		id: "1",
		name: "Development",
		organization_name: "Acme Corporation",
		created_at: "2024-02-01T10:00:00Z",
		status: "active",
	},
	{
		id: "2",
		name: "Production",
		organization_name: "Acme Corporation",
		created_at: "2024-02-01T10:30:00Z",
		status: "active",
	},
	{
		id: "3",
		name: "Testing",
		organization_name: "TechStart Solutions",
		created_at: "2024-02-15T14:20:00Z",
		status: "active",
	},
	{
		id: "4",
		name: "Staging",
		organization_name: "Global Innovations",
		created_at: "2024-01-20T09:45:00Z",
		status: "inactive",
	},
	{
		id: "5",
		name: "Development",
		organization_name: "Digital Dynamics",
		created_at: "2024-03-01T16:15:00Z",
		status: "active",
	},
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function WorkspacesPage() {
	const [sortKey, setSortKey] = useState<string>("created_at");
	const [sortOrder, setSortOrder] = useState<string>("desc");
	const [page, setPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
	// const offset = (page - 1) * itemsPerPage;

	// TODO: Replace with actual data hook
	const isLoading = false;
	const data = {
		data: DUMMY_DATA,
		has_next: false,
	};

	const hasNextPage = data?.has_next ?? false;
	const hasPrevPage = page > 1;

	const handleSortChange = (value: string) => {
		const [key, order] = value.split("-");
		setSortKey(key);
		setSortOrder(order);
		setPage(1);
	};

	const handleItemsPerPageChange = (value: string) => {
		const newItemsPerPage = Number.parseInt(value, 10);
		setItemsPerPage(newItemsPerPage);
		setPage(1);
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>Workspaces</Heading>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="sm:flex-1">
					<div className="mt-4 flex max-w-md gap-2">
						<div className="flex-1">
							<InputGroup className="w-64">
								<MagnifyingGlassIcon className="size-4" />
								<Input name="search" placeholder="Search workspaces..." />
							</InputGroup>
						</div>
						<div className="flex-1">
							<Select
								name="sort_by"
								onChange={(e) => handleSortChange(e.target.value)}
								value={`${sortKey}-${sortOrder}`}
							>
								<option value="created_at-desc">Sort by date (newest)</option>
								<option value="created_at-asc">Sort by date (oldest)</option>
								<option value="name-asc">Sort by name (A-Z)</option>
								<option value="name-desc">Sort by name (Z-A)</option>
								<option value="organization-asc">
									Sort by organization (A-Z)
								</option>
								<option value="organization-desc">
									Sort by organization (Z-A)
								</option>
							</Select>
						</div>
					</div>
				</div>
				<Button>Create Workspace</Button>
			</div>

			<div className="mt-6">
				<Table>
					<TableHead>
						<TableRow>
							<TableHeader>Workspace</TableHeader>
							<TableHeader>Organization</TableHeader>
							<TableHeader>Created</TableHeader>
							<TableHeader>Status</TableHeader>
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									Loading...
								</TableCell>
							</TableRow>
						) : data?.data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									No workspaces found
								</TableCell>
							</TableRow>
						) : (
							data?.data.map((workspace: Workspace) => (
								<TableRow key={workspace.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<span>{workspace.name}</span>
										</div>
									</TableCell>
									<TableCell>{workspace.organization_name}</TableCell>
									<TableCell>
										{format(new Date(workspace.created_at), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										<span
											className={`px-2 py-1 rounded-full text-xs ${
												workspace.status === "active"
													? "bg-green-100 text-green-800"
													: "bg-yellow-100 text-yellow-800"
											}`}
										>
											{workspace.status}
										</span>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{!isLoading && (data?.data.length ?? 0) > 0 && (
					<div className="flex items-center justify-between text-xs mt-3">
						<div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 flex-1">
							<span>Show</span>
							<Select
								name="items_per_page"
								value={itemsPerPage.toString()}
								onChange={(e) => handleItemsPerPageChange(e.target.value)}
								className="max-w-18"
							>
								{ITEMS_PER_PAGE_OPTIONS.map((value) => (
									<option key={value} value={value.toString()}>
										{value}
									</option>
								))}
							</Select>
							<span>Per page</span>
						</div>

						<div className="flex items-center gap-2">
							<Button
								outline
								disabled={!hasPrevPage}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="p-1"
							>
								<ChevronLeftIcon className="size-5" />
							</Button>
							<Button
								outline
								disabled={!hasNextPage}
								onClick={() => setPage((p) => p + 1)}
								className="p-1"
							>
								<ChevronRightIcon className="size-5" />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

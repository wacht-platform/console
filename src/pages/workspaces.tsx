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
import { useDeploymentWorkspaces } from "@/lib/api/hooks/use-deployment-workspaces";
import { useNavigate } from "react-router";
import { SkeletonTableRows } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function WorkspacesPage() {
	const navigate = useNavigate();
	const [sortKey, setSortKey] = useState<string>("created_at");
	const [sortOrder, setSortOrder] = useState<string>("desc");
	const [page, setPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
	const { data, isLoading } = useDeploymentWorkspaces();

	const hasNextPage = data?.has_more ?? false;
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
			</div>

			<div className="mt-6">
				<Table>
					<TableHead>
						<TableRow>
							<TableHeader>Workspace</TableHeader>
							<TableHeader>Organization</TableHeader>
							<TableHeader>Members</TableHeader>
							<TableHeader>Created</TableHeader>
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							<SkeletonTableRows
								rows={itemsPerPage}
								columns={4}
								className="hover:bg-zinc-50"
							/>
						) : data?.data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									No workspaces found
								</TableCell>
							</TableRow>
						) : (
							data?.data.map((workspace) => (
								<TableRow
									key={workspace.id}
									className="cursor-pointer hover:bg-gray-50"
									onClick={() => navigate(`/workspace/${workspace.id}`)}
								>
									<TableCell>
										<div className="flex items-center gap-3">
											<span>{workspace.name}</span>
										</div>
									</TableCell>
									<TableCell>{workspace.organization_name}</TableCell>
									<TableCell>{workspace.member_count}</TableCell>
									<TableCell>
										{format(new Date(workspace.created_at), "MMM d, yyyy")}
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

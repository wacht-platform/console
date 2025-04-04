import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Heading } from "@/components/ui/heading";
import { Input, InputGroup } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { NavigationTabs, type Tab } from "@/components/navigation-tabs";
import { useUsers } from "@/lib/api/hooks/use-users";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const tabs: Tab[] = [
	{ name: "All Users", href: "/users", current: true },
	{ name: "Invited", href: "/users/invited", current: false },
	{ name: "Disabled", href: "/users/disabled", current: false },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function UsersPage() {
	const [sortKey, setSortKey] = useState<string>("created_at");
	const [sortOrder, setSortOrder] = useState<string>("desc");
	const [page, setPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
	const offset = (page - 1) * itemsPerPage;

	const { data, isLoading } = useUsers({
		offset,
		sort_key: sortKey,
		sort_order: sortOrder,
		limit: itemsPerPage,
	});

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
				<Heading>Users</Heading>
				<NavigationTabs tabs={tabs} />
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="sm:flex-1">
					<div className="mt-4 flex max-w-md gap-2">
						<div className="flex-1">
							<InputGroup className="w-64">
								<MagnifyingGlassIcon className="size-4" />
								<Input name="search" placeholder="Search users&hellip;" />
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
								<option value="username-asc">Sort by username (A-Z)</option>
								<option value="username-desc">Sort by username (Z-A)</option>
								<option value="email-asc">Sort by email (A-Z)</option>
								<option value="email-desc">Sort by email (Z-A)</option>
								<option value="phone_number-asc">Sort by phone (A-Z)</option>
								<option value="phone_number-desc">Sort by phone (Z-A)</option>
							</Select>
						</div>
					</div>
				</div>
				<Button>Create User</Button>
			</div>

			<div className="mt-6">
				<Table>
					<TableHead>
						<TableRow>
							<TableHeader>User</TableHeader>
							<TableHeader>Email</TableHeader>
							<TableHeader>Username</TableHeader>
							<TableHeader>Phone number</TableHeader>
							<TableHeader>Joined</TableHeader>
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center">
									Loading...
								</TableCell>
							</TableRow>
						) : data?.data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center">
									No users found
								</TableCell>
							</TableRow>
						) : (
							data?.data.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar
												className="size-5"
												initials={`${user.first_name[0]}${user.last_name[0]}`}
											/>
											<span>{`${user.first_name} ${user.last_name}`}</span>
										</div>
									</TableCell>
									<TableCell>
										{user.primary_email_address || (
											<span className="text-zinc-400">-</span>
										)}
									</TableCell>
									<TableCell>
										{user.username || <span className="text-zinc-400">-</span>}
									</TableCell>
									<TableCell>
										{user.primary_phone_number || (
											<span className="text-zinc-400">-</span>
										)}
									</TableCell>
									<TableCell>
										{format(new Date(user.created_at), "MMM d, yyyy")}
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

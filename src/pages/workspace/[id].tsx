import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { useWorkspaceDetails } from "@/lib/api/hooks/use-workspace-details";
import { useWorkspaceMembers } from "@/lib/api/hooks/use-workspace-members";
import {
    useDeleteWorkspace,
    useUpdateWorkspace,
} from "@/lib/api/hooks/use-workspace-mutations";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/app-table";
import { CodeEditor } from "@/components/code-editor";
import { DeleteConfirmationDialog } from "@/components/organizations/DeleteConfirmationDialog";
import { EditWorkspaceDialog } from "@/components/workspaces/EditWorkspaceDialog";
import { CreateWorkspaceRoleDialog } from "@/components/workspaces/CreateWorkspaceRoleDialog";
import { EditWorkspaceRoleDialog } from "@/components/workspaces/EditWorkspaceRoleDialog";
import { AddWorkspaceMemberDialog } from "@/components/workspaces/AddWorkspaceMemberDialog";
import { EditWorkspaceMemberDialog } from "@/components/workspaces/EditWorkspaceMemberDialog";
import { useDeleteWorkspaceRole } from "@/lib/api/hooks/use-workspace-role-mutations";
import { useRemoveWorkspaceMember } from "@/lib/api/hooks/use-workspace-mutations";
import { SegmentManager } from "@/components/segments/SegmentManager";
import { Tag } from "@/components/ui/tag";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { WorkspaceRole } from "@/types/organization";
import { toast } from "sonner";

import {
    PencilSquareIcon,
    TrashIcon,
    UsersIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function WorkspaceDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const workspaceId = id;

    // Tab state
    const [activeTab, setActiveTab] = useState("members");

    // Member search and sort state
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 500);
    const [sortKey, setSortKey] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const {
        data: workspace,
        isLoading,
        error,
    } = useWorkspaceDetails(workspaceId);

    const deleteWorkspace = useDeleteWorkspace();
    const removeMember = useRemoveWorkspaceMember();
    const deleteWorkspaceRole = useDeleteWorkspaceRole();
    const updateWorkspace = useUpdateWorkspace();

    // Fetch members only when Members tab is active
    const { data: membersData, isLoading: membersLoading } =
        useWorkspaceMembers(
            workspaceId,
            page * pageSize,
            pageSize,
            debouncedSearch,
            sortKey,
            sortOrder,
            activeTab === "members",
        );

    // Metadata editor states
    const [publicMetadata, setPublicMetadata] = useState<string>("");
    const [privateMetadata, setPrivateMetadata] = useState<string>("");
    const [isEditingPublicMetadata, setIsEditingPublicMetadata] =
        useState(false);
    const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
        useState(false);

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Role management states
    const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
    const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
    const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(
        null,
    );

    // Member management states
    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
    const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    // Initialize metadata when workspace data loads
    useEffect(() => {
        if (workspace) {
            setPublicMetadata(
                workspace.public_metadata
                    ? JSON.stringify(workspace.public_metadata, null, 2)
                    : "{}",
            );
            setPrivateMetadata(
                workspace.private_metadata
                    ? JSON.stringify(workspace.private_metadata, null, 2)
                    : "{}",
            );
        }
    }, [workspace]);

    if (isLoading) {
        return <InlineLoader />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 dark:text-red-400">
                        {error.message || "Failed to load workspace details"}
                    </p>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p>Workspace not found</p>
                </div>
            </div>
        );
    }

    const handleSavePublicMetadata = async () => {
        try {
            // Parse the JSON to validate it
            const parsedMetadata = JSON.parse(publicMetadata);

            // Create FormData with the updated public metadata
            const formData = new FormData();
            formData.append("public_metadata", JSON.stringify(parsedMetadata));

            await updateWorkspace.mutateAsync({
                workspaceId: workspaceId!,
                data: formData,
            });

            setIsEditingPublicMetadata(false);
            toast.success("Public metadata updated successfully");
        } catch (error) {
            if (error instanceof SyntaxError) {
                toast.error("Invalid JSON format in public metadata");
            } else {
                console.error("Failed to save public metadata:", error);
                toast.error("Failed to update public metadata");
            }
        }
    };

    const handleSavePrivateMetadata = async () => {
        try {
            // Parse the JSON to validate it
            const parsedMetadata = JSON.parse(privateMetadata);

            // Create FormData with the updated private metadata
            const formData = new FormData();
            formData.append("private_metadata", JSON.stringify(parsedMetadata));

            await updateWorkspace.mutateAsync({
                workspaceId: workspaceId!,
                data: formData,
            });

            setIsEditingPrivateMetadata(false);
            toast.success("Private metadata updated successfully");
        } catch (error) {
            if (error instanceof SyntaxError) {
                toast.error("Invalid JSON format in private metadata");
            } else {
                console.error("Failed to save private metadata:", error);
                toast.error("Failed to update private metadata");
            }
        }
    };

    // Role management handlers
    const handleEditRole = (role: WorkspaceRole) => {
        setSelectedRole(role);
        setEditRoleModalOpen(true);
    };

    const handleDeleteRole = (role: WorkspaceRole) => {
        setSelectedRole(role);
        setDeleteRoleModalOpen(true);
    };

    const handleConfirmDeleteRole = async () => {
        if (!selectedRole || !workspaceId) return;

        try {
            await deleteWorkspaceRole.mutateAsync({
                workspaceId,
                roleId: selectedRole.id,
            });
            setDeleteRoleModalOpen(false);
            setSelectedRole(null);
        } catch (error) {
            console.error("Failed to delete role:", error);
        }
    };

    const handleCancelPublicMetadata = () => {
        setPublicMetadata(
            workspace?.public_metadata
                ? JSON.stringify(workspace.public_metadata, null, 2)
                : "{}",
        );
        setIsEditingPublicMetadata(false);
    };

    const handleCancelPrivateMetadata = () => {
        setPrivateMetadata(
            workspace?.private_metadata
                ? JSON.stringify(workspace.private_metadata, null, 2)
                : "{}",
        );
        setIsEditingPrivateMetadata(false);
    };

    const handleDeleteWorkspace = async () => {
        if (!workspace) return;

        try {
            await deleteWorkspace.mutateAsync(workspace.id);
            navigate("../organizations");
        } catch (error) {
            console.error("Failed to delete workspace:", error);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Avatar className="size-14">
                        <AvatarImage
                            src={workspace.image_url}
                            alt={workspace.name}
                            className="object-cover"
                        />
                        <AvatarFallback>
                            {workspace.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="mb-1.5 truncate font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Workspace · {workspace.id}
                        </div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">
                            {workspace.name}
                        </h1>
                        {workspace.description && (
                            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                                {workspace.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setEditModalOpen(true)}
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit workspace
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setDeleteModalOpen(true)}
                    >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left rail — facts */}
                <div className="lg:col-span-4">
                    <div className="rounded-lg border border-border bg-card p-5">
                        <DefItem label="Workspace ID" value={workspace.id} mono />
                        <DefItem
                            label="Parent org"
                            value={workspace.organization_name || "—"}
                        />
                        <DefItem
                            label="Created"
                            value={
                                workspace.created_at
                                    ? format(
                                          new Date(workspace.created_at),
                                          "MMM d, yyyy",
                                      )
                                    : "—"
                            }
                        />
                        <DefItem
                            label="Last updated"
                            value={
                                workspace.updated_at
                                    ? format(
                                          new Date(workspace.updated_at),
                                          "MMM d, yyyy",
                                      )
                                    : "—"
                            }
                        />
                        <hr className="my-3 border-border" />
                        <DefItem
                            label="Members"
                            value={workspace.member_count ?? 0}
                        />
                        <DefItem
                            label="Roles"
                            value={workspace.roles?.length ?? 0}
                        />
                        <hr className="my-3 border-border" />
                        <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                            Segments
                        </div>
                        <SegmentManager
                            targetId={workspace.id}
                            targetType="workspace"
                            currentSegments={workspace.segments}
                        />
                    </div>
                </div>

                {/* Right — tabs */}
                <div className="min-w-0 lg:col-span-8">
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList variant="pill">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="members">
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-medium text-foreground">
                                Workspace Members
                            </h3>
                            <Button onClick={() => setAddMemberModalOpen(true)}>
                                Add Member
                            </Button>
                        </div>

                        {membersLoading ? (
                            <InlineLoader />
                        ) : !membersData?.data ||
                          membersData.data.length === 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-32 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                                                <UsersIcon className="size-8 text-muted-foreground" />
                                                <p className="text-sm font-medium text-foreground">
                                                    {search
                                                        ? "No members found"
                                                        : "No members added yet"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search."
                                                        : "Add your first member from the button above."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        ) : (
                            <>
                                {/* Search and Sort Controls */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <InputGroup>
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/4 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                name="search"
                                                placeholder="Search members..."
                                                className="pl-8"
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
                                                    setPage(0); // Reset to first page on search
                                                }}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div className="w-full sm:w-64">
                                        <Listbox
                                            value={`${sortKey}-${sortOrder}`}
                                            onChange={(value) => {
                                                const [key, order] =
                                                    value.split("-");
                                                setSortKey(key);
                                                setSortOrder(order);
                                            }}
                                        >
                                            <ListboxOption value="created_at-desc">
                                                <ListboxLabel>
                                                    Date Joined (Newest)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="created_at-asc">
                                                <ListboxLabel>
                                                    Date Joined (Oldest)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="first_name-asc">
                                                <ListboxLabel>
                                                    First Name (A-Z)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="first_name-desc">
                                                <ListboxLabel>
                                                    First Name (Z-A)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="last_name-asc">
                                                <ListboxLabel>
                                                    Last Name (A-Z)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="last_name-desc">
                                                <ListboxLabel>
                                                    Last Name (Z-A)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="email-asc">
                                                <ListboxLabel>
                                                    Email (A-Z)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="email-desc">
                                                <ListboxLabel>
                                                    Email (Z-A)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="username-asc">
                                                <ListboxLabel>
                                                    Username (A-Z)
                                                </ListboxLabel>
                                            </ListboxOption>
                                            <ListboxOption value="username-desc">
                                                <ListboxLabel>
                                                    Username (Z-A)
                                                </ListboxLabel>
                                            </ListboxOption>
                                        </Listbox>
                                    </div>
                                </div>

                                <div className="contents">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Roles</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {membersData.data.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="text-sm">
                                                                {
                                                                    member.first_name
                                                                }{" "}
                                                                {
                                                                    member.last_name
                                                                }
                                                            </div>
                                                            {member.username && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    @
                                                                    {
                                                                        member.username
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {
                                                            member.primary_email_address
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {member.roles &&
                                                        member.roles.length >
                                                            0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {member.roles.map(
                                                                    (role) => (
                                                                        <Tag
                                                                            key={
                                                                                role.id
                                                                            }
                                                                        >
                                                                            {
                                                                                role.name
                                                                            }
                                                                        </Tag>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                No roles
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="text-muted-foreground hover:text-foreground"
                                                                onClick={() => {
                                                                    setSelectedMember(
                                                                        member,
                                                                    );
                                                                    setEditMemberModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <PencilSquareIcon className="size-4" />
                                                                <span className="sr-only">
                                                                    Edit
                                                                </span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                onClick={() => {
                                                                    setSelectedMember(
                                                                        member,
                                                                    );
                                                                    setDeleteMemberModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <TrashIcon className="size-4" />
                                                                <span className="sr-only">
                                                                    Remove
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-6 border-border">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {page * pageSize + 1} to{" "}
                                        {Math.min(
                                            (page + 1) * pageSize,
                                            page * pageSize +
                                                membersData.data.length,
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={page === 0}
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.max(0, p - 1),
                                                )
                                            }
                                            className="p-2"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={!membersData.has_more}
                                            onClick={() =>
                                                setPage((p) => p + 1)
                                            }
                                            className="p-2"
                                        >
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="roles">
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-medium text-foreground">
                                Workspace Roles
                            </h3>
                            {workspace.roles && workspace.roles.length > 0 && (
                                <Button
                                    onClick={() => setCreateRoleModalOpen(true)}
                                >
                                    Create Role
                                </Button>
                            )}
                        </div>
                        {!workspace.roles || workspace.roles.length === 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableEmptyRow
                                        colSpan={3}
                                        icon={
                                            <UsersIcon className="h-8 w-8 text-muted-foreground/50" />
                                        }
                                        title="No custom roles created yet"
                                        description="Create custom roles to manage permissions within your workspace."
                                        action={
                                            <Button
                                                onClick={() =>
                                                    setCreateRoleModalOpen(true)
                                                }
                                            >
                                                Create Role
                                            </Button>
                                        }
                                    />
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="contents">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Permissions</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workspace.roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground">
                                                            {role.name}
                                                        </span>
                                                        {role.is_deployment_level && (
                                                            <Tag>default</Tag>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-secondary-foreground">
                                                        {
                                                            role.permissions
                                                                .length
                                                        }{" "}
                                                        permission
                                                        {role.permissions
                                                            .length === 1
                                                            ? ""
                                                            : "s"}
                                                    </span>
                                                    {role.is_deployment_level && (
                                                        <span className="ml-2 text-muted-foreground">
                                                            · locked
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {!role.is_deployment_level && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() =>
                                                                        handleEditRole(
                                                                            role,
                                                                        )
                                                                    }
                                                                >
                                                                    <PencilSquareIcon className="size-4" />
                                                                    <span className="sr-only">
                                                                        Edit
                                                                    </span>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() =>
                                                                        handleDeleteRole(
                                                                            role,
                                                                        )
                                                                    }
                                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <TrashIcon className="size-4" />
                                                                    <span className="sr-only">
                                                                        Delete
                                                                    </span>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="metadata">
                    <div className="px-4 py-6 space-y-8">
                        {/* Public Metadata */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-foreground">
                                    Public Metadata
                                </h3>
                                <div className="flex gap-2">
                                    {isEditingPublicMetadata ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={
                                                    handleCancelPublicMetadata
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={
                                                    handleSavePublicMetadata
                                                }
                                            >
                                                Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setIsEditingPublicMetadata(true)
                                            }
                                        >
                                            <PencilSquareIcon className="mr-2 h-4 w-4" />
                                            Edit Public Metadata
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="border border-border rounded-lg overflow-hidden">
                                <CodeEditor
                                    language="json"
                                    minHeight={200}
                                    readOnly={!isEditingPublicMetadata}
                                    value={publicMetadata}
                                    onChange={(value) =>
                                        setPublicMetadata(value || "{}")
                                    }
                                />
                            </div>
                        </div>

                        {/* Private Metadata */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-foreground">
                                    Private Metadata
                                </h3>
                                <div className="flex gap-2">
                                    {isEditingPrivateMetadata ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={
                                                    handleCancelPrivateMetadata
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={
                                                    handleSavePrivateMetadata
                                                }
                                            >
                                                Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setIsEditingPrivateMetadata(
                                                    true,
                                                )
                                            }
                                        >
                                            <PencilSquareIcon className="mr-2 h-4 w-4" />
                                            Edit Private Metadata
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="border border-border rounded-lg overflow-hidden">
                                <CodeEditor
                                    language="json"
                                    minHeight={200}
                                    readOnly={!isEditingPrivateMetadata}
                                    value={privateMetadata}
                                    onChange={(value) =>
                                        setPrivateMetadata(value || "{}")
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
                </div>
            </div>

            {/* Edit Workspace Dialog */}
            <EditWorkspaceDialog
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                workspace={workspace}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteWorkspace}
                title="Delete Workspace"
                description={`Are you sure you want to delete "${workspace?.name}"? This action cannot be undone and will remove all associated data including members and roles.`}
                confirmText="Delete Workspace"
                isLoading={deleteWorkspace.isPending}
            />

            {/* Create Workspace Role Dialog */}
            {workspaceId && (
                <CreateWorkspaceRoleDialog
                    isOpen={createRoleModalOpen}
                    onClose={() => setCreateRoleModalOpen(false)}
                    workspaceId={workspaceId}
                />
            )}

            {/* Edit Workspace Role Dialog */}
            {workspaceId && selectedRole && (
                <EditWorkspaceRoleDialog
                    isOpen={editRoleModalOpen}
                    onClose={() => setEditRoleModalOpen(false)}
                    workspaceId={workspaceId}
                    role={selectedRole}
                />
            )}

            {/* Delete Role Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteRoleModalOpen}
                onClose={() => setDeleteRoleModalOpen(false)}
                onConfirm={handleConfirmDeleteRole}
                title="Delete Role"
                description={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
                confirmText="Delete Role"
                isLoading={deleteWorkspaceRole.isPending}
            />

            {/* Add Workspace Member Dialog */}
            {workspaceId && (
                <AddWorkspaceMemberDialog
                    isOpen={addMemberModalOpen}
                    onClose={() => setAddMemberModalOpen(false)}
                    workspaceId={workspaceId}
                    availableRoles={workspace?.roles || []}
                />
            )}

            {/* Edit Workspace Member Dialog */}
            {workspaceId && selectedMember && (
                <EditWorkspaceMemberDialog
                    isOpen={editMemberModalOpen}
                    onClose={() => {
                        setEditMemberModalOpen(false);
                        setSelectedMember(null);
                    }}
                    workspaceId={workspaceId}
                    member={selectedMember}
                    availableRoles={workspace?.roles || []}
                />
            )}

            {/* Delete Member Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteMemberModalOpen}
                onClose={() => {
                    setDeleteMemberModalOpen(false);
                    setSelectedMember(null);
                }}
                onConfirm={async () => {
                    if (selectedMember && workspaceId) {
                        try {
                            await removeMember.mutateAsync({
                                workspaceId,
                                membershipId: selectedMember.id,
                            });
                            setDeleteMemberModalOpen(false);
                            setSelectedMember(null);
                        } catch (error) {
                            console.error("Failed to remove member:", error);
                        }
                    }
                }}
                title="Remove Member"
                description={`Are you sure you want to remove ${selectedMember?.first_name} ${selectedMember?.last_name} from this workspace? This action cannot be undone.`}
                confirmText="Remove Member"
                isLoading={removeMember.isPending}
            />
        </div>
    );
}

function DefItem({
    label,
    value,
    mono = false,
    muted = false,
}: {
    label: string;
    value: string | number;
    mono?: boolean;
    muted?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                {label}
            </span>
            <span
                className={
                    "truncate text-right text-xs " +
                    (mono ? "font-mono " : "") +
                    (muted ? "text-muted-foreground" : "text-foreground")
                }
            >
                {value}
            </span>
        </div>
    );
}

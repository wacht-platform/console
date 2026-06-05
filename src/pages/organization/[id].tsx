import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { useOrganizationDetails } from "@/lib/api/hooks/use-organization-details";
import { useOrganizationMembers } from "@/lib/api/hooks/use-organization-members";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
    useUpdateOrganization,
    useDeleteOrganization,
    useRemoveOrganizationMember,
    useDeleteOrganizationRole,
} from "@/lib/api/hooks/use-organization-mutations";
import { useDeleteWorkspace } from "@/lib/api/hooks/use-workspace-mutations";
import { SegmentManager } from "@/components/segments/SegmentManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { CreateWorkspaceModal } from "@/components/workspaces/CreateWorkspaceModal";
import { EditWorkspaceDialog } from "@/components/workspaces/EditWorkspaceDialog";
import { EditOrganizationDialog } from "@/components/organizations/EditOrganizationDialog";
import { AddMemberDialog } from "@/components/organizations/AddMemberDialog";
import { EditMemberDialog } from "@/components/organizations/EditMemberDialog";
import { CreateRoleDialog } from "@/components/organizations/CreateRoleDialog";
import { EditRoleDialog } from "@/components/organizations/EditRoleDialog";
import { DeleteConfirmationDialog } from "@/components/organizations/DeleteConfirmationDialog";
import { InlineLoader } from "@/components/ui/loading-screen";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import type {
    OrganizationMemberDetails,
    OrganizationRole,
    OrganizationRoleSimple,
    Workspace,
} from "@/types/organization";
import { EnterpriseSSO } from "@/components/organizations/EnterpriseSSO";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

import {
    PencilSquareIcon,
    TrashIcon,
    UsersIcon,
    BuildingOffice2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Tag } from "@/components/ui/tag";

// Helper function to convert OrganizationRole to OrganizationRoleSimple
const convertToSimpleRoles = (
    roles: OrganizationRole[],
): OrganizationRoleSimple[] => {
    return roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        is_deployment_level: role.is_deployment_level,
    }));
};

export default function OrganizationDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const organizationId = id;
    const { deploymentSettings } = useCurrentDeployemnt();

    // Tab state - needs to be declared before use
    const [activeTab, setActiveTab] = useState(0);

    // Member search and sort state
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 500);
    const [sortKey, setSortKey] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const {
        data: organization,
        isLoading,
        error,
    } = useOrganizationDetails(organizationId);

    const { data: membersData, isLoading: membersLoading } =
        useOrganizationMembers(
            organizationId,
            page * pageSize,
            pageSize,
            debouncedSearch,
            sortKey,
            sortOrder,
            activeTab === 1,
        );

    const [publicMetadata, setPublicMetadata] = useState<string>("");
    const [privateMetadata, setPrivateMetadata] = useState<string>("");
    const [isEditingPublicMetadata, setIsEditingPublicMetadata] =
        useState(false);
    const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
        useState(false);

    const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] =
        useState(false);
    const [editWorkspaceModalOpen, setEditWorkspaceModalOpen] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] =
        useState<Workspace | null>(null);

    const [editOrganizationModalOpen, setEditOrganizationModalOpen] =
        useState(false);
    const [deleteOrganizationModalOpen, setDeleteOrganizationModalOpen] =
        useState(false);

    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] =
        useState<OrganizationMemberDetails | null>(null);
    const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);

    const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
    const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(
        null,
    );
    const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);

    const [deleteWorkspaceModalOpen, setDeleteWorkspaceModalOpen] =
        useState(false);

    const updateOrganization = useUpdateOrganization();
    const deleteOrganization = useDeleteOrganization();
    const removeMember = useRemoveOrganizationMember();
    const deleteRole = useDeleteOrganizationRole();
    const deleteWorkspace = useDeleteWorkspace();

    useEffect(() => {
        if (organization) {
            setPublicMetadata(
                organization.public_metadata
                    ? JSON.stringify(organization.public_metadata, null, 2)
                    : "{}",
            );
            setPrivateMetadata(
                organization.private_metadata
                    ? JSON.stringify(organization.private_metadata, null, 2)
                    : "{}",
            );
        }
    }, [organization]);

    if (isLoading) {
        return <InlineLoader />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500">
                        {error.message || "Failed to load organization details"}
                    </p>
                </div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p>Organization not found</p>
                </div>
            </div>
        );
    }

    const handleSavePublicMetadata = async () => {
        try {
            await updateOrganization.mutateAsync({
                organizationId: organization.id,
                data: {
                    public_metadata: JSON.parse(publicMetadata),
                },
            });
            setIsEditingPublicMetadata(false);
            toast.success("Public metadata updated successfully");
        } catch (error) {
            console.error("Failed to save public metadata:", error);
            toast.error(
                "Failed to update public metadata. Please check the JSON format.",
            );
        }
    };

    const handleSavePrivateMetadata = async () => {
        try {
            await updateOrganization.mutateAsync({
                organizationId: organization.id,
                data: {
                    private_metadata: JSON.parse(privateMetadata),
                },
            });
            setIsEditingPrivateMetadata(false);
            toast.success("Private metadata updated successfully");
        } catch (error) {
            console.error("Failed to save private metadata:", error);
            toast.error(
                "Failed to update private metadata. Please check the JSON format.",
            );
        }
    };

    const handleCancelPublicMetadata = () => {
        setPublicMetadata(
            organization?.public_metadata
                ? JSON.stringify(organization.public_metadata, null, 2)
                : "{}",
        );
        setIsEditingPublicMetadata(false);
    };

    const handleCancelPrivateMetadata = () => {
        setPrivateMetadata(
            organization?.private_metadata
                ? JSON.stringify(organization.private_metadata, null, 2)
                : "{}",
        );
        setIsEditingPrivateMetadata(false);
    };

    // Organization handlers
    const handleDeleteOrganization = async () => {
        try {
            await deleteOrganization.mutateAsync(organization.id);
            navigate("../organizations");
        } catch (error) {
            console.error("Failed to delete organization:", error);
        }
    };

    // Member handlers
    const handleEditMember = (member: OrganizationMemberDetails) => {
        setSelectedMember(member);
        setEditMemberModalOpen(true);
    };

    const handleDeleteMember = (member: OrganizationMemberDetails) => {
        setSelectedMember(member);
        setDeleteMemberModalOpen(true);
    };

    const handleConfirmDeleteMember = async () => {
        if (!selectedMember) return;

        try {
            await removeMember.mutateAsync({
                organizationId: organization.id,
                membershipId: selectedMember.id,
            });
            setDeleteMemberModalOpen(false);
            setSelectedMember(null);
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    // Role handlers
    const handleEditRole = (role: OrganizationRole) => {
        setSelectedRole(role);
        setEditRoleModalOpen(true);
    };

    const handleDeleteRole = (role: OrganizationRole) => {
        setSelectedRole(role);
        setDeleteRoleModalOpen(true);
    };

    const handleConfirmDeleteRole = async () => {
        if (!selectedRole) return;

        try {
            await deleteRole.mutateAsync({
                organizationId: organization.id,
                roleId: selectedRole.id,
            });
            setDeleteRoleModalOpen(false);
            setSelectedRole(null);
        } catch (error) {
            console.error("Failed to delete role:", error);
        }
    };

    // Workspace handlers
    const handleEditWorkspace = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setEditWorkspaceModalOpen(true);
    };

    const handleDeleteWorkspace = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setDeleteWorkspaceModalOpen(true);
    };

    const handleConfirmDeleteWorkspace = async () => {
        if (!selectedWorkspace) return;

        try {
            await deleteWorkspace.mutateAsync(selectedWorkspace.id);
            setDeleteWorkspaceModalOpen(false);
            setSelectedWorkspace(null);
        } catch (error) {
            console.error("Failed to delete workspace:", error);
        }
    };

    return (
        <div>
            <CreateWorkspaceModal
                isOpen={createWorkspaceModalOpen}
                onClose={() => setCreateWorkspaceModalOpen(false)}
                organizationId={organization.id}
                organizationName={organization.name}
            />

            {selectedWorkspace && (
                <EditWorkspaceDialog
                    isOpen={editWorkspaceModalOpen}
                    onClose={() => {
                        setEditWorkspaceModalOpen(false);
                        setSelectedWorkspace(null);
                    }}
                    workspace={selectedWorkspace}
                />
            )}

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Avatar className="size-14">
                        <AvatarImage
                            src={organization.image_url}
                            alt={`${organization.name} logo`}
                        />
                        <AvatarFallback>
                            {organization.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="mb-1.5 truncate font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Organization · {organization.id}
                        </div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">
                            {organization.name}
                        </h1>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditOrganizationModalOpen(true)}
                        className="gap-1.5"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit organization
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setDeleteOrganizationModalOpen(true)}
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
                        <DefItem
                            label="Organization ID"
                            value={organization.id}
                            mono
                        />
                        <DefItem
                            label="Created"
                            value={
                                organization.created_at
                                    ? format(
                                          new Date(organization.created_at),
                                          "MMM d, yyyy",
                                      )
                                    : "—"
                            }
                        />
                        <DefItem
                            label="Last updated"
                            value={
                                organization.updated_at
                                    ? format(
                                          new Date(organization.updated_at),
                                          "MMM d, yyyy",
                                      )
                                    : "—"
                            }
                        />
                        <hr className="my-3 border-border" />
                        <DefItem
                            label="Members"
                            value={organization.member_count ?? 0}
                        />
                        <DefItem
                            label="Roles"
                            value={organization.roles?.length || 0}
                        />
                        <DefItem
                            label="Workspaces"
                            value={organization.workspaces?.length || 0}
                        />
                        <hr className="my-3 border-border" />
                        <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                            Segments
                        </div>
                        <SegmentManager
                            targetId={organization.id}
                            targetType="organization"
                            currentSegments={organization.segments}
                        />
                    </div>
                </div>

                {/* Right — tabs */}
                <div className="min-w-0 lg:col-span-8">
            {/* Tabs */}
            <Tabs
                defaultValue="members"
                onValueChange={(value) => {
                    const tabIndex = [
                        "members",
                        "roles",
                        "workspaces",
                        "metadata",
                        "sso",
                    ].indexOf(value);
                    setActiveTab(tabIndex);
                }}
            >
                <TabsList variant="pill">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    {deploymentSettings?.b2b_settings
                        ?.enterprise_sso_enabled && (
                        <TabsTrigger value="sso">SSO</TabsTrigger>
                    )}
                </TabsList>


                <TabsContent value="members">
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-medium text-foreground">
                                Organization Members
                            </h3>
                            <Button
                                onClick={() => setAddMemberModalOpen(true)}
                            >
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
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/4 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            name="search"
                                            placeholder="Search members..."
                                            className="pl-9"
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(0); // Reset to first page on search
                                            }}
                                        />
                                    </div>
                                    <div className="w-full sm:w-64">
                                        <Listbox
                                            className="w-full"
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
                                                            {member.first_name}{" "}
                                                            {member.last_name}
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
                                                    member.roles.length > 0 ? (
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
                                                            onClick={() =>
                                                                handleEditMember(
                                                                    member,
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
                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() =>
                                                                handleDeleteMember(
                                                                    member,
                                                                )
                                                            }
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

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-6">
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
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-medium text-foreground">
                                Organization Roles
                            </h3>
                            {organization.roles &&
                                organization.roles.length > 0 && (
                                    <Button
                                        onClick={() =>
                                            setCreateRoleModalOpen(true)
                                        }
                                    >
                                        Create Role
                                    </Button>
                                )}
                        </div>

                        {!organization.roles ||
                        organization.roles.length === 0 ? (
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
                                        description="Create custom roles to manage permissions within your organization."
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
                                    {organization.roles.map((role) => (
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
                                                    {role.permissions.length}{" "}
                                                    permission
                                                    {role.permissions.length ===
                                                    1
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
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    handleDeleteRole(
                                                                        role,
                                                                    )
                                                                }
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
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="workspaces">
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-medium text-foreground">
                                Organization Workspaces
                            </h3>
                            <div className="flex gap-2">
                                {organization.workspaces &&
                                    organization.workspaces.length > 0 && (
                                        <Button
                                            onClick={() =>
                                                setCreateWorkspaceModalOpen(
                                                    true,
                                                )
                                            }
                                        >
                                            Create Workspace
                                        </Button>
                                    )}
                            </div>
                        </div>

                        {!organization.workspaces ||
                        organization.workspaces.length === 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Workspace</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Segments</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableEmptyRow
                                        colSpan={4}
                                        icon={
                                            <BuildingOffice2Icon className="h-8 w-8 text-muted-foreground/50" />
                                        }
                                        title="No workspaces created yet"
                                        description="Create workspaces to organize your projects and teams."
                                        action={
                                            <Button
                                                onClick={() =>
                                                    setCreateWorkspaceModalOpen(
                                                        true,
                                                    )
                                                }
                                            >
                                                Create Workspace
                                            </Button>
                                        }
                                    />
                                </TableBody>
                            </Table>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Workspace</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Segments</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organization.workspaces.map(
                                        (workspace) => (
                                            <TableRow
                                                key={workspace.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() =>
                                                    navigate(
                                                        `../workspace/${workspace.id}`,
                                                    )
                                                }
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-8">
                                                            <AvatarImage
                                                                src={
                                                                    workspace.image_url
                                                                }
                                                                alt={`${workspace.name} logo`}
                                                            />
                                                            <AvatarFallback>
                                                                {workspace.name
                                                                    .substring(
                                                                        0,
                                                                        2,
                                                                    )
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium text-foreground">
                                                            {workspace.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-secondary-foreground tabular-nums">
                                                    {workspace.member_count}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {workspace.segments
                                                            ?.length ? (
                                                            workspace.segments.map(
                                                                (s) => (
                                                                    <Tag
                                                                        key={
                                                                            s.id
                                                                        }
                                                                    >
                                                                        {s.name}
                                                                    </Tag>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditWorkspace(
                                                                    workspace,
                                                                );
                                                            }}
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            <span className="sr-only">
                                                                Edit
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteWorkspace(
                                                                    workspace,
                                                                );
                                                            }}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                            <span className="sr-only">
                                                                Delete
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>

                {deploymentSettings?.b2b_settings?.enterprise_sso_enabled && (
                    <TabsContent value="sso">
                        <EnterpriseSSO organizationId={organization.id} />
                    </TabsContent>
                )}

                <TabsContent value="metadata">
                    <div className="pt-4 space-y-8">
                        {/* Public Metadata */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-medium text-foreground">
                                    Public Metadata
                                </h3>
                                {!isEditingPublicMetadata ? (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setIsEditingPublicMetadata(true)
                                        }
                                    >
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelPublicMetadata}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSavePublicMetadata}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg overflow-hidden border border-border bg-card">
                                <CodeEditor
                                    language="json"
                                    minHeight={120}
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-medium text-foreground">
                                    Private Metadata
                                </h3>
                                {!isEditingPrivateMetadata ? (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setIsEditingPrivateMetadata(true)
                                        }
                                    >
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={
                                                handleCancelPrivateMetadata
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSavePrivateMetadata}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg overflow-hidden border border-border bg-card">
                                <CodeEditor
                                    language="json"
                                    minHeight={120}
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

            {/* All Modals */}
            <EditOrganizationDialog
                isOpen={editOrganizationModalOpen}
                onClose={() => setEditOrganizationModalOpen(false)}
                organization={organization}
            />

            <DeleteConfirmationDialog
                isOpen={deleteOrganizationModalOpen}
                onClose={() => setDeleteOrganizationModalOpen(false)}
                onConfirm={handleDeleteOrganization}
                title="Delete Organization"
                description={`Are you sure you want to delete "${organization?.name}"? This action cannot be undone and will remove all associated data.`}
                confirmText="Delete Organization"
                isLoading={deleteOrganization.isPending}
            />

            <AddMemberDialog
                isOpen={addMemberModalOpen}
                onClose={() => setAddMemberModalOpen(false)}
                organizationId={organization?.id || ""}
                availableRoles={convertToSimpleRoles(organization?.roles || [])}
            />

            {selectedMember && (
                <EditMemberDialog
                    isOpen={editMemberModalOpen}
                    onClose={() => setEditMemberModalOpen(false)}
                    organizationId={organization?.id || ""}
                    member={selectedMember}
                    availableRoles={convertToSimpleRoles(
                        organization?.roles || [],
                    )}
                />
            )}

            <DeleteConfirmationDialog
                isOpen={deleteMemberModalOpen}
                onClose={() => setDeleteMemberModalOpen(false)}
                onConfirm={handleConfirmDeleteMember}
                title="Remove Member"
                description={`Are you sure you want to remove ${selectedMember?.first_name} ${selectedMember?.last_name} from this organization?`}
                confirmText="Remove Member"
                isLoading={removeMember.isPending}
            />

            <CreateRoleDialog
                isOpen={createRoleModalOpen}
                onClose={() => setCreateRoleModalOpen(false)}
                organizationId={organization?.id || ""}
            />

            {selectedRole && (
                <EditRoleDialog
                    isOpen={editRoleModalOpen}
                    onClose={() => setEditMemberModalOpen(false)}
                    organizationId={organization?.id || ""}
                    role={selectedRole}
                />
            )}

            <DeleteConfirmationDialog
                isOpen={deleteRoleModalOpen}
                onClose={() => setDeleteRoleModalOpen(false)}
                onConfirm={handleConfirmDeleteRole}
                title="Delete Role"
                description={`Are you sure you want to delete the "${selectedRole?.name}" role? This action cannot be undone.`}
                confirmText="Delete Role"
                isLoading={deleteRole.isPending}
            />

            <DeleteConfirmationDialog
                isOpen={deleteWorkspaceModalOpen}
                onClose={() => setDeleteWorkspaceModalOpen(false)}
                onConfirm={handleConfirmDeleteWorkspace}
                title="Delete Workspace"
                description={`Are you sure you want to delete the "${selectedWorkspace?.name}" workspace? This action cannot be undone and will remove all associated data including members and roles.`}
                confirmText="Delete Workspace"
                isLoading={deleteWorkspace.isPending}
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

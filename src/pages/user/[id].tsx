import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUserDetails } from "@/lib/api/hooks/use-user-details";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { InlineLoader } from "@/components/ui/loading-screen";
import type { UserEmailAddress, UserPhoneNumber } from "@/types/user";
import {
  useAddUserEmail,
  useUpdateUserEmail,
  useDeleteUserEmail,
  useMakeUserEmailPrimary,
} from "@/lib/api/hooks/use-user-email-mutations";
import {
  useAddUserPhone,
  useUpdateUserPhone,
  useDeleteUserPhone,
  useMakeUserPhonePrimary,
} from "@/lib/api/hooks/use-user-phone-mutations";
import { useDeleteUserSocialConnection } from "@/lib/api/hooks/use-user-social-mutations";
import {
  useDeleteUser,
  useImpersonateUser,
  useRemoveUserPassword,
} from "@/lib/api/hooks/use-deployment-user-mutations";
import {
  useUserOrganizationMemberships,
  useUserWorkspaceMemberships,
} from "@/lib/api/hooks/use-user-memberships";
import {
  useUserSignins,
  useRevokeUserSignin,
  useRevokeAllUserSignins,
} from "@/lib/api/hooks/use-user-sessions";
import {
  useUserPasskeys,
  useRenameUserPasskey,
  useDeleteUserPasskey,
} from "@/lib/api/hooks/use-user-passkeys";
import {
  useDeleteUserAuthenticator,
  useRegenerateBackupCodes,
} from "@/lib/api/hooks/use-user-mfa-mutations";
import { useUpdateUser } from "@/lib/api/hooks/use-update-user";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/app-table";
import { Switch } from "@/components/ui/switch"
import { CodeEditor } from "@/components/code-editor";
import { SegmentManager } from "@/components/segments/SegmentManager";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlayCircleIcon
} from "@heroicons/react/24/outline";

// Modals
import { AddEmailModal } from "@/components/modals/add-email-modal";
import { AddPhoneModal } from "@/components/modals/add-phone-modal";
import { EditEmailModal } from "@/components/modals/edit-email-modal";
import { EditPhoneModal } from "@/components/modals/edit-phone-modal";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { BackupCodesModal } from "@/components/modals/backup-codes-modal";

export default function UserDetailsPage() {
  const { id, projectId, deploymentId } = useParams();
  const userId = id || "";
  const navigate = useNavigate();
  const { selectedDeployment } = useProjects();
  const { data: user, isLoading, error } = useUserDetails(userId);

  // Mutations
  const { mutateAsync: updateUser } = useUpdateUser(userId);
  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: impersonateUser, isPending: isImpersonating } = useImpersonateUser();

  const { mutateAsync: addEmail } = useAddUserEmail(userId);
  const { mutateAsync: updateEmail } = useUpdateUserEmail(userId);
  const { mutateAsync: deleteEmail } = useDeleteUserEmail(userId);
  const { mutateAsync: makeEmailPrimary } = useMakeUserEmailPrimary(userId);

  const { mutateAsync: addPhone } = useAddUserPhone(userId);
  const { mutateAsync: updatePhone } = useUpdateUserPhone(userId);
  const { mutateAsync: deletePhone } = useDeleteUserPhone(userId);
  const { mutateAsync: makePhonePrimary } = useMakeUserPhonePrimary(userId);

  const { mutateAsync: deleteSocialConnection } = useDeleteUserSocialConnection(userId);
  const { mutateAsync: removePassword } = useRemoveUserPassword(userId);

  // Memberships
  const { data: orgMemberships } = useUserOrganizationMemberships(userId);
  const { data: workspaceMemberships } = useUserWorkspaceMemberships(userId);

  // Sessions
  const { data: signins } = useUserSignins(userId);
  const { mutateAsync: revokeSignin } = useRevokeUserSignin(userId);
  const { mutateAsync: revokeAllSignins, isPending: isRevokingAll } =
    useRevokeAllUserSignins(userId);

  // Passkeys
  const { data: passkeys } = useUserPasskeys(userId);
  const { mutateAsync: renamePasskey } = useRenameUserPasskey(userId);
  const { mutateAsync: deletePasskey } = useDeleteUserPasskey(userId);

  // MFA
  const { mutateAsync: deleteAuthenticator } = useDeleteUserAuthenticator(userId);
  const { mutateAsync: regenerateBackupCodes, isPending: isRegeneratingCodes } =
    useRegenerateBackupCodes(userId);

  // Modal states
  const [activeTab, setActiveTab] = useState("emails"); // Default to emails as Overview is removed
  const [addEmailModalOpen, setAddEmailModalOpen] = useState(false);
  const [addPhoneModalOpen, setAddPhoneModalOpen] = useState(false);
  const [editEmailModalOpen, setEditEmailModalOpen] = useState(false);
  const [editPhoneModalOpen, setEditPhoneModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<UserEmailAddress | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<UserPhoneNumber | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; type: string; name: string } | null>(null);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [renamingPasskeyId, setRenamingPasskeyId] = useState<string | null>(null);
  const [renamingPasskeyValue, setRenamingPasskeyValue] = useState("");

  // Metadata states
  const [publicMetadata, setPublicMetadata] = useState<string>("");
  const [privateMetadata, setPrivateMetadata] = useState<string>("");
  const [isEditingPublicMetadata, setIsEditingPublicMetadata] = useState(false);
  const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] = useState(false);

  useEffect(() => {
    if (user) {
      setPublicMetadata(user.public_metadata ? JSON.stringify(user.public_metadata, null, 2) : "{}");
      setPrivateMetadata(user.private_metadata ? JSON.stringify(user.private_metadata, null, 2) : "{}");
    }
  }, [user]);

  if (isLoading) {
    return <InlineLoader />;
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error?.message || "User not found"}</p>
      </div>
    );
  }

  const handleDeleteItem = (itemId: string, type: string, name: string) => {
    setDeleteItem({ id: itemId, type, name });
    setConfirmationDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === "email") await deleteEmail(deleteItem.id);
      if (deleteItem.type === "phone") await deletePhone(deleteItem.id);
      if (deleteItem.type === "social") await deleteSocialConnection(deleteItem.id);
      if (deleteItem.type === "passkey") await deletePasskey(deleteItem.id);
      if (deleteItem.type === "signin") await revokeSignin(deleteItem.id);
      if (deleteItem.type === "authenticator") await deleteAuthenticator();
      if (deleteItem.type === "password") await removePassword();
      if (deleteItem.type === "all-sessions") await revokeAllSignins();
      if (deleteItem.type === "user") {
        await deleteUser(deleteItem.id);
        navigate(`/project/${projectId}/deployment/${deploymentId}/users`);
      }
      toast.success(`${deleteItem.type} action complete`);
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    }
    setDeleteItem(null);
    setConfirmationDialogOpen(false);
  };

  const handleMakeEmailPrimary = async (emailId: string) => {
    try {
      await makeEmailPrimary(emailId);
      toast.success("Email marked as primary");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to make primary");
    }
  };

  const handleMakePhonePrimary = async (phoneId: string) => {
    try {
      await makePhonePrimary(phoneId);
      toast.success("Phone marked as primary");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to make primary");
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const res = await regenerateBackupCodes();
      setNewBackupCodes(res.backup_codes);
    } catch (e) {
      console.error(e);
      toast.error("Failed to regenerate backup codes");
    }
  };

  const handleRenamePasskey = async (passkeyId: string) => {
    const trimmed = renamingPasskeyValue.trim();
    if (!trimmed) return;
    try {
      await renamePasskey({ passkeyId, name: trimmed });
      setRenamingPasskeyId(null);
      setRenamingPasskeyValue("");
      toast.success("Passkey renamed");
    } catch (e) {
      toast.error("Failed to rename passkey");
    }
  };

  const handleImpersonate = async () => {
    try {
      const response = await impersonateUser(userId);
      if (response?.ticket) {
        const redirectUrl = `https://${selectedDeployment?.frontend_host}/sign-in?ticket=${response.ticket}`;
        window.open(redirectUrl, "_blank");
      } else {
        toast.error("Failed to get impersonation ticket");
      }
    } catch (error) {
      toast.error("Failed to impersonate user");
    }
  };

  const handleToggleStatus = async () => {
    try {
      await updateUser({ disabled: !user.disabled });
      toast.success(user.disabled ? "User enabled" : "User disabled");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveMetadata = async (type: "public" | "private") => {
    try {
      const value = type === "public" ? publicMetadata : privateMetadata;
      const parsed = JSON.parse(value);
      await updateUser({ [type === "public" ? "public_metadata" : "private_metadata"]: parsed });
      if (type === "public") setIsEditingPublicMetadata(false);
      else setIsEditingPrivateMetadata(false);
      toast.success("Metadata updated");
    } catch (e) {
      toast.error("Invalid JSON");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <div className="col-span-1 lg:col-span-4 border-r border-zinc-200 dark:border-zinc-800 pr-8">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-24 w-24 mb-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <AvatarImage src={user.profile_picture_url} />
              <AvatarFallback className="text-2xl bg-zinc-50 dark:bg-zinc-900 font-normal text-zinc-400">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-normal text-zinc-900 dark:text-zinc-50 tracking-tight">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-normal">
              Joined {format(new Date(user.created_at), "MMM d, yyyy")}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-xs font-normal text-zinc-500 uppercase tracking-wider">Email Addresses</span>
                <span className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{user.email_addresses?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-xs font-normal text-zinc-500 uppercase tracking-wider">Phone Numbers</span>
                <span className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{user.phone_numbers?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-xs font-normal text-zinc-500 uppercase tracking-wider">Social Connections</span>
                <span className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{user.social_connections?.length || 0}</span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500 font-normal">User Status</span>
                <Switch checked={!user.disabled} onCheckedChange={handleToggleStatus} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500 font-normal">Password</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2 font-normal" onClick={() => setChangePasswordModalOpen(true)}>
                    {user.has_password ? "Change" : "Set"}
                  </Button>
                  {user.has_password && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 font-normal text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteItem(userId, "password", "the password")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500 font-normal">2FA Protection</span>
                {user.has_otp ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-zinc-200 dark:text-zinc-800" />
                )}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-normal text-zinc-500 uppercase tracking-wider mb-2">Segments</h3>
              <SegmentManager targetId={user.id} targetType="user" currentSegments={user.segments} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-1 lg:col-span-8 min-w-0">
          <div className="flex justify-end gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={handleImpersonate} disabled={isImpersonating} className="h-8 gap-1.5 font-normal">
              <PlayCircleIcon className="h-4 w-4" /> Impersonate
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditProfileModalOpen(true)} className="h-8 gap-1.5 font-normal">
              <PencilIcon className="h-4 w-4" /> Edit Profile
            </Button>
            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(user.id, "user", `${user.first_name} ${user.last_name}`)}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-normal text-zinc-900 dark:text-zinc-50">{user.first_name} {user.last_name}</h1>
            <p className="text-sm text-zinc-500 mt-1">User ID: {user.id}</p>
          </div>

          <div className="mb-0 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-500 font-normal uppercase tracking-wider">Primary Email</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{user.primary_email_address || "-"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-500 font-normal uppercase tracking-wider">Primary Phone</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{user.primary_phone_number || "Not provided"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-500 font-normal uppercase tracking-wider">Username</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{user.username || "Not provided"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-500 font-normal uppercase tracking-wider">Created</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-normal">{format(new Date(user.created_at), "MMM d, yyyy")}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-500 font-normal uppercase tracking-wider">2FA Policy</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-normal capitalize">{user.second_factor_policy || "None"}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
            <TabsList>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="phones">Phones</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="mfa">MFA</TabsTrigger>
              <TabsTrigger value="passkeys">Passkeys</TabsTrigger>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider">Email addresses</h3>
                <Button size="sm" variant="outline" onClick={() => setAddEmailModalOpen(true)} className="h-8 font-normal">Add Email</Button>
              </div>
              {!user.email_addresses?.length ? (
                <EmptyState
                  title="No emails"
                  description="Add an email address."
                  onAction={() => setAddEmailModalOpen(true)}
                  icon={<EnvelopeIcon className="h-10 w-10 text-zinc-200" />}
                />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Email</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Added</TableHead>
                        <TableHead className="text-right font-normal text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.email_addresses.map(email => (
                        <TableRow key={email.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-normal">{email.email}</span>
                              {email.id === user.primary_email_address_id && (
                                <Badge variant="secondary" className="font-normal text-xs h-4 bg-zinc-100/80 dark:bg-zinc-800/80 border-none text-zinc-500">Primary</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={email.verified ? "text-green-600 dark:text-green-500 border-green-500/20 bg-green-500/5 font-normal py-0" : "text-zinc-500 border-zinc-500/20 bg-zinc-500/5 font-normal py-0"}>
                              {email.verified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-xs font-normal">{format(new Date(email.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {email.verified && email.id !== user.primary_email_address_id && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs font-normal" onClick={() => handleMakeEmailPrimary(email.id)}>
                                  Make primary
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedEmail(email); setEditEmailModalOpen(true); }}>
                                <PencilIcon className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(email.id, "email", email.email)}>
                                <TrashIcon className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="phones" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider">Phone numbers</h3>
                <Button size="sm" variant="outline" onClick={() => setAddPhoneModalOpen(true)} className="h-8 font-normal">Add Phone</Button>
              </div>
              {!user.phone_numbers?.length ? (
                <EmptyState
                  title="No phone numbers"
                  description="Add a phone number."
                  onAction={() => setAddPhoneModalOpen(true)}
                  icon={<PhoneIcon className="h-10 w-10 text-zinc-200" />}
                />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Number</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Added</TableHead>
                        <TableHead className="text-right font-normal text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.phone_numbers.map(phone => (
                        <TableRow key={phone.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-normal">{phone.phone_number}</span>
                              {phone.id === user.primary_phone_number_id && (
                                <Badge variant="secondary" className="font-normal text-xs h-4 bg-zinc-100/80 dark:bg-zinc-800/80 border-none text-zinc-500">Primary</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={phone.verified ? "text-green-600 dark:text-green-500 border-green-500/20 bg-green-500/5 font-normal py-0" : "text-zinc-500 border-zinc-500/20 bg-zinc-500/5 font-normal py-0"}>
                              {phone.verified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-xs font-normal">{format(new Date(phone.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {phone.verified && phone.id !== user.primary_phone_number_id && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs font-normal" onClick={() => handleMakePhonePrimary(phone.id)}>
                                  Make primary
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPhone(phone); setEditPhoneModalOpen(true); }}>
                                <PencilIcon className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(phone.id, "phone", phone.phone_number)}>
                                <TrashIcon className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sessions" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider">Active sign-ins</h3>
                {!!signins?.length && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(userId, "all-sessions", "all active sign-ins")}
                    disabled={isRevokingAll}
                    className="h-8 font-normal"
                  >
                    Revoke all
                  </Button>
                )}
              </div>
              {!signins?.length ? (
                <EmptyState
                  title="No active sign-ins"
                  description="This user has no live sessions."
                  icon={<XCircleIcon className="h-10 w-10 text-zinc-200" />}
                />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Device</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Location</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Last active</TableHead>
                        <TableHead className="text-right font-normal text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signins.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm font-normal">
                            {s.browser || s.device || "Unknown"}
                            <div className="text-xs text-zinc-500">{s.ip_address || "—"}</div>
                          </TableCell>
                          <TableCell className="text-sm font-normal">
                            {[s.city, s.region, s.country].filter(Boolean).join(", ") || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500 font-normal">
                            {format(new Date(s.last_active_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-normal text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteItem(s.id, "signin", "this sign-in")}
                            >
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mfa" className="mt-4">
              <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider mb-4">Two-factor methods</h3>
              <div className="max-h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                    <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                      <TableHead className="font-normal text-xs uppercase tracking-wider">Factor</TableHead>
                      <TableHead className="font-normal text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-normal text-xs uppercase tracking-wider">Details</TableHead>
                      <TableHead className="text-right font-normal text-xs uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm font-normal">Authenticator app (TOTP)</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.has_otp
                              ? "text-green-600 dark:text-green-500 border-green-500/20 bg-green-500/5 font-normal py-0"
                              : "text-zinc-500 border-zinc-500/20 bg-zinc-500/5 font-normal py-0"
                          }
                        >
                          {user.has_otp ? "Enrolled" : "Not enrolled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 font-normal">
                        {user.has_otp
                          ? "Authenticator app linked. Removing forces re-enrollment."
                          : "Enrollment happens from the user's account portal."}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.has_otp && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-normal text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteItem(userId, "authenticator", "TOTP authenticator")}
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm font-normal">Backup codes</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.has_backup_codes
                              ? "text-green-600 dark:text-green-500 border-green-500/20 bg-green-500/5 font-normal py-0"
                              : "text-zinc-500 border-zinc-500/20 bg-zinc-500/5 font-normal py-0"
                          }
                        >
                          {user.has_backup_codes ? "Active" : "Not generated"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 font-normal">
                        {user.has_backup_codes
                          ? "Regenerating invalidates any unused codes."
                          : "Single-use fallback codes for when the authenticator is unavailable."}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-normal"
                          onClick={handleRegenerateBackupCodes}
                          disabled={isRegeneratingCodes}
                        >
                          {user.has_backup_codes ? "Regenerate" : "Generate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="passkeys" className="mt-4">
              <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider mb-4">Registered passkeys</h3>
              {!passkeys?.length ? (
                <EmptyState
                  title="No passkeys"
                  description="User has not registered any passkeys."
                  icon={<XCircleIcon className="h-10 w-10 text-zinc-200" />}
                />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Name</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Device</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Last used</TableHead>
                        <TableHead className="text-right font-normal text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {passkeys.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            {renamingPasskeyId === p.id ? (
                              <div className="flex gap-1">
                                <input
                                  className="flex h-7 w-full rounded-md border border-zinc-200 bg-transparent px-2 text-sm dark:border-zinc-800"
                                  value={renamingPasskeyValue}
                                  onChange={(e) => setRenamingPasskeyValue(e.target.value)}
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" className="h-7 text-xs font-normal" onClick={() => handleRenamePasskey(p.id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs font-normal" onClick={() => setRenamingPasskeyId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm font-normal">{p.name}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500 font-normal">{p.device_type || "—"}</TableCell>
                          <TableCell className="text-xs text-zinc-500 font-normal">
                            {p.last_used_at ? format(new Date(p.last_used_at), "MMM d, yyyy") : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setRenamingPasskeyId(p.id);
                                  setRenamingPasskeyValue(p.name);
                                }}
                              >
                                <PencilIcon className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteItem(p.id, "passkey", p.name)}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="organizations" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider">Organization memberships</h3>
                <span className="text-xs text-zinc-500">{orgMemberships?.length ?? 0} total</span>
              </div>
              {!orgMemberships?.length ? (
                <EmptyState title="No organizations" description="User is not a member of any organization." icon={<XCircleIcon className="h-10 w-10 text-zinc-200" />} />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Organization</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Roles</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgMemberships.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm font-normal">{m.organization.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {m.roles.length === 0 ? (
                                <span className="text-xs text-zinc-500">—</span>
                              ) : (
                                m.roles.map((r) => (
                                  <Badge key={r.id} variant="secondary" className="font-normal text-xs">
                                    {r.name}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500 font-normal">{format(new Date(m.created_at), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="workspaces" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-normal text-zinc-500 uppercase tracking-wider">Workspace memberships</h3>
                <span className="text-xs text-zinc-500">{workspaceMemberships?.length ?? 0} total</span>
              </div>
              {!workspaceMemberships?.length ? (
                <EmptyState title="No workspaces" description="User is not a member of any workspace." icon={<XCircleIcon className="h-10 w-10 text-zinc-200" />} />
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10">
                      <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Workspace</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Roles</TableHead>
                        <TableHead className="font-normal text-xs uppercase tracking-wider">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workspaceMemberships.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm font-normal">{m.workspace.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {m.roles.length === 0 ? (
                                <span className="text-xs text-zinc-500">—</span>
                              ) : (
                                m.roles.map((r) => (
                                  <Badge key={r.id} variant="secondary" className="font-normal text-xs">
                                    {r.name}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500 font-normal">{format(new Date(m.created_at), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="mt-4">
              <div className="space-y-6 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-normal text-zinc-500 uppercase tracking-widest">Public Metadata</h3>
                    {!isEditingPublicMetadata ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingPublicMetadata(true)} className="h-7 text-xs font-normal">Edit JSON</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingPublicMetadata(false)} className="h-7 text-xs font-normal">Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveMetadata("public")} className="h-7 text-xs font-normal">Save</Button>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <CodeEditor
                      language="json"
                      minHeight={180}
                      readOnly={!isEditingPublicMetadata}
                      value={publicMetadata}
                      onChange={(value) => setPublicMetadata(value || "{}")}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-normal text-zinc-500 uppercase tracking-widest">Private Metadata</h3>
                    {!isEditingPrivateMetadata ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingPrivateMetadata(true)} className="h-7 text-xs font-normal">Edit JSON</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingPrivateMetadata(false)} className="h-7 text-xs font-normal">Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveMetadata("private")} className="h-7 text-xs font-normal">Save</Button>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <CodeEditor
                      language="json"
                      minHeight={180}
                      readOnly={!isEditingPrivateMetadata}
                      value={privateMetadata}
                      onChange={(value) => setPrivateMetadata(value || "{}")}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals - FIXED PROP NAMES */}
      <AddEmailModal
        isOpen={addEmailModalOpen}
        onClose={() => setAddEmailModalOpen(false)}
        onSubmit={async (email, verified, isPrimary) => {
          await addEmail({ email, verified, is_primary: isPrimary });
          setAddEmailModalOpen(false);
        }}
      />
      <AddPhoneModal
        isOpen={addPhoneModalOpen}
        onClose={() => setAddPhoneModalOpen(false)}
        onSubmit={async (phoneNumber, countryCode, verified, isPrimary) => {
          await addPhone({ phone_number: phoneNumber, country_code: countryCode, verified, is_primary: isPrimary });
          setAddPhoneModalOpen(false);
        }}
      />
      {selectedEmail && (
        <EditEmailModal
          isOpen={editEmailModalOpen}
          onClose={() => setEditEmailModalOpen(false)}
          emailData={selectedEmail}
          userData={user}
          onSubmit={async (id, email, verified, isPrimary) => {
            await updateEmail({ emailId: id, data: { email, verified, is_primary: isPrimary } });
            setEditEmailModalOpen(false);
          }}
        />
      )}
      {selectedPhone && (
        <EditPhoneModal
          isOpen={editPhoneModalOpen}
          onClose={() => setEditPhoneModalOpen(false)}
          phoneData={selectedPhone}
          userData={user}
          onSubmit={async (id, phoneNumber, verified, isPrimary) => {
            await updatePhone({ phoneId: id, data: { phone_number: phoneNumber, verified, is_primary: isPrimary } });
            setEditPhoneModalOpen(false);
          }}
        />
      )}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        profileData={user as any}
        userId={userId}
      />
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        userId={userId}
        hasPassword={user.has_password}
      />
      <ConfirmationDialog
        isOpen={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          deleteItem?.type === "all-sessions"
            ? "Revoke all sign-ins"
            : deleteItem?.type === "signin"
              ? "Revoke sign-in"
              : deleteItem?.type === "passkey"
                ? `Delete passkey ${deleteItem.name}`
                : deleteItem?.type === "authenticator"
                  ? "Remove TOTP authenticator"
                  : deleteItem?.type === "password"
                    ? "Remove password"
                    : `Delete ${deleteItem?.type ?? "item"}`
        }
        message={
          deleteItem?.type === "password"
            ? "The user will no longer be able to sign in with a password. They'll need another factor."
            : deleteItem?.type === "all-sessions"
              ? "Every active sign-in for this user will be revoked. The user will need to sign in again on all devices."
              : deleteItem?.type === "authenticator"
                ? "The user's TOTP factor will be removed. They'll need to re-enroll to use 2FA."
                : "This action cannot be undone."
        }
        confirmText={
          deleteItem?.type === "all-sessions" || deleteItem?.type === "signin"
            ? "Revoke"
            : deleteItem?.type === "password"
              ? "Remove"
              : "Delete"
        }
        cancelText="Cancel"
      />
      {newBackupCodes && (
        <BackupCodesModal
          isOpen={!!newBackupCodes}
          onClose={() => setNewBackupCodes(null)}
          codes={newBackupCodes}
        />
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUserDetails } from "@/lib/api/hooks/use-user-details";
import { useUpdateUser } from "@/lib/api/hooks/use-update-user";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { Spinner } from "@/components/ui/spinner";
import type { UserEmailAddress, UserPhoneNumber } from "@/types/user";
import {
  useAddUserEmail,
  useUpdateUserEmail,
  useDeleteUserEmail,
} from "@/lib/api/hooks/use-user-email-mutations";
import {
  useAddUserPhone,
  useUpdateUserPhone,
  useDeleteUserPhone,
} from "@/lib/api/hooks/use-user-phone-mutations";
import { useDeleteUserSocialConnection } from "@/lib/api/hooks/use-user-social-mutations";
import { useDeleteUser } from "@/lib/api/hooks/use-deployment-user-mutations";
import { Button } from "@/components/ui/button";
import { getCountryFlag } from "@/lib/constants/countries";

import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import { AddEmailModal } from "@/components/modals/add-email-modal";
import { AddPhoneModal } from "@/components/modals/add-phone-modal";
import { EditEmailModal } from "@/components/modals/edit-email-modal";
import { EditPhoneModal } from "@/components/modals/edit-phone-modal";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import Editor from "@monaco-editor/react";

import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function UserDetailsPage() {

  const { id, projectId, deploymentId } = useParams();
  const userId = id;
  const navigate = useNavigate();
  const isDarkMode = useDarkMode();
  const { data: user, isLoading, error } = useUserDetails(userId);
  const { mutateAsync: updateUser } = useUpdateUser(userId || "");

  // Email mutations
  const { mutateAsync: addEmail } = useAddUserEmail(userId || "");
  const { mutateAsync: updateEmail } = useUpdateUserEmail(userId || "");
  const { mutateAsync: deleteEmail } = useDeleteUserEmail(userId || "");

  // Phone mutations
  const { mutateAsync: addPhone } = useAddUserPhone(userId || "");
  const { mutateAsync: updatePhone } = useUpdateUserPhone(userId || "");
  const { mutateAsync: deletePhone } = useDeleteUserPhone(userId || "");

  // Social connection mutations
  const { mutateAsync: deleteSocialConnection } = useDeleteUserSocialConnection(
    userId || ""
  );

  // User deletion mutation
  const { mutateAsync: deleteUser } = useDeleteUser();

  // Modal states
  const [addEmailModalOpen, setAddEmailModalOpen] = useState(false);
  const [addPhoneModalOpen, setAddPhoneModalOpen] = useState(false);
  const [editEmailModalOpen, setEditEmailModalOpen] = useState(false);
  const [editPhoneModalOpen, setEditPhoneModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  // Data for edit modals
  const [selectedEmail, setSelectedEmail] = useState<UserEmailAddress | null>(
    null
  );
  const [selectedPhone, setSelectedPhone] = useState<UserPhoneNumber | null>(
    null
  );
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    type: string;
    name: string;
  } | null>(null);

  // Metadata editor states
  const [publicMetadata, setPublicMetadata] = useState<string>("");
  const [privateMetadata, setPrivateMetadata] = useState<string>("");
  const [isEditingPublicMetadata, setIsEditingPublicMetadata] = useState(false);
  const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
    useState(false);

  // Initialize metadata when user data loads
  useEffect(() => {
    if (user) {
      setPublicMetadata(
        user.public_metadata
          ? JSON.stringify(user.public_metadata, null, 2)
          : "{}"
      );
      setPrivateMetadata(
        user.private_metadata
          ? JSON.stringify(user.private_metadata, null, 2)
          : "{}"
      );
    }
  }, [user]);



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading user details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">
            {error.message || "Failed to load user details"}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  const handleEditEmail = (emailId: string) => {
    const email = user?.email_addresses?.find((e) => e.id === emailId);
    if (email) {
      setSelectedEmail(email);
      setEditEmailModalOpen(true);
    }
  };

  const handleEditPhone = (phoneId: string) => {
    const phone = user?.phone_numbers?.find((p) => p.id === phoneId);
    if (phone) {
      setSelectedPhone(phone);
      setEditPhoneModalOpen(true);
    }
  };

  const handleDeleteItem = (itemId: string, type: string, name: string) => {
    setDeleteItem({ id: itemId, type, name });
    setConfirmationDialogOpen(true);
  };

  const handleAddEmail = async (
    email: string,
    verified: boolean,
    isPrimary: boolean
  ) => {
    try {
      await addEmail({
        email,
        verified,
        is_primary: isPrimary,
      });
      console.log("Email added successfully");
    } catch (error) {
      console.error("Failed to add email:", error);
    }
  };

  const handleAddPhone = async (
    phoneNumber: string,
    countryCode: string,
    verified: boolean,
    isPrimary: boolean
  ) => {
    try {
      await addPhone({
        phone_number: phoneNumber,
        country_code: countryCode,
        verified,
        is_primary: isPrimary,
      });
      console.log("Phone added successfully");
    } catch (error) {
      console.error("Failed to add phone:", error);
    }
  };

  const handleUpdateEmail = async (
    id: string,
    email: string,
    verified: boolean,
    isPrimary: boolean
  ) => {
    try {
      await updateEmail({
        emailId: id,
        data: {
          email,
          verified,
          is_primary: isPrimary,
        },
      });
      console.log("Email updated successfully");
    } catch (error) {
      console.error("Failed to update email:", error);
    }
  };

  const handleUpdatePhone = async (
    id: string,
    phoneNumber: string,
    verified: boolean,
    isPrimary: boolean
  ) => {
    try {
      await updatePhone({
        phoneId: id,
        data: {
          phone_number: phoneNumber,
          verified,
          is_primary: isPrimary,
        },
      });
      console.log("Phone updated successfully");
    } catch (error) {
      console.error("Failed to update phone:", error);
    }
  };

  // Profile update is now handled directly in the modal

  const handleConfirmDelete = async () => {
    if (deleteItem) {
      try {
        switch (deleteItem.type) {
          case "email":
            await deleteEmail(deleteItem.id);
            console.log("Email deleted successfully");
            break;
          case "phone":
            await deletePhone(deleteItem.id);
            console.log("Phone deleted successfully");
            break;
          case "social":
            await deleteSocialConnection(deleteItem.id);
            console.log("Social connection deleted successfully");
            break;
          case "user":
            await deleteUser(deleteItem.id);
            console.log("User deleted successfully");
            // Navigate back to users list after successful deletion
            navigate(`/project/${projectId}/deployment/${deploymentId}/users`);
            break;
          default:
            console.error("Unknown delete type:", deleteItem.type);
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
      setDeleteItem(null);
      setConfirmationDialogOpen(false);
    }
  };

  const handleSavePublicMetadata = async () => {
    try {
      const parsedMetadata = JSON.parse(publicMetadata);
      await updateUser({
        public_metadata: parsedMetadata,
      });
      setIsEditingPublicMetadata(false);
      toast.success("Public metadata updated successfully");
    } catch (error) {
      console.error("Failed to save public metadata:", error);
      toast.error("Failed to update public metadata. Please check the JSON format.");
    }
  };

  const handleSavePrivateMetadata = async () => {
    try {
      const parsedMetadata = JSON.parse(privateMetadata);
      await updateUser({
        private_metadata: parsedMetadata,
      });
      setIsEditingPrivateMetadata(false);
      toast.success("Private metadata updated successfully");
    } catch (error) {
      console.error("Failed to save private metadata:", error);
      toast.error("Failed to update private metadata. Please check the JSON format.");
    }
  };

  const handleCancelPublicMetadata = () => {
    setPublicMetadata(
      user?.public_metadata
        ? JSON.stringify(user.public_metadata, null, 2)
        : "{}"
    );
    setIsEditingPublicMetadata(false);
  };

  const handleCancelPrivateMetadata = () => {
    setPrivateMetadata(
      user?.private_metadata
        ? JSON.stringify(user.private_metadata, null, 2)
        : "{}"
    );
    setIsEditingPrivateMetadata(false);
  };

  const getSocialProviderName = (provider: string): string => {
    switch (provider) {
      case "oauth_google":
        return "Google";
      case "oauth_github":
        return "GitHub";
      case "oauth_microsoft":
        return "Microsoft";
      case "oauth_facebook":
        return "Facebook";
      case "oauth_linkedin":
        return "LinkedIn";
      case "oauth_discord":
        return "Discord";
      case "oauth_apple":
        return "Apple";
      default:
        return provider;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <div>
            <h1 className="text-lg text-gray-900 dark:text-gray-100">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">User ID: {user.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            outline
            className="p-2"
            onClick={() => setEditProfileModalOpen(true)}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit Profile</span>
          </Button>
          <Button
            color="red"
            className="p-2"
            onClick={() => {
              setDeleteItem({ type: "user", id: user.id, name: user.first_name + " " + user.last_name });
              setConfirmationDialogOpen(true);
            }}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete User</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 lg:border-r lg:border-gray-200 dark:lg:border-zinc-800 lg:pr-8">
          <div className="py-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </span>
                )}
              </div>
              <h2 className="text-base text-gray-900 text-center mb-2">
                {user.first_name} {user.last_name}
              </h2>
              {user.username && (
                <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
              )}
              <p className="text-sm text-gray-500 mb-6">
                Joined {format(new Date(user.created_at), "MMM d, yyyy")}
              </p>

              {/* Quick Stats */}
              <div className="w-full space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email Addresses</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {user.email_addresses?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Phone Numbers</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {user.phone_numbers?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Social Connections
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {user.social_connections?.length || 0}
                  </span>
                </div>
              </div>

              {/* Security Status */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Password</span>
                  <div className="flex items-center gap-2">
                    {user.has_password ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                    <Button
                      outline
                      className="text-xs py-1 px-2"
                      onClick={() => setChangePasswordModalOpen(true)}
                    >
                      {user.has_password ? "Change" : "Set"}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">2FA</span>
                  {user.has_otp ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Account Details */}
          <div className="mb-8">
            <h2 className="text-base text-gray-900 mb-4">
              Account Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Primary Email
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {user.primary_email_address || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Primary Phone
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {user.primary_phone_number || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {user.username || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(user.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last Updated
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(user.updated_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">2FA Policy</p>
                <p className="text-sm text-gray-900 capitalize">
                  {user.second_factor_policy || "None"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Schema Version
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{user.schema_version}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <SimpleTabs defaultTab={0}>
              <Tab label="Overview">
                <div className="py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500">
                        Primary Email
                      </h3>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {user.primary_email_address || "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500">
                        Primary Phone
                      </h3>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {user.primary_phone_number || "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500">
                        Username
                      </h3>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {user.username || "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500">
                        Total Email Addresses
                      </h3>
                      <p className="text-base text-gray-900 dark:text-gray-100">
                        {user.email_addresses ? user.email_addresses.length : 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500">
                        Total Phone Numbers
                      </h3>
                      <p className="text-base text-gray-900 dark:text-gray-100">
                        {user.phone_numbers ? user.phone_numbers.length : 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500">
                        Social Connections
                      </h3>
                      <p className="text-base text-gray-900 dark:text-gray-100">
                        {user.social_connections
                          ? user.social_connections.length
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab label="Email Addresses">
                <div className="py-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-gray-900 dark:text-gray-100">
                      Email Addresses
                    </h3>
                    {user.email_addresses &&
                      user.email_addresses.length > 0 && (
                        <Button
                          onClick={() => setAddEmailModalOpen(true)}
                        >
                          Add Email Address
                        </Button>
                      )}
                  </div>

                  {!user.email_addresses ||
                  user.email_addresses.length === 0 ? (
                    <EmptyState
                      title="No email addresses"
                      description="Get started by adding an email address for this user."
                      actionLabel="Add Email Address"
                      onAction={() => setAddEmailModalOpen(true)}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                          />
                        </svg>
                      }
                    />
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {user.email_addresses.map((email) => (
                        <div
                          key={email.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {email.email}
                                </span>
                                {email.is_primary && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    Primary
                                  </span>
                                )}
                                {email.verified ? (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Unverified
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Added{" "}
                                {format(
                                  new Date(email.created_at),
                                  "MMM d, yyyy"
                                )}
                                {email.verified &&
                                  ` • Verified ${format(
                                    new Date(email.verified_at),
                                    "MMM d, yyyy"
                                  )}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                onClick={() => handleEditEmail(email.id)}
                              >
                                <PencilIcon className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </button>
                              <button
                                type="button"
                                className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                onClick={() =>
                                  handleDeleteItem(
                                    email.id,
                                    "email",
                                    email.email
                                  )
                                }
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

              <Tab label="Phone Numbers">
                <div className="py-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-gray-900 dark:text-gray-100">
                      Phone Numbers
                    </h3>
                    {user.phone_numbers && user.phone_numbers.length > 0 && (
                      <Button
                        onClick={() => setAddPhoneModalOpen(true)}
                      >
                        Add Phone Number
                      </Button>
                    )}
                  </div>

                  {!user.phone_numbers || user.phone_numbers.length === 0 ? (
                    <EmptyState
                      title="No phone numbers"
                      description="Get started by adding a phone number for this user."
                      actionLabel="Add Phone Number"
                      onAction={() => setAddPhoneModalOpen(true)}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                          />
                        </svg>
                      }
                    />
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {user.phone_numbers.map((phone) => (
                        <div
                          key={phone.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">{getCountryFlag(phone.country_code)}</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {phone.country_code} {phone.phone_number}
                                </span>
                                {user.primary_phone_number ===
                                  phone.phone_number && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    Primary
                                  </span>
                                )}
                                {phone.verified ? (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Unverified
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Added{" "}
                                {format(
                                  new Date(phone.created_at),
                                  "MMM d, yyyy"
                                )}
                                {phone.verified &&
                                  ` • Verified ${format(
                                    new Date(phone.verified_at),
                                    "MMM d, yyyy"
                                  )}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                onClick={() => handleEditPhone(phone.id)}
                              >
                                <PencilIcon className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </button>
                              <button
                                type="button"
                                className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                onClick={() =>
                                  handleDeleteItem(
                                    phone.id,
                                    "phone",
                                    phone.phone_number
                                  )
                                }
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

              <Tab label="Social Connections">
                <div className="py-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-gray-900 dark:text-gray-100">
                      Social Connections
                    </h3>
                  </div>

                  {!user.social_connections ||
                  user.social_connections.length === 0 ? (
                    <EmptyState
                      title="No social connections"
                      description="This user hasn't connected any social accounts yet."
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                          />
                        </svg>
                      }
                    />
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {user.social_connections.map((connection) => (
                        <div
                          key={connection.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {getSocialProviderName(connection.provider)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {connection.email_address}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Connected{" "}
                                {format(
                                  new Date(connection.created_at),
                                  "MMM d, yyyy"
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              onClick={() =>
                                handleDeleteItem(
                                  connection.id,
                                  "social",
                                  getSocialProviderName(connection.provider)
                                )
                              }
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

              <Tab label="Metadata">
                <div className="py-6 space-y-8">
                  {/* Public Metadata */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base text-gray-900 dark:text-gray-100">
                        Public Metadata
                      </h3>
                      {!isEditingPublicMetadata ? (
                        <Button
                          outline
                          className="flex items-center gap-1 text-sm py-2"
                          onClick={() => setIsEditingPublicMetadata(true)}
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            outline
                            className="text-sm py-2"
                            onClick={handleCancelPublicMetadata}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="text-sm py-2"
                            onClick={handleSavePublicMetadata}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded border border-gray-200 dark:border-zinc-800">
                      <Editor
                        height="120px"
                        defaultLanguage="json"
                        value={publicMetadata}
                        onChange={(value) => setPublicMetadata(value || "{}")}
                        theme={isDarkMode ? "vs-dark" : "vs"}
                        options={{
                          readOnly: !isEditingPublicMetadata,
                          minimap: { enabled: false },
                          fontSize: 13,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          formatOnPaste: true,
                          formatOnType: true,
                          wordWrap: "on",
                          lineNumbers: "off",
                          folding: false,
                          autoIndent: "full",
                          padding: { top: 8, bottom: 8 },
                          scrollbar: {
                            vertical: "auto",
                            horizontal: "hidden",
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Private Metadata */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base text-gray-900 dark:text-gray-100">
                        Private Metadata
                      </h3>
                      {!isEditingPrivateMetadata ? (
                        <Button
                          outline
                          className="flex items-center gap-1 text-sm py-2"
                          onClick={() => setIsEditingPrivateMetadata(true)}
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            outline
                            className="text-sm py-2"
                            onClick={handleCancelPrivateMetadata}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="text-sm py-2"
                            onClick={handleSavePrivateMetadata}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded border border-gray-200 dark:border-zinc-800">
                      <Editor
                        height="120px"
                        defaultLanguage="json"
                        value={privateMetadata}
                        onChange={(value) => setPrivateMetadata(value || "{}")}
                        theme={isDarkMode ? "vs-dark" : "vs"}
                        options={{
                          readOnly: !isEditingPrivateMetadata,
                          minimap: { enabled: false },
                          fontSize: 13,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          formatOnPaste: true,
                          formatOnType: true,
                          wordWrap: "on",
                          lineNumbers: "off",
                          folding: false,
                          autoIndent: "full",
                          padding: { top: 8, bottom: 8 },
                          scrollbar: {
                            vertical: "auto",
                            horizontal: "hidden",
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Tab>
            </SimpleTabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEmailModal
        isOpen={addEmailModalOpen}
        onClose={() => setAddEmailModalOpen(false)}
        onSubmit={handleAddEmail}
      />

      <AddPhoneModal
        isOpen={addPhoneModalOpen}
        onClose={() => setAddPhoneModalOpen(false)}
        onSubmit={handleAddPhone}
      />

      <EditEmailModal
        isOpen={editEmailModalOpen}
        onClose={() => setEditEmailModalOpen(false)}
        onSubmit={handleUpdateEmail}
        emailData={selectedEmail}
      />

      <EditPhoneModal
        isOpen={editPhoneModalOpen}
        onClose={() => setEditPhoneModalOpen(false)}
        onSubmit={handleUpdatePhone}
        phoneData={selectedPhone}
      />

      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        userId={userId || ""}
        profileData={
          user
            ? {
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username || undefined,
                image_url: user.profile_picture_url || undefined,
              }
            : null
        }
      />

      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        userId={userId || ""}
        hasPassword={user?.has_password || false}
      />

      <ConfirmationDialog
        isOpen={confirmationDialogOpen}
        onClose={() => {
          setConfirmationDialogOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteItem?.type || "item"}`}
        message={`Are you sure you want to delete this ${deleteItem?.type}? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}

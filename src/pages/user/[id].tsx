import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { useUserDetails } from "@/lib/api/hooks/use-user-details";
import { useUpdateUser } from "@/lib/api/hooks/use-update-user";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import { AddEmailModal } from "@/components/modals/add-email-modal";
import { AddPhoneModal } from "@/components/modals/add-phone-modal";
import { EditEmailModal } from "@/components/modals/edit-email-modal";
import { EditPhoneModal } from "@/components/modals/edit-phone-modal";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import Editor from "@monaco-editor/react";

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function UserDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id;
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

  // Modal states
  const [addEmailModalOpen, setAddEmailModalOpen] = useState(false);
  const [addPhoneModalOpen, setAddPhoneModalOpen] = useState(false);
  const [editEmailModalOpen, setEditEmailModalOpen] = useState(false);
  const [editPhoneModalOpen, setEditPhoneModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  // Data for edit modals
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
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

  const handleBack = () => {
    navigate("/users");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading user details...</p>
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
          <Button onClick={handleBack} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>User not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Users
          </Button>
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
    verified: boolean,
    isPrimary: boolean
  ) => {
    try {
      await addPhone({
        phone_number: phoneNumber,
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

  const handleUpdateProfile = async (profileData: any) => {
    try {
      await updateUser({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        username: profileData.username,
      });
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

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
      console.log("Public metadata updated successfully");
    } catch (error) {
      console.error("Failed to save public metadata:", error);
    }
  };

  const handleSavePrivateMetadata = async () => {
    try {
      const parsedMetadata = JSON.parse(privateMetadata);
      await updateUser({
        private_metadata: parsedMetadata,
      });
      setIsEditingPrivateMetadata(false);
      console.log("Private metadata updated successfully");
    } catch (error) {
      console.error("Failed to save private metadata:", error);
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
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile card */}
        <Card className="lg:col-span-1 shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar
              className="h-24 w-24 mb-4"
              initials={`${user.first_name[0]}${user.last_name[0]}`}
            />
            <h2 className="text-xl font-bold mb-1">{`${user.first_name} ${user.last_name}`}</h2>
            <p className="text-sm text-gray-500 mb-6">
              Joined {format(new Date(user.created_at), "MMMM d, yyyy")}
            </p>

            <div className="flex gap-2 w-full">
              <Button
                outline
                className="flex-1 flex items-center justify-center gap-1 text-sm py-2"
                onClick={() => setEditProfileModalOpen(true)}
              >
                <PencilIcon className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                outline
                className="flex-1 flex items-center justify-center gap-1 text-sm py-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
                Delete User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account information card */}
        <Card className="lg:col-span-2 shadow-sm border-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  User ID
                </p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Username
                </p>
                <p className="text-sm">{user.username || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Created At
                </p>
                <p className="text-sm">
                  {format(new Date(user.created_at), "MMM d, yyyy, h:mm:ss a")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </p>
                <p className="text-sm">
                  {format(new Date(user.updated_at), "MMM d, yyyy, h:mm:ss a")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Schema Version
                </p>
                <p className="text-sm">{user.schema_version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  2FA Policy
                </p>
                <p className="text-sm">{user.second_factor_policy || "none"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Has Password
                </p>
                <div className="flex items-center">
                  {user.has_password ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm">No</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Has OTP
                </p>
                <div className="flex items-center">
                  {user.has_otp ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm">No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="shadow-sm border-0 overflow-hidden">
        <div className="p-0">
          <SimpleTabs defaultTab={0}>
            <Tab label="Overview">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Primary Email
                    </h3>
                    <p className="text-base">
                      {user.primary_email_address || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Primary Phone
                    </h3>
                    <p className="text-base">
                      {user.primary_phone_number || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Email Addresses
                    </h3>
                    <p className="text-base">
                      {user.email_addresses ? user.email_addresses.length : 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Phone Numbers
                    </h3>
                    <p className="text-base">
                      {user.phone_numbers ? user.phone_numbers.length : 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Social Connections
                    </h3>
                    <p className="text-base">
                      {user.social_connections
                        ? user.social_connections.length
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab label="Email Addresses">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Email Addresses</h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                    onClick={() => setAddEmailModalOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Email
                  </Button>
                </div>

                {!user.email_addresses || user.email_addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
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
                    </div>
                    <p className="text-gray-500 mb-4">
                      No email addresses added yet
                    </p>
                    <Button outline onClick={() => setAddEmailModalOpen(true)}>
                      Add Email Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.email_addresses.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
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
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                Unverified
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Added{" "}
                            {format(new Date(email.created_at), "MMM d, yyyy")}
                            {email.verified &&
                              ` • Verified ${format(
                                new Date(email.verified_at),
                                "MMM d, yyyy"
                              )}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            onClick={() => handleEditEmail(email.id)}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600"
                            onClick={() =>
                              handleDeleteItem(email.id, "email", email.email)
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

            <Tab label="Phone Numbers">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Phone Numbers</h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                    onClick={() => setAddPhoneModalOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Phone
                  </Button>
                </div>

                {!user.phone_numbers || user.phone_numbers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
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
                    </div>
                    <p className="text-gray-500 mb-4">
                      No phone numbers added yet
                    </p>
                    <Button outline onClick={() => setAddPhoneModalOpen(true)}>
                      Add Phone Number
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.phone_numbers.map((phone) => (
                      <div
                        key={phone.id}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {phone.phone_number}
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
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                Unverified
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Added{" "}
                            {format(new Date(phone.created_at), "MMM d, yyyy")}
                            {phone.verified &&
                              ` • Verified ${format(
                                new Date(phone.verified_at),
                                "MMM d, yyyy"
                              )}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            onClick={() => handleEditPhone(phone.id)}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600"
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
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab label="Social Connections">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Social Connections</h3>
                </div>

                {!user.social_connections ||
                user.social_connections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
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
                    </div>
                    <p className="text-gray-500">
                      No social connections added yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.social_connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {getSocialProviderName(connection.provider)}
                            </span>
                            <span className="text-gray-500">
                              {connection.email_address}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Connected{" "}
                            {format(
                              new Date(connection.created_at),
                              "MMM d, yyyy"
                            )}
                          </div>
                        </div>
                        <button
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600"
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
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab label="Metadata">
              <div className="p-6 space-y-8">
                {/* Public Metadata */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Public Metadata</h3>
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

                  <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                    <Editor
                      height="120px"
                      defaultLanguage="json"
                      value={publicMetadata}
                      onChange={(value) => setPublicMetadata(value || "{}")}
                      theme="vs"
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
                    <h3 className="text-lg font-medium">Private Metadata</h3>
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

                  <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                    <Editor
                      height="120px"
                      defaultLanguage="json"
                      value={privateMetadata}
                      onChange={(value) => setPrivateMetadata(value || "{}")}
                      theme="vs"
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
      </Card>

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
        onSubmit={handleUpdateProfile}
        profileData={
          user
            ? {
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username || undefined,
              }
            : null
        }
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

import { useState, useEffect } from "react";
import { WorkspacesTabs, type Tab } from "@/components/workspaces-tabs";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";

export default function ManageWorkspacesPage() {
  const [isWorkspaceEnabled, setIsWorkspaceEnabled] = useState(() => {
    return JSON.parse(localStorage.getItem("workspace_enabled") || "false");
  });

  useEffect(() => {
    localStorage.setItem("workspace_enabled", JSON.stringify(isWorkspaceEnabled));
  }, [isWorkspaceEnabled]);

  const tabs: Tab[] = [
    { name: "Settings", href: "/workspaces", current: true },
    { name: "Members", href: "/workspaces/members", current: false },
    { name: "Invitations", href: "/workspaces/invitations", current: false },
  ];

  return (
    <div className="flex flex-col gap-2 mb-2">
      <Heading className="mb-8">Manage Workspaces</Heading>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium">Enable workspaces</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This feature allows users to create Workspaces, invite their team, and collaborate efficiently.
          </p>
        </div>
        <Switch
          name="workspace_enabled"
          checked={isWorkspaceEnabled}
          onChange={setIsWorkspaceEnabled}
        />
      </div>
      {isWorkspaceEnabled && (
        <div>
          <WorkspacesTabs tabs={tabs} className="my-10" />
          <div className="space-y-28">
            <div className="space-y-6">
              <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Subheading><Strong>Default role for members</Strong></Subheading>
                  <Text>Choose the role that users are initially assigned as a new workspace member.</Text>
                </div>
                <div>
                  <Select aria-label="Roles" name="roles" defaultValue="member">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              </section>
              <Divider className="my-10" soft />
              <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Subheading><Strong>Creator’s initial role</Strong></Subheading>
                  <Text>Choose the role that users are initially assigned after creating a workspace.</Text>
                </div>
                <div>
                  <Select aria-label="Roles" name="roles" defaultValue="admin">
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              </section>
              <Divider className="my-10" soft />
              <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Subheading><Strong>Workspace membership limit</Strong></Subheading>
                  <Text>Set the default number of users allowed in a workspace.</Text>
                </div>
                <div>
                  <Input type="number" placeholder="Enter limit" className="w-16" />
                </div>
              </section>
              <Divider className="my-10" soft />
              <div className="flex justify-end gap-4">
                <Button type="reset" plain>Reset</Button>
                <Button type="submit">Save changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

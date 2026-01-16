import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export function OrganizationRolesTab() {
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin" },
    { id: 2, name: "Member" },
  ]);
  const [newRole, setNewRole] = useState("");
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddRole = () => {
    if (newRole.trim() !== "") {
      setRoles([...roles, { id: Date.now(), name: newRole }]);
      setNewRole("");
    }
  };

  const handleDeleteRole = (id: number) => {
    setRoles(roles.filter((role) => role.id !== id));
  };

  interface Role {
    id: number;
    name: string;
  }

  const handleEditRole = (id: number, name: string) => {
    setEditingRole(id);
    setEditValue(name);
  };

  const handleSaveEdit = (id: number) => {
    setRoles(
      roles.map((role: Role) => (role.id === id ? { ...role, name: editValue } : role))
    );
    setEditingRole(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-normal">Manage Roles</h2>

      {/* Add Role */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter role name"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        />
        <Button onClick={handleAddRole}>Add Role</Button>
      </div>

      {/* Roles Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-12">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                <h3 className="mt-2 text-sm font-normal text-zinc-900 dark:text-zinc-100">
                  No roles found
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Add a role using the form above to get started.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  {editingRole === role.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                  ) : (
                    role.name
                  )}
                </TableCell>
                <TableCell className="flex gap-2">
                  {editingRole === role.id ? (
                    <Button onClick={() => handleSaveEdit(role.id)}>
                      Save
                    </Button>
                  ) : (
                    <Button onClick={() => handleEditRole(role.id, role.name)}>
                      Edit
                    </Button>
                  )}
                  <Button onClick={() => handleDeleteRole(role.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

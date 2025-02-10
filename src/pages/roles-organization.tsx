import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function OrganizationRolesTab() {
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin" },
    { id: 2, name: "Member" },
  ]);
  const [newRole, setNewRole] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleAddRole = () => {
    if (newRole.trim() !== "") {
      setRoles([...roles, { id: Date.now(), name: newRole }]);
      setNewRole("");
    }
  };

  const handleDeleteRole = (id) => {
    setRoles(roles.filter((role) => role.id !== id));
  };

  const handleEditRole = (id, name) => {
    setEditingRole(id);
    setEditValue(name);
  };

  const handleSaveEdit = (id) => {
    setRoles(
      roles.map((role) => (role.id === id ? { ...role, name: editValue } : role))
    );
    setEditingRole(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Manage Roles</h2>

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
          {roles.map((role) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

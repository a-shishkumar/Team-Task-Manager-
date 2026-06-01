import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Shield, Plus, ShieldCheck, Loader2, Save } from 'lucide-react';
import { permissionApi } from '@/api/endpoints';
import type { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface PermissionRow {
  role: string;
  create: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

// Custom Switch component
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-primary' : 'bg-muted'}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block size-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const { user } = useSelector((s: RootState) => s.auth);
  
  // Modal State
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  
  // Grid/Matrix State
  const [localPermissions, setLocalPermissions] = useState<PermissionRow[]>([]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch permissions
  const { isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await permissionApi.getAll();
      const data = response.data.data;
      setLocalPermissions(data);
      return data;
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: (data: PermissionRow[]) => permissionApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permissions updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update permissions');
    },
  });

  // Toggle cell permission
  const handleToggle = (role: string, field: keyof Omit<PermissionRow, 'role'>) => {
    // Admin permissions cannot be turned off to prevent locking out the admin
    if (role === 'admin') {
      toast.error('Admin must retain all permissions.');
      return;
    }

    setLocalPermissions((prev) =>
      prev.map((row) => {
        if (row.role === role) {
          return {
            ...row,
            [field]: !row[field],
          };
        }
        return row;
      })
    );
  };

  // Add Custom Role local state
  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedRoleName = newRoleName.trim().toLowerCase();
    
    if (!formattedRoleName) {
      toast.error('Role name is required');
      return;
    }

    // Check if role already exists
    const exists = localPermissions.some((r) => r.role === formattedRoleName);
    if (exists) {
      toast.error('This role already exists');
      return;
    }

    // Add new role to localPermissions
    setLocalPermissions((prev) => [
      ...prev,
      {
        role: formattedRoleName,
        create: false,
        view: true, // Default to true so they can see the workspace
        edit: false,
        delete: false,
      },
    ]);

    setNewRoleName('');
    setIsAddRoleOpen(false);
    toast.success(`Role "${formattedRoleName}" added to matrix! Click Save to write to database.`);
  };

  const handleSaveChanges = () => {
    updatePermissionsMutation.mutate(localPermissions);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure dynamic CRUD permissions across different access roles in your system.
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsAddRoleOpen(true)}
            className="gap-2 border-border/80 hover:bg-accent"
          >
            <Plus className="size-4" />
            Add Custom Role
          </Button>

          <Button
            onClick={handleSaveChanges}
            disabled={updatePermissionsMutation.isPending || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {updatePermissionsMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Permissions
          </Button>
        </div>
      </div>

      {/* Main Grid Card */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle>Permission Access Matrix</CardTitle>
          <CardDescription>
            Roles are mapped as rows. Toggling fields determines accessibility to Task/Project CRUD resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 font-semibold text-muted-foreground select-none">
                    <th className="p-4 pl-6 w-1/4">System Role</th>
                    <th className="p-4 text-center">Create</th>
                    <th className="p-4 text-center">View</th>
                    <th className="p-4 text-center">Edit</th>
                    <th className="p-4 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {localPermissions.map((row) => (
                    <tr
                      key={row.role}
                      className="hover:bg-muted/5 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground capitalize">
                            {row.role}
                          </span>
                          {row.role === 'admin' ? (
                            <ShieldCheck className="size-4 text-primary" />
                          ) : (
                            <Badge variant="outline" className="text-[10px] scale-90 border-muted-foreground/30 text-muted-foreground font-normal">
                              Dynamic
                            </Badge>
                          )}
                        </div>
                      </td>
                      
                      {/* Create Toggle */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={row.create}
                            onCheckedChange={() => handleToggle(row.role, 'create')}
                            disabled={row.role === 'admin'}
                          />
                        </div>
                      </td>

                      {/* View Toggle */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={row.view}
                            onCheckedChange={() => handleToggle(row.role, 'view')}
                            disabled={row.role === 'admin'}
                          />
                        </div>
                      </td>

                      {/* Edit Toggle */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={row.edit}
                            onCheckedChange={() => handleToggle(row.role, 'edit')}
                            disabled={row.role === 'admin'}
                          />
                        </div>
                      </td>

                      {/* Delete Toggle */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={row.delete}
                            onCheckedChange={() => handleToggle(row.role, 'delete')}
                            disabled={row.role === 'admin'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {localPermissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No permissions configurations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ━━━ ADD CUSTOM ROLE DIALOG ━━━ */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Add Custom System Role
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRoleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="role-name" className="text-xs font-semibold">
                Role Name
              </Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. manager, developer, client"
                autoComplete="off"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                This role can be assigned to users in the Team Directory.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddRoleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

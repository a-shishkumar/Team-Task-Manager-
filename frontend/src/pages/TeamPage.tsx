import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Search, Shield, UserCircle, Plus, Edit2, Trash2, Eye,
  Grid, List, ChevronLeft, ChevronRight, Mail, Phone, Briefcase, Calendar, ShieldCheck
} from 'lucide-react';
import { userApi, permissionApi } from '@/api/endpoints';
import { cn, getInitials } from '@/lib/utils';
import type { User } from '@/types';
import type { RootState } from '@/store';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Custom icons


export default function TeamPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((s: RootState) => s.auth);
  const isAdmin = currentUser?.role === 'admin';

  // State
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'true', 'false', or '' (all)
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member' as string,
    department: '',
    title: '',
    phone: '',
    isActive: true,
  });

  // Query dynamic roles list from permissions
  const { data: permissionsResponse } = useQuery({
    queryKey: ['permissions-list'],
    queryFn: async () => {
      const r = await permissionApi.getAll();
      return r.data.data;
    },
  });
  const availableRoles = permissionsResponse?.map((p: any) => p.role) || ['admin', 'member'];

  // Query users
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = {
        search,
        page: page.toString(),
        limit: limit.toString(),
      };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter;
      const r = await userApi.getAll(params);
      return r.data;
    },
  });

  const users = (responseData?.data as User[]) || [];
  const pagination = responseData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: typeof formData) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddOpen(false);
      resetForm();
      toast.success('Team member created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create team member');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success('Team member updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update team member');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteOpen(false);
      setSelectedUser(null);
      toast.success('Team member deleted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete team member');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'member',
      department: '',
      title: '',
      phone: '',
      isActive: true,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // blank password so we don't update it unless explicitly desired
      role: user.role,
      department: user.department || '',
      title: user.title || '',
      phone: user.phone || '',
      isActive: user.isActive,
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    updateUserMutation.mutate({
      id: selectedUser._id,
      data: {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        title: formData.title,
        phone: formData.phone,
        isActive: formData.isActive,
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser._id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Directory</h1>
          <p className="text-sm text-muted-foreground">Manage roles, departments, and details for your organization.</p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 self-start sm:self-auto">
            <Plus className="size-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email..."
              className="pl-9 bg-background/50 focus-visible:ring-primary/20"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 py-1 bg-background border border-input rounded-md text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20 outline-hidden capitalize"
          >
            <option value="">All Roles</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter (Admins only since they can see deactivated) */}
          {isAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 py-1 bg-background border border-input rounded-md text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20 outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 border border-border bg-muted/30 p-1 rounded-lg self-end md:self-auto">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn("h-7 px-2.5 gap-1.5 text-xs font-medium", viewMode === 'table' && "bg-background shadow-xs")}
          >
            <List className="size-3.5" />
            Table
          </Button>
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
            className={cn("h-7 px-2.5 gap-1.5 text-xs font-medium", viewMode === 'card' && "bg-background shadow-xs")}
          >
            <Grid className="size-3.5" />
            Cards
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 skeleton rounded-xl bg-card/50 border border-border/50" />
          ))}
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-semibold text-muted-foreground">
                      <th className="p-4">Member</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Department / Title</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-muted/10 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="size-9 border border-border/40">
                                <AvatarImage src={user.avatar?.url} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  'absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card',
                                  user.isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
                                )}
                              />
                            </div>
                            <div className="font-semibold text-foreground">{user.name}</div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize font-medium">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {user.department ? (
                            <div className="flex flex-col">
                              <span className="text-foreground/90 font-medium text-xs">{user.department}</span>
                              <span className="text-xs">{user.title}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{user.phone || '—'}</td>
                        <td className="p-4">
                          <Badge
                            variant={user.isActive ? 'outline' : 'destructive'}
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5",
                              user.isActive ? "border-green-500/30 text-green-600 bg-green-50/50 dark:bg-green-950/20 dark:text-green-400" : ""
                            )}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenView(user)}
                              title="View Details"
                            >
                              <Eye className="size-4" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenEdit(user)}
                                  title="Edit User"
                                >
                                  <Edit2 className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleOpenDelete(user)}
                                  title="Delete User"
                                  disabled={user._id === currentUser?._id}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No team members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Card key={user._id} className="transition-all hover:shadow-md hover:border-border/80 relative group overflow-hidden bg-card">
                  {/* Decorative role banner */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    user.role === 'admin' ? "bg-primary" : "bg-muted-foreground/20"
                  )} />

                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="size-12 border border-border/40">
                            <AvatarImage src={user.avatar?.url} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              'absolute bottom-0 right-0 size-3 rounded-full border-2 border-card',
                              user.isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Corner Badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize font-medium text-xs">
                          {user.role}
                        </Badge>
                        <Badge
                          variant={user.isActive ? 'outline' : 'destructive'}
                          className={cn(
                            "text-[10px] scale-90 origin-right px-1.5 py-0.2",
                            user.isActive ? "border-green-500/30 text-green-600 bg-green-50/50" : ""
                          )}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="mt-5 pt-4 border-t border-border/50 space-y-2.5 text-xs text-muted-foreground">
                      {user.department ? (
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{user.department} • {user.title}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground/45">
                          <Briefcase className="size-3.5 shrink-0" />
                          <span>No role details set</span>
                        </div>
                      )}

                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenView(user)}
                        className="h-8 px-2.5 gap-1 text-xs"
                      >
                        <Eye className="size-3.5" />
                        View
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 px-2.5 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={user._id === currentUser?._id}
                            onClick={() => handleOpenDelete(user)}
                            className="h-8 px-2.5 gap-1 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {users.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <p className="font-medium">No team members found</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
              <div>
                Showing <span className="font-semibold text-foreground">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-foreground">{pagination.total}</span> members
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs px-2 font-medium text-foreground">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ━━━ CREATE MEMBER DIALOG ━━━ */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <UserPlusIcon className="size-5 text-primary" />
              Add New Team Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="add-name" className="text-xs font-semibold">Full Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Amit Verma"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="add-email" className="text-xs font-semibold">Email Address *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-password" className="text-xs font-semibold">Initial Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="add-role" className="text-xs font-semibold">System Role</Label>
                <select
                  id="add-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-primary/20 outline-hidden capitalize"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-phone" className="text-xs font-semibold">Phone Number</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="add-dept" className="text-xs font-semibold">Department</Label>
                <Input
                  id="add-dept"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-title" className="text-xs font-semibold">Job Title</Label>
                <Input
                  id="add-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Full Stack Developer"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ━━━ EDIT MEMBER DIALOG ━━━ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Edit2 className="size-4 text-primary" />
              Edit Team Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs font-semibold">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-email" className="text-xs font-semibold">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-phone" className="text-xs font-semibold">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-role" className="text-xs font-semibold">System Role</Label>
                <select
                  id="edit-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-primary/20 outline-hidden capitalize"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-active" className="text-xs font-semibold">Status</Label>
                <select
                  id="edit-active"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-primary/20 outline-hidden"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive / Suspended</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-dept" className="text-xs font-semibold">Department</Label>
                <Input
                  id="edit-dept"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-title" className="text-xs font-semibold">Job Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ━━━ VIEW DETAILS DIALOG ━━━ */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border overflow-hidden p-0">
          {selectedUser && (
            <div>
              {/* Header profile background color banner */}
              <div className="h-20 bg-gradient-to-r from-teal-600/80 to-primary/80 relative" />

              <div className="px-6 pb-6 relative">
                {/* Large Avatar */}
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="relative">
                    <Avatar className="size-20 border-4 border-card shadow-md">
                      <AvatarImage src={selectedUser.avatar?.url} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-card',
                        selectedUser.isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
                      )}
                    />
                  </div>
                  <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize px-2.5 py-0.5">
                    {selectedUser.role}
                  </Badge>
                </div>

                {/* Name / Title */}
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                    {selectedUser.name}
                    {selectedUser.role === 'admin' && <ShieldCheck className="size-4.5 text-primary shrink-0" />}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    {selectedUser.title || 'No Job Title set'}
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      <span className="text-muted-foreground font-semibold uppercase tracking-wider block text-[10px]">Department</span>
                      <span className="font-semibold text-foreground">{selectedUser.department || 'Not Specified'}</span>
                    </div>
                    <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      <span className="text-muted-foreground font-semibold uppercase tracking-wider block text-[10px]">Status</span>
                      <span className={cn("font-semibold", selectedUser.isActive ? "text-green-500" : "text-destructive")}>
                        {selectedUser.isActive ? 'Active' : 'Inactive / Suspended'}
                      </span>
                    </div>
                  </div>

                  {/* Info list */}
                  <div className="space-y-3 pt-2 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="size-4 text-muted-foreground/75 shrink-0" />
                      <span className="text-foreground truncate">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="size-4 text-muted-foreground/75 shrink-0" />
                      <span className="text-foreground">{selectedUser.phone || 'No phone number added'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="size-4 text-muted-foreground/75 shrink-0" />
                      <span className="text-xs">
                        Registered on: <span className="text-foreground font-medium">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                  <Button onClick={() => setIsViewOpen(false)} className="bg-muted hover:bg-muted/80 text-muted-foreground border-none">
                    Close Details
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ━━━ DELETE MEMBER CONFIRMATION ━━━ */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Delete Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you absolutely sure you want to delete <span className="font-semibold text-foreground">{selectedUser?.name}</span>?
            </p>
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/10 p-2.5 rounded-lg">
              Warning: This action is permanent. All tasks assigned to this user will be unassigned, and they will lose access to the system.
            </p>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline fallback icon helper
function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6 6 0 0 1 12 0v.11" />
    </svg>
  );
}

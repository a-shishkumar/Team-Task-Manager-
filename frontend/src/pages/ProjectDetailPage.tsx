import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { ArrowLeft, Edit, Trash2, UserPlus, Users, Calendar, ListTodo, Plus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { projectApi, taskApi, userApi } from '@/api/endpoints';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import type { RootState } from '@/store';
import type { Project, Task, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive' };
const STATUS_LABELS: Record<string, string> = { planning: 'Planning', active: 'Active', 'on-hold': 'On Hold', completed: 'Completed', archived: 'Archived' };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: currentUser } = useSelector((s: RootState) => s.auth);
  const [editOpen, setEditOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: async () => { const r = await projectApi.getById(id!); return (r.data.data as any)?.project; }, enabled: !!id });
  const { data: tasks } = useQuery({ queryKey: ['project-tasks', id], queryFn: async () => { const r = await taskApi.getAll({ project: id!, limit: '100' }); return r.data.data as Task[]; }, enabled: !!id });
  const { data: allUsers } = useQuery({ queryKey: ['all-users'], queryFn: async () => { const r = await userApi.getAll({ limit: '100' }); return r.data.data as User[]; } });

  const editForm = useForm<{ name: string; description: string; priority: string; status: string; deadline: string }>();
  const updateMut = useMutation({ mutationFn: (data: Partial<Project>) => projectApi.update(id!, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', id] }); qc.invalidateQueries({ queryKey: ['projects'] }); setEditOpen(false); toast.success('Project updated'); } });
  const deleteMut = useMutation({ mutationFn: () => projectApi.delete(id!), onSuccess: () => { toast.success('Project deleted'); navigate('/projects'); } });
  const addMemberMut = useMutation({ mutationFn: (d: { userId: string; role: string }) => projectApi.addMember(id!, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', id] }); setMemberOpen(false); toast.success('Member added'); } });
  const removeMemberMut = useMutation({ mutationFn: (userId: string) => projectApi.removeMember(id!, userId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', id] }); toast.success('Member removed'); } });

  if (isLoading) return <div className="space-y-4"><div className="h-8 w-48 skeleton rounded-lg" /><div className="h-48 skeleton rounded-xl" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-32 skeleton rounded-xl" /><div className="h-32 skeleton rounded-xl" /></div></div>;
  if (!project) return <div className="py-20 text-center text-muted-foreground">Project not found</div>;

  const isOwner = currentUser?._id === (project.owner?._id || project.owner);
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}><ArrowLeft className="size-4" /></Button>
          <div className="flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: project.color }}>{project.name[0]}</div>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={PRIORITY_VARIANT[project.priority]}>{project.priority}</Badge>
              <Badge variant="outline">{STATUS_LABELS[project.status]}</Badge>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { editForm.reset({ name: project.name, description: project.description, priority: project.priority, status: project.status, deadline: project.deadline?.split('T')[0] || '' }); setEditOpen(true); }}>
              <Edit className="size-4" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Info + Progress */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground mb-1">Progress</p><p className="text-2xl font-bold">{project.progress}%</p><div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, background: project.color }} /></div></CardContent></Card>
        <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground mb-1">Tasks</p><p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p><p className="text-xs text-muted-foreground">completed</p></CardContent></Card>
        <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground mb-1">Deadline</p><p className="text-lg font-bold">{project.deadline ? formatDate(project.deadline) : 'No deadline'}</p></CardContent></Card>
      </div>

      {project.description && (
        <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm">{project.description}</p></CardContent></Card>
      )}

      {/* Members + Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Users className="size-4" /> Members</span>
              {isOwner && <Button variant="ghost" size="icon" className="size-7" onClick={() => setMemberOpen(true)}><UserPlus className="size-4" /></Button>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-center gap-3">
                <Avatar className="size-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{getInitials(typeof project.owner === 'object' ? project.owner.name : 'O')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><p className="truncate text-sm font-medium">{typeof project.owner === 'object' ? project.owner.name : 'Owner'}</p></div>
                <Badge variant="default">owner</Badge>
              </div>
              {project.members?.map((m: any) => (
                <div key={m.user?._id || m.user} className="flex items-center gap-3">
                  <Avatar className="size-8"><AvatarFallback className="text-xs">{typeof m.user === 'object' ? getInitials(m.user.name) : '?'}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><p className="truncate text-sm font-medium">{typeof m.user === 'object' ? m.user.name : 'Member'}</p></div>
                  <Badge variant="secondary">{m.role}</Badge>
                  {isOwner && <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive-foreground" onClick={() => removeMemberMut.mutate(typeof m.user === 'object' ? m.user._id : m.user)}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListTodo className="size-4" /> Tasks ({totalTasks})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks?.map(t => (
                <div key={t._id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate(`/tasks/${t._id}`)}>
                  <div className="size-2 shrink-0 rounded-full" style={{ background: t.status === 'completed' ? 'var(--chart-1)' : t.status === 'in-progress' ? 'var(--chart-4)' : 'var(--muted-foreground)' }} />
                  <div className="min-w-0 flex-1"><p className={cn('truncate text-sm font-medium', t.status === 'completed' && 'line-through text-muted-foreground')}>{t.title}</p></div>
                  <Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Badge>
                </div>
              ))}
              {totalTasks === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No tasks yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(d => updateMut.mutate(d as any))} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input {...editForm.register('name')} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea {...editForm.register('description')} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Status</Label><Select defaultValue={project.status} onValueChange={v => editForm.setValue('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Deadline</Label><Input {...editForm.register('deadline')} type="date" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" disabled={updateMut.isPending}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Member</DialogTitle><DialogDescription>Add a team member to this project</DialogDescription></DialogHeader>
          <MemberForm users={allUsers || []} existingIds={[...(project.members?.map((m: any) => typeof m.user === 'object' ? m.user._id : m.user) || []), typeof project.owner === 'object' ? project.owner._id : project.owner]} onSubmit={d => addMemberMut.mutate(d)} isPending={addMemberMut.isPending} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Delete Project</DialogTitle><DialogDescription>This will permanently delete "{project.name}" and all its data. This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>{deleteMut.isPending ? 'Deleting...' : 'Delete'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberForm({ users, existingIds, onSubmit, isPending }: { users: User[]; existingIds: string[]; onSubmit: (d: { userId: string; role: string }) => void; isPending: boolean }) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const available = users.filter(u => !existingIds.includes(u._id));
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>User</Label><Select onValueChange={setUserId}><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{available.map(u => <SelectItem key={u._id} value={u._id}>{u.name} ({u.email})</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Role</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lead">Lead</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent></Select></div>
      <DialogFooter><Button disabled={!userId || isPending} onClick={() => onSubmit({ userId, role })}>{isPending ? 'Adding...' : 'Add Member'}</Button></DialogFooter>
    </div>
  );
}

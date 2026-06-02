import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, CheckCircle2, Circle, Plus, MessageSquare, Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { taskApi, commentApi, userApi } from '@/api/endpoints';
import { cn, formatDate, timeAgo, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Task, Comment, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive' };
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', completed: 'Completed' };

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'description' | 'discussion'>('description');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: task, isLoading } = useQuery({ queryKey: ['task', id], queryFn: async () => { const r = await taskApi.getById(id!); return (r.data.data as any)?.task; }, enabled: !!id });
  const { data: comments } = useQuery({ queryKey: ['comments', id], queryFn: async () => { const r = await commentApi.getByTask(id!); return r.data.data as Comment[]; }, enabled: !!id && tab === 'discussion' });
  const { data: usersResponse } = useQuery({ queryKey: ['users-list'], queryFn: async () => { const r = await userApi.getAll({ limit: '100' }); return r.data.data || (r.data as unknown as User[]); } });
  const teamUsers: User[] = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any)?.users || [];

  const editForm = useForm<{ title: string; description: string; status: string; priority: string; dueDate: string; assignee: string }>();

  const updateMut = useMutation({ mutationFn: (data: Partial<Task>) => taskApi.update(id!, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); qc.invalidateQueries({ queryKey: ['tasks'] }); setEditOpen(false); toast.success('Task updated'); } });
  const deleteMut = useMutation({ mutationFn: () => taskApi.delete(id!), onSuccess: () => { toast.success('Task deleted'); navigate('/tasks'); } });
  const addSubtask = useMutation({ mutationFn: (title: string) => taskApi.addSubtask(id!, title), onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); setSubtaskInput(''); setShowSubtaskForm(false); } });
  const toggleSubtask = useMutation({ mutationFn: (subtaskId: string) => taskApi.toggleSubtask(id!, subtaskId), onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }) });
  const deleteSubtask = useMutation({ mutationFn: (subtaskId: string) => taskApi.deleteSubtask(id!, subtaskId), onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }) });
  const addComment = useMutation({ mutationFn: (content: string) => commentApi.create({ taskId: id!, content }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', id] }); setCommentText(''); } });

  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4"><div className="h-8 w-48 skeleton rounded-lg" /><div className="h-64 skeleton rounded-xl" /></div>;
  if (!task) return <div className="py-20 text-center text-muted-foreground">Task not found</div>;

  const completedSubs = task.subtasks?.filter((s: any) => s.isCompleted).length || 0;
  const totalSubs = task.subtasks?.length || 0;

  return (
    <div className="mx-auto  space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
          <div>
            <Badge variant={PRIORITY_VARIANT[task.status === 'completed' ? 'low' : task.priority]} className="mb-2">{STATUS_LABELS[task.status]}</Badge>
            <h1 className="text-xl font-bold">{task.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {task.createdAt && <span className="flex items-center gap-1"><Calendar className="size-3" /> Created {formatDate(task.createdAt)}</span>}
              {task.reporter && <span>• {task.reporter.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { editForm.reset({ title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate?.split('T')[0] || '' }); setEditOpen(true); }}>
            <Edit className="size-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant={tab === 'description' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('description')}>Description</Button>
        <Button variant={tab === 'discussion' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('discussion')}><MessageSquare className="size-4" /> Discussion</Button>
      </div>

      {tab === 'description' && (
        <div className="space-y-6">
          {/* Meta Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-1" variant="outline">{STATUS_LABELS[task.status]}</Badge></CardContent></Card>
            <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground">Priority</p><Badge className="mt-1" variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge></CardContent></Card>
            <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground">Due Date</p><p className={cn('mt-1 text-sm font-medium', task.isOverdue && 'text-destructive-foreground')}>{task.dueDate ? formatDate(task.dueDate) : '—'}</p></CardContent></Card>
            <Card><CardContent className="pt-0"><p className="text-xs text-muted-foreground">Assignee</p>
              <Select value={task.assignee?._id || 'unassigned'} onValueChange={(v) => { const val = v === 'unassigned' ? null : v; updateMut.mutate({ assignee: val } as any); }}>
                <SelectTrigger className="mt-1 h-8 w-full border-dashed">
                  <div className="flex items-center gap-2">
                    {task.assignee ? <><Avatar className="size-5"><AvatarFallback className="text-[9px]">{getInitials(task.assignee.name)}</AvatarFallback></Avatar><span className="text-xs">{task.assignee.name}</span></> : <span className="text-xs text-muted-foreground">Unassigned</span>}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamUsers.map((u) => (<SelectItem key={u._id} value={u._id}>{u.name} — {u.role}</SelectItem>))}
                </SelectContent>
              </Select>
            </CardContent></Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-sm">DESCRIPTION</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{task.description || 'No description provided.'}</p></CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span>SUBTASKS {totalSubs > 0 && <Badge variant="secondary" className="ml-2">{completedSubs}/{totalSubs}</Badge>}</span>
                <Button variant="ghost" size="sm" onClick={() => setShowSubtaskForm(true)}><Plus className="size-4" /> Add</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Subtask progress bar */}
              {totalSubs > 0 && (
                <div className="mb-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0}%` }} />
                  </div>
                </div>
              )}

              {/* Add subtask form */}
              {showSubtaskForm && (
                <div className="mb-4 flex items-center gap-2">
                  <Input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} placeholder="Enter subtask title..." className="flex-1" onKeyDown={e => { if (e.key === 'Enter' && subtaskInput.trim()) addSubtask.mutate(subtaskInput.trim()); }} autoFocus />
                  <Button size="sm" disabled={!subtaskInput.trim() || addSubtask.isPending} onClick={() => addSubtask.mutate(subtaskInput.trim())}>{addSubtask.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Add'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowSubtaskForm(false); setSubtaskInput(''); }}><X className="size-4" /></Button>
                </div>
              )}

              {/* Subtask list */}
              <div className="space-y-1">
                {task.subtasks?.map((sub: any) => (
                  <div key={sub._id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors">
                    <button onClick={() => toggleSubtask.mutate(sub._id)} className="shrink-0">
                      {sub.isCompleted ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5 text-muted-foreground" />}
                    </button>
                    <span className={cn('flex-1 text-sm', sub.isCompleted && 'line-through text-muted-foreground')}>{sub.title}</span>
                    {sub.createdAt && <span className="hidden text-xs text-muted-foreground sm:block">{formatDate(sub.createdAt)}</span>}
                    <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100" onClick={() => deleteSubtask.mutate(sub._id)}><Trash2 className="size-3 text-muted-foreground" /></Button>
                  </div>
                ))}
                {totalSubs === 0 && !showSubtaskForm && <p className="py-3 text-center text-xs text-muted-foreground">No subtasks yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'discussion' && (
        <div className="space-y-4">
          {/* Comment input */}
          <div className="flex gap-3">
            <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1" rows={2} />
            <Button size="sm" disabled={!commentText.trim() || addComment.isPending} onClick={() => addComment.mutate(commentText.trim())} className="self-end">{addComment.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Post'}</Button>
          </div>
          <Separator />
          {/* Comments */}
          <div className="space-y-4">
            {comments?.map(c => (
              <div key={c._id} className="flex gap-3">
                <Avatar className="size-8 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-xs">{c.author?.name?.[0] || '?'}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">{c.author?.name}</span><span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.content}</p>
                </div>
              </div>
            ))}
            {(!comments || comments.length === 0) && <p className="py-6 text-center text-sm text-muted-foreground">No comments yet. Start the discussion!</p>}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(d => updateMut.mutate(d as any))} className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input {...editForm.register('title')} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea {...editForm.register('description')} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Status</Label><Select defaultValue={task.status} onValueChange={v => editForm.setValue('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Priority</Label><Select defaultValue={task.priority} onValueChange={v => editForm.setValue('priority', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Due Date</Label><Input {...editForm.register('dueDate')} type="date" /></div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select defaultValue={task.assignee?._id || ''} onValueChange={(v) => editForm.setValue('assignee', v)}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamUsers.map((u) => (<SelectItem key={u._id} value={u._id}>{u.name} — {u.role}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" disabled={updateMut.isPending}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Delete Task</DialogTitle><DialogDescription>This will permanently delete "{task.title}". This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>{deleteMut.isPending ? 'Deleting...' : 'Delete'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

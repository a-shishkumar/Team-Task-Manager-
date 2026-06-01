import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Loader2, ListTodo } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { taskApi, projectApi } from '@/api/endpoints';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Task, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  project: z.string().min(1, 'Select a project'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['todo', 'in-progress', 'review', 'completed']).default('todo'),
  dueDate: z.string().optional(),
});
type TF = z.infer<typeof taskSchema>;

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', completed: 'Completed',
};

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive',
};

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '10', page: String(page) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await taskApi.getAll(params);
      return { tasks: r.data.data as Task[], pagination: r.data.pagination };
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const r = await projectApi.getAll({ limit: '100' });
      return (r.data.data as any)?.projects || r.data.data as Project[];
    },
  });

  const createMut = useMutation({
    mutationFn: (d: TF) => taskApi.create(d as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      toast.success('Task created!');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => taskApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">View and manage all your tasks</p>
        </div>
        <Button
          onClick={() => {
            reset({ title: '', description: '', project: '', priority: 'medium', status: 'todo' });
            setShowModal(true);
          }}
        >
          <Plus className="size-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value || 'all'}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {data?.tasks?.map((task) => (
              <Card
                key={task._id}
                className="transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => navigate(`/tasks/${task._id}`)}
              >
                <CardContent className="pt-0">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: task.project?.color || 'var(--primary)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-sm font-semibold hover:text-primary transition-colors">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Badge variant={PRIORITY_VARIANT[task.priority] || 'secondary'}>
                            {task.priority}
                          </Badge>
                          <Select
                            value={task.status}
                            onValueChange={(v) => updateMut.mutate({ id: task._id, data: { status: v as Task['status'] } })}
                          >
                            <SelectTrigger className="h-7 w-auto gap-1 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{task.project?.name}</span>
                        {task.dueDate && (
                          <span className={cn('flex items-center gap-1', task.isOverdue && 'text-destructive-foreground')}>
                            <Calendar className="size-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignee && <span>→ {task.assignee.name}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {data?.tasks?.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <ListTodo className="mx-auto mb-3 size-12 opacity-30" />
                <p className="font-medium">No tasks found</p>
                <p className="mt-1 text-sm">Create your first task to get started</p>
              </div>
            )}
          </div>
          {data?.pagination && (
            <Pagination
              pagination={data.pagination}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to a project</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMut.mutate(d as unknown as TF))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input {...register('title')} id="task-title" placeholder="Task title..." />
              {errors.title && <p className="text-xs text-destructive-foreground">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea {...register('description')} id="task-desc" placeholder="Task description..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select onValueChange={(v) => setValue('project', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project && <p className="text-xs text-destructive-foreground">{errors.project.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="medium" onValueChange={(v) => setValue('priority', v as TF['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="todo" onValueChange={(v) => setValue('status', v as TF['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-dueDate">Due Date</Label>
                <Input {...register('dueDate')} id="task-dueDate" type="date" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

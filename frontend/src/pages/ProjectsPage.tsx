import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Calendar, FolderKanban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { projectApi } from '@/api/endpoints';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Project } from '@/types';
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

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  deadline: z.string().optional(),
  color: z.string().default('#0d9488'),
});
type PF = z.infer<typeof projectSchema>;

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  critical: 'destructive',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, page],
    queryFn: async () => {
      const r = await projectApi.getAll({ search, page: String(page), limit: '9' });
      return { projects: r.data.data as Project[], pagination: r.data.pagination };
    },
  });

  const createMut = useMutation({
    mutationFn: (d: PF) => projectApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      toast.success('Project created!');
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PF>({
    resolver: zodResolver(projectSchema),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your team's projects</p>
        </div>
        <Button
          onClick={() => {
            reset({ name: '', description: '', priority: 'medium', color: '#0d9488' });
            setShowModal(true);
          }}
        >
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.projects?.map((p) => (
              <Link key={p._id} to={`/projects/${p._id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between">
                      <div className="flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: p.color }}>
                        {p.name[0]}
                      </div>
                      <Badge variant={PRIORITY_VARIANT[p.priority] || 'secondary'}>
                        {p.priority}
                      </Badge>
                    </div>

                    <h3 className="mt-3 font-semibold">{p.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.description || 'No description'}
                    </p>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${p.progress}%`, background: p.color }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {(p.members?.length || 0) + 1}
                      </div>
                      {p.deadline && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {formatDate(p.deadline)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {data?.projects?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <FolderKanban className="mx-auto mb-3 size-12 opacity-30" />
                <p className="font-medium">No projects yet</p>
                <p className="mt-1 text-sm">Create your first project to get started</p>
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
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project to your workspace</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Name</Label>
              <Input {...register('name')} id="proj-name" placeholder="My Project" />
              {errors.name && <p className="text-xs text-destructive-foreground">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea {...register('description')} id="proj-desc" placeholder="Project description..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="medium" onValueChange={(v) => setValue('priority', v as PF['priority'])}>
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
              <div className="space-y-2">
                <Label htmlFor="proj-deadline">Deadline</Label>
                <Input {...register('deadline')} id="proj-deadline" type="date" />
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

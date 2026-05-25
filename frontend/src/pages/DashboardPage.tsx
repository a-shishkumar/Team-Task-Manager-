import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FolderKanban, ListTodo, CheckCircle2, Clock, AlertTriangle, Users, TrendingUp, Activity } from 'lucide-react';
import { userApi } from '@/api/endpoints';
import { cn, timeAgo } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { DashboardStats } from '@/types';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', completed: 'Completed',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const res = await userApi.getDashboard(); return res.data.data as DashboardStats; },
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;

  const stats = data;
  const taskPieData = stats ? [
    { name: 'To Do', value: stats.tasks.todo },
    { name: 'In Progress', value: stats.tasks.inProgress },
    { name: 'Review', value: stats.tasks.review },
    { name: 'Completed', value: stats.tasks.completed },
  ] : [];

  const weeklyChartData = DAY_NAMES.map((name, i) => ({
    name,
    completed: stats?.weeklyData?.find((d) => d._id === i + 1)?.count || 0,
  }));

  const statCards = [
    { label: 'Total Projects', value: stats?.projects || 0, icon: FolderKanban },
    { label: 'Total Tasks', value: stats?.tasks.total || 0, icon: ListTodo },
    { label: 'Completed', value: stats?.tasks.completed || 0, icon: CheckCircle2 },
    { label: 'In Progress', value: stats?.tasks.inProgress || 0, icon: Clock },
    { label: 'Overdue', value: stats?.tasks.overdue || 0, icon: AlertTriangle },
    { label: 'Team Members', value: stats?.members || 0, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your team overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Weekly Productivity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              Weekly Productivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyChartData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="var(--chart-1)" strokeWidth={2} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution Pie */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {taskPieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {taskPieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="size-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="ml-auto font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentTasks?.slice(0, 6).map((task) => (
                <div key={task._id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="size-2 shrink-0 rounded-full" style={{ background: task.project?.color || 'var(--primary)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project?.name}</p>
                  </div>
                  <Badge variant="secondary">{STATUS_LABELS[task.status] || task.status}</Badge>
                </div>
              )) || <p className="text-sm text-muted-foreground">No recent tasks</p>}
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.slice(0, 8).map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {activity.user?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user?.name}</span>{' '}
                      <span className="text-muted-foreground">{activity.action.replace('_', ' ')}</span>{' '}
                      <span className="font-medium">{(activity.details as any)?.taskTitle || (activity.details as any)?.projectName || ''}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              )) || <p className="text-sm text-muted-foreground">No recent activity</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 skeleton rounded-lg" />
        <div className="mt-2 h-4 w-64 skeleton rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-80 skeleton rounded-xl lg:col-span-3" />
        <div className="h-80 skeleton rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

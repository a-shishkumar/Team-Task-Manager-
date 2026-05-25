import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { notificationApi } from '@/api/endpoints';
import { cn, timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const typeIcons: Record<string, string> = {
  task_assigned: '📋',
  task_updated: '🔄',
  task_completed: '✅',
  task_comment: '💬',
  project_invitation: '📩',
  member_added: '👥',
  deadline_reminder: '⏰',
  system: '🔔',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r = await notificationApi.getAll({ limit: '50' });
      return r.data.data as { notifications: Notification[]; unreadCount: number };
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{data?.unreadCount || 0} unread</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.notifications?.map((n) => (
            <Card
              key={n._id}
              className={cn(
                'transition-shadow hover:shadow-md',
                !n.isRead && 'border-primary/30 bg-primary/5'
              )}
            >
              <CardContent className="pt-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-lg">{typeIcons[n.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => markRead.mutate(n._id)}
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive-foreground"
                      onClick={() => del.mutate(n._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data?.notifications?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 size-12 opacity-30" />
              <p className="font-medium">No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

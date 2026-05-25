import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Shield, UserCircle } from 'lucide-react';
import { userApi } from '@/api/endpoints';
import { cn, getInitials, timeAgo } from '@/lib/utils';
import type { User } from '@/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const r = await userApi.getAll({ search, limit: '50' });
      return r.data.data as User[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Manage your team members</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users?.map((user) => (
            <Card key={user._id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-0">
                <div className="flex items-start gap-4">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{user.name}</h3>
                      <span
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          user.isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
                        )}
                      />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="size-3.5" />
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                  {user.department && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCircle className="size-3.5" />
                      {user.department} • {user.title}
                    </div>
                  )}
                  {!user.isOnline && (
                    <p className="text-xs text-muted-foreground">Last seen {timeAgo(user.lastSeen)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {users?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p className="font-medium">No members found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

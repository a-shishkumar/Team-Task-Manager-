import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Building, Briefcase, Lock, Loader2, Save, ShieldCheck } from 'lucide-react';
import { userApi } from '@/api/endpoints';
import { getMe } from '@/store/authSlice';
import { cn, getInitials, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { RootState, AppDispatch } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Must be at least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must contain uppercase, lowercase, number, special char'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '', department: user?.department || '', title: user?.title || '', phone: user?.phone || '' } });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => userApi.updateProfile(data),
    onSuccess: () => { dispatch(getMe()); toast.success('Profile updated!'); },
    onError: () => toast.error('Update failed'),
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) => userApi.changePassword(data),
    onSuccess: () => { passwordForm.reset(); toast.success('Password changed!'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="size-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                {user.department && <Badge variant="outline">{user.department}</Badge>}
                {user.title && <Badge variant="outline">{user.title}</Badge>}
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              <p>Joined</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button variant={tab === 'profile' ? 'default' : 'outline'} size="sm" onClick={() => setTab('profile')}>
          <User className="size-4" /> Edit Profile
        </Button>
        <Button variant={tab === 'password' ? 'default' : 'outline'} size="sm" onClick={() => setTab('password')}>
          <Lock className="size-4" /> Change Password
        </Button>
      </div>

      {/* Profile Edit */}
      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input {...profileForm.register('name')} id="name" />
                  {profileForm.formState.errors.name && <p className="text-xs text-destructive-foreground">{profileForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Input {...profileForm.register('department')} id="dept" placeholder="e.g. Engineering" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input {...profileForm.register('title')} id="job-title" placeholder="e.g. Full Stack Developer" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input {...profileForm.register('phone')} id="phone" placeholder="+91-9876543210" />
                </div>
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      {tab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Ensure your account stays secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cur-pw">Current Password</Label>
                <Input {...passwordForm.register('currentPassword')} id="cur-pw" type="password" />
                {passwordForm.formState.errors.currentPassword && <p className="text-xs text-destructive-foreground">{passwordForm.formState.errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pw">New Password</Label>
                <Input {...passwordForm.register('newPassword')} id="new-pw" type="password" />
                {passwordForm.formState.errors.newPassword && <p className="text-xs text-destructive-foreground">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm Password</Label>
                <Input {...passwordForm.register('confirmPassword')} id="confirm-pw" type="password" />
                {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-destructive-foreground">{passwordForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, ArrowRight, ListTodo, Loader2 } from 'lucide-react';
import { login, clearError } from '@/store/authSlice';
import type { RootState, AppDispatch } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useSelector((s: RootState) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = (data: FormData) => dispatch(login(data));

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.45_0.14_181)_0%,oklch(0.4_0.12_200)_100%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <ListTodo className="size-5" />
            </div>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">
            Manage Your Team<br />
            Like Never Before
          </h1>
          <p className="max-w-md text-base text-primary-foreground/70">
            Enterprise-grade task management with real-time collaboration,
            Kanban boards, and powerful analytics.
          </p>
          <div className="flex gap-10 pt-4">
            {[
              { val: '10K+', label: 'Active Teams' },
              { val: '500K+', label: 'Tasks Managed' },
              { val: '99.9%', label: 'Uptime' },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-sm text-primary-foreground/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-primary-foreground/50">
          © 2026 TaskFlow. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <ListTodo className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">TaskFlow</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-destructive-foreground">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                {...register('password')}
                id="password"
                type="password"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-destructive-foreground">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="size-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">Create account</Link>
          </p>

          <Card>
            <CardContent className="pt-0 pb-0 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Demo Credentials</p>
              <p className="text-xs"><strong>Admin:</strong> admin@ttm.com / Test@123</p>
              <p className="text-xs"><strong>Member:</strong> sarah@ttm.com / Test@123</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

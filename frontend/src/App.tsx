import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, type ReactNode } from 'react';
import { store, type RootState, type AppDispatch } from '@/store';
import { getMe } from '@/store/authSlice';
import { ThemeProvider } from '@/context/ThemeContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import TasksPage from '@/pages/TasksPage';
import TeamPage from '@/pages/TeamPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import PermissionsPage from '@/pages/PermissionsPage';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSelector((s: RootState) => s.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  useEffect(() => { if (isAuthenticated) dispatch(getMe()); }, []); // eslint-disable-line
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AuthInitializer>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<div className="py-12 text-center text-muted-foreground">Settings page — coming soon</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthInitializer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" richColors closeButton theme="system" />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

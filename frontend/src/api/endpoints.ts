import api from './axios';
import type { ApiResponse, DashboardStats, Project, Task, Comment, Notification, User, KanbanColumns } from '@/types';

// ━━━ Auth API ━━━
export const authApi = {
  signup: (data: { name: string; email: string; password: string; role?: string }) => api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/signup', data),
  login: (data: { email: string; password: string }) => api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, data: { password: string; confirmPassword: string }) => api.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
};

// ━━━ User API ━━━
export const userApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<User[]>>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse<{ user: User }>>(`/users/${id}`),
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/users/dashboard'),
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<{ user: User }>>('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => api.put('/users/change-password', data),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }),
  create: (data: Partial<User> & { password?: string }) => api.post<ApiResponse<{ user: User }>>('/users', data),
  update: (id: string, data: Partial<User>) => api.put<ApiResponse<{ user: User }>>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ━━━ Project API ━━━
export const projectApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<Project[]>>('/projects', { params }),
  getById: (id: string) => api.get<ApiResponse<{ project: Project }>>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<ApiResponse<{ project: Project }>>('/projects', data),
  update: (id: string, data: Partial<Project>) => api.put<ApiResponse<{ project: Project }>>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  toggleArchive: (id: string) => api.put(`/projects/${id}/archive`),
  addMember: (id: string, data: { userId: string; role: string }) => api.post(`/projects/${id}/members`, data),
  removeMember: (id: string, userId: string) => api.delete(`/projects/${id}/members/${userId}`),
  getStats: (id: string) => api.get(`/projects/${id}/stats`),
};

// ━━━ Task API ━━━
export const taskApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<Task[]>>('/tasks', { params }),
  getById: (id: string) => api.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`),
  create: (data: Partial<Task> & { project: string }) => api.post<ApiResponse<{ task: Task }>>('/tasks', data),
  update: (id: string, data: Partial<Task>) => api.put<ApiResponse<{ task: Task }>>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getKanban: (projectId: string) => api.get<ApiResponse<{ columns: KanbanColumns }>>(`/tasks/kanban/${projectId}`),
  updateOrder: (tasks: { id: string; status: string; order: number }[]) => api.put('/tasks/reorder', { tasks }),
  // Subtasks
  addSubtask: (taskId: string, title: string) => api.post<ApiResponse<{ task: Task }>>(`/tasks/${taskId}/subtasks`, { title }),
  toggleSubtask: (taskId: string, subtaskId: string) => api.put<ApiResponse<{ task: Task }>>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),
  deleteSubtask: (taskId: string, subtaskId: string) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};

// ━━━ Comment API ━━━
export const commentApi = {
  getByTask: (taskId: string, params?: Record<string, string>) => api.get<ApiResponse<Comment[]>>(`/comments/task/${taskId}`, { params }),
  create: (data: { taskId: string; content: string; parentComment?: string }) => api.post<ApiResponse<{ comment: Comment }>>('/comments', data),
  update: (id: string, content: string) => api.put<ApiResponse<{ comment: Comment }>>(`/comments/${id}`, { content }),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// ━━━ Notification API ━━━
export const notificationApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ━━━ Permission API ━━━
export const permissionApi = {
  getAll: () => api.get<ApiResponse<{ _id: string; role: string; create: boolean; view: boolean; edit: boolean; delete: boolean }[]>>('/permissions'),
  update: (data: { role: string; create: boolean; view: boolean; edit: boolean; delete: boolean }[]) => api.put<ApiResponse<any>>('/permissions', data),
};

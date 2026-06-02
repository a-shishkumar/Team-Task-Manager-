export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: { url: string; publicId: string };
  avatarUrl: string;
  role: string;
  department: string;
  title: string;
  phone: string;
  isEmailVerified: boolean;
  isActive: boolean;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user: User;
  role: 'lead' | 'member' | 'viewer';
  joinedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  slug: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: User;
  members: ProjectMember[];
  startDate: string;
  deadline: string;
  tags: string[];
  color: string;
  progress: number;
  isArchived: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  _id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: { _id: string; name: string; color: string };
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: User | null;
  reporter: User;
  dueDate: string | null;
  tags: string[];
  subtasks: Subtask[];
  order: number;
  completedAt: string | null;
  estimatedHours: number;
  actualHours: number;
  isOverdue: boolean;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  _id: string;
  name: string;
  url: string;
  publicId: string;
  type: string;
  size: number;
  uploadedBy: User;
  uploadedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  task: string;
  author: User;
  isEdited: boolean;
  parentComment: string | null;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: { name: string; avatar: { url: string } };
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  user: { name: string; avatar: { url: string } };
  action: string;
  entityType: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface DashboardStats {
  projects: number;
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    completed: number;
    overdue: number;
  };
  members: number;
  recentTasks: Task[];
  recentActivity: ActivityLog[];
  weeklyData: { _id: number; count: number }[];
}

export type KanbanColumns = {
  [key in Task['status']]: Task[];
};

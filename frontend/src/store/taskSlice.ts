import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '@/api/endpoints';
import type { Task, Pagination } from '@/types';

interface TaskState {
  tasks: Task[];
  current: Task | null;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = { tasks: [], current: null, pagination: null, isLoading: false, error: null };

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params: Record<string, string> = {}, { rejectWithValue }) => {
  try { const r = await taskApi.getAll(params); return { data: r.data.data, pagination: r.data.pagination }; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch tasks'); }
});

export const fetchTask = createAsyncThunk('tasks/fetchOne', async (id: string, { rejectWithValue }) => {
  try { const r = await taskApi.getById(id); return r.data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch task'); }
});

export const createTask = createAsyncThunk('tasks/create', async (data: Partial<Task> & { project: string }, { rejectWithValue }) => {
  try { const r = await taskApi.create(data); return r.data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to create task'); }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }: { id: string; data: Partial<Task> }, { rejectWithValue }) => {
  try { const r = await taskApi.update(id, data); return r.data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to update task'); }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id: string, { rejectWithValue }) => {
  try { await taskApi.delete(id); return id; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to delete task'); }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearCurrent: (s) => { s.current = null; },
    clearError: (s) => { s.error = null; },
    setCurrent: (s, a) => { s.current = a.payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchTasks.pending, (s) => { s.isLoading = true; s.error = null; });
    b.addCase(fetchTasks.fulfilled, (s, a) => { s.isLoading = false; s.tasks = a.payload.data as Task[]; s.pagination = a.payload.pagination || null; });
    b.addCase(fetchTasks.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
    b.addCase(fetchTask.fulfilled, (s, a) => { s.current = (a.payload as any)?.task || a.payload; });
    b.addCase(createTask.fulfilled, (s, a) => { const t = (a.payload as any)?.task || a.payload; s.tasks.unshift(t); });
    b.addCase(updateTask.fulfilled, (s, a) => { const t = (a.payload as any)?.task || a.payload; s.tasks = s.tasks.map((x) => x._id === t._id ? t : x); if (s.current?._id === t._id) s.current = t; });
    b.addCase(deleteTask.fulfilled, (s, a) => { s.tasks = s.tasks.filter((t) => t._id !== a.payload); });
  },
});

export const { clearCurrent, clearError, setCurrent } = taskSlice.actions;
export default taskSlice.reducer;

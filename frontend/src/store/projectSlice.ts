import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '@/api/endpoints';
import type { Project, Pagination } from '@/types';

interface ProjectState {
  projects: Project[];
  current: Project | null;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = { projects: [], current: null, pagination: null, isLoading: false, error: null };

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params: Record<string, string> = {}, { rejectWithValue }) => {
  try { const r = await projectApi.getAll(params); return { data: r.data.data, pagination: r.data.pagination }; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch projects'); }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id: string, { rejectWithValue }) => {
  try { const r = await projectApi.getById(id); return r.data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch project'); }
});

export const createProject = createAsyncThunk('projects/create', async (data: Partial<Project>, { rejectWithValue }) => {
  try { const r = await projectApi.create(data); return r.data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to create project'); }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }: { id: string; data: Partial<Project> }, { rejectWithValue }) => {
  try { const r = await projectApi.update(id, data); return r.data.data; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to update project'); }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id: string, { rejectWithValue }) => {
  try { await projectApi.delete(id); return id; }
  catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Failed to delete project'); }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrent: (s) => { s.current = null; },
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchProjects.pending, (s) => { s.isLoading = true; s.error = null; });
    b.addCase(fetchProjects.fulfilled, (s, a) => { s.isLoading = false; s.projects = a.payload.data as Project[]; s.pagination = a.payload.pagination || null; });
    b.addCase(fetchProjects.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
    b.addCase(fetchProject.fulfilled, (s, a) => { s.current = (a.payload as any)?.project || a.payload; });
    b.addCase(createProject.fulfilled, (s, a) => { const p = (a.payload as any)?.project || a.payload; s.projects.unshift(p); });
    b.addCase(updateProject.fulfilled, (s, a) => { const p = (a.payload as any)?.project || a.payload; s.projects = s.projects.map((x) => x._id === p._id ? p : x); if (s.current?._id === p._id) s.current = p; });
    b.addCase(deleteProject.fulfilled, (s, a) => { s.projects = s.projects.filter((p) => p._id !== a.payload); });
  },
});

export const { clearCurrent, clearError } = projectSlice.actions;
export default projectSlice.reducer;

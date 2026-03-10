import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Job, JobFilters } from '@/types'

interface JobsState {
  items: Job[]
  total: number
  page: number
  loading: boolean
  filters: JobFilters
}

const initialState: JobsState = { items: [], total: 0, page: 1, loading: false, filters: {} }

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs(state, action: PayloadAction<{ items: Job[]; total: number }>) {
      state.items = action.payload.items
      state.total = action.payload.total
    },
    setPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setFilters(state, action: PayloadAction<JobFilters>) { state.filters = action.payload },
    setLoading(state, action: PayloadAction<boolean>) { state.loading = action.payload },
  },
})
export const { setJobs, setPage: setJobsPage, setFilters: setJobsFilters, setLoading: setJobsLoading } = jobsSlice.actions
export default jobsSlice.reducer

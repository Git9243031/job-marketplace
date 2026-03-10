import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Resume, ResumeFilters } from '@/types'

interface ResumesState {
  items: Resume[]
  total: number
  page: number
  loading: boolean
  filters: ResumeFilters
}

const initialState: ResumesState = { items: [], total: 0, page: 1, loading: false, filters: {} }

const resumesSlice = createSlice({
  name: 'resumes',
  initialState,
  reducers: {
    setResumes(state, action: PayloadAction<{ items: Resume[]; total: number }>) {
      state.items = action.payload.items
      state.total = action.payload.total
    },
    setPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setFilters(state, action: PayloadAction<ResumeFilters>) { state.filters = action.payload },
    setLoading(state, action: PayloadAction<boolean>) { state.loading = action.payload },
  },
})
export const { setResumes, setPage: setResumesPage, setFilters: setResumesFilters, setLoading: setResumesLoading } = resumesSlice.actions
export default resumesSlice.reducer

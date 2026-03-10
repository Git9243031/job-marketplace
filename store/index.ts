import { configureStore } from '@reduxjs/toolkit'
import authReducer    from './slices/authSlice'
import jobsReducer    from './slices/jobsSlice'
import resumesReducer from './slices/resumesSlice'

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    jobs:    jobsReducer,
    resumes: resumesReducer,
  },
})
export type RootState   = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

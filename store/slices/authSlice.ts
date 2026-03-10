import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'

interface AuthState { user: User | null; isAuthenticated: boolean; loading: boolean }
const initialState: AuthState = { user: null, isAuthenticated: false, loading: true }

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.loading = false
    },
    setLoading(state, action: PayloadAction<boolean>) { state.loading = action.payload },
  },
})
export const { setUser, setLoading } = authSlice.actions
export default authSlice.reducer

'use client'
import { useEffect } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setUser, setLoading } from '@/store/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const getUser = async () => {
      dispatch(setLoading(true))
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        dispatch(setUser(data))
      } else {
        dispatch(setUser(null))
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
        dispatch(setUser(data))
      } else {
        dispatch(setUser(null))
      }
    })
    return () => subscription.unsubscribe()
  }, [dispatch])

  return <>{children}</>
}

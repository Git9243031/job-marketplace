import { supabase } from '@/lib/supabaseClient'
import type { Role } from '@/types'

export const authService = {
  async signUp(email: string, password: string, role: Role) {
    return supabase.auth.signUp({ email, password, options: { data: { role } } })
  },
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },
  async signOut() { return supabase.auth.signOut() },
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    return data
  },
}

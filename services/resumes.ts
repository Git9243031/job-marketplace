import { supabase } from '@/lib/supabaseClient'

export const resumesService = {
  async getResumes(filters?: any, page=1, size=9) {
    let q = supabase
      .from('resumes')
      .select('*', { count: 'exact' })
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * size, page * size - 1)

    if (filters?.q)       q = q.or(`name.ilike.%${filters.q}%,title.ilike.%${filters.q}%`)
    if (filters?.sphere && filters.sphere !== 'all')  q = q.eq('sphere', filters.sphere)
    if (filters?.level && filters.level !== 'all')    q = q.eq('experience_level', filters.level)
    if (filters?.format && filters.format !== 'all')  q = q.eq('format', filters.format)
    if (filters?.salaryMax && filters.salaryMax > 0)  q = q.lte('expected_salary', filters.salaryMax)
    return q
  },
  async getResumeById(id: string) {
    return supabase.from('resumes').select('*').eq('id', id).single()
  },
  async getMyResumes(userId: string) {
    return supabase.from('resumes').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  },
  async getAllResumesAdmin() {
    return supabase.from('resumes').select('*').order('created_at', { ascending: false })
  },
  async createResume(resume: any) {
    return supabase.from('resumes').insert({ ...resume, visible: false }).select().single()
  },
  async updateResume(id: string, updates: any) {
    return supabase.from('resumes').update(updates).eq('id', id).select().single()
  },
  async toggleVisibility(id: string, visible: boolean) {
    return supabase.from('resumes').update({ visible }).eq('id', id)
  },
  async deleteResume(id: string) {
    return supabase.from('resumes').delete().eq('id', id)
  },
}

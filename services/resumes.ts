import { supabase } from '@/lib/supabaseClient'

export const resumesService = {
  async getResumes(filters?: any, page=1, size=9) {
    let q = supabase.from('resumes').select('*',{count:'exact'}).eq('visible',true).order('created_at',{ascending:false}).range((page-1)*size, page*size-1)
    if (filters?.sphere) q = q.eq('sphere', filters.sphere)
    if (filters?.location) q = q.ilike('location',`%${filters.location}%`)
    if (filters?.q) q = q.or(`name.ilike.%${filters.q}%,title.ilike.%${filters.q}%`)
    return q
  },
  async getResumeById(id: string) { return supabase.from('resumes').select('*').eq('id',id).single() },
  async getMyResumes(userId: string) { return supabase.from('resumes').select('*').eq('user_id',userId).order('created_at',{ascending:false}) },
  async getAllResumesAdmin() { return supabase.from('resumes').select('*').order('created_at',{ascending:false}) },
  async createResume(data: any) { return supabase.from('resumes').insert({...data, visible:false}).select().single() },
  async updateResume(id: string, updates: any) { return supabase.from('resumes').update(updates).eq('id',id).select().single() },
  async toggleVisibility(id: string, visible: boolean) { return supabase.from('resumes').update({visible}).eq('id',id) },
  async deleteResume(id: string) { return supabase.from('resumes').delete().eq('id',id) },
}

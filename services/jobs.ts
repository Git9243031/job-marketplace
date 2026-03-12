import { supabase } from '@/lib/supabaseClient'
import type { Job } from '@/types'

export const jobsService = {
  async getJobs(filters?: any, page=1, size=9) {
    let q = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * size, page * size - 1)

    if (filters?.q)          q = q.or(`title.ilike.%${filters.q}%,company.ilike.%${filters.q}%`)
    if (filters?.location)   q = q.ilike('location', `%${filters.location}%`)
    if (filters?.sphere && filters.sphere !== 'all') q = q.eq('sphere', filters.sphere)
    if (filters?.subSphere && filters.subSphere !== 'all') {
      const subs = filters.subSphere.split(',').filter(Boolean)
      if (subs.length === 1) q = q.eq('sub_sphere', subs[0])
      else q = q.in('sub_sphere', subs)
    }
    if (filters?.level && filters.level !== 'all')   q = q.eq('experience_level', filters.level)
    if (filters?.format && filters.format !== 'all') q = q.eq('format', filters.format)
    if (filters?.jobType && filters.jobType !== 'all') q = q.eq('job_type', filters.jobType)
    if (filters?.salaryMin && filters.salaryMin > 0) q = q.gte('salary_max', filters.salaryMin)
    if (filters?.hot)      q = q.eq('is_hot', true)
    if (filters?.featured) q = q.eq('is_featured', true)
    return q
  },
  async getJobById(id: string) {
    return supabase.from('jobs').select('*').eq('id', id).single()
  },
  async getMyJobs(userId: string) {
    return supabase.from('jobs').select('*').eq('created_by', userId).order('created_at', { ascending: false })
  },
  async getAllJobsAdmin() {
    return supabase.from('jobs').select('*').order('created_at', { ascending: false })
  },
  async createJob(job: any) {
    // visible берётся из переданных данных; source_type всегда REAL для созданных через сайт
    return supabase.from('jobs').insert({ ...job, source_type: 'REAL' }).select().single()
  },
  async updateJob(id: string, updates: Partial<Job>) {
    return supabase.from('jobs').update(updates).eq('id', id).select().single()
  },
  async toggleVisibility(id: string, visible: boolean) {
    return supabase.from('jobs').update({ visible }).eq('id', id)
  },
  async deleteJob(id: string) {
    return supabase.from('jobs').delete().eq('id', id)
  },
}

import { supabase } from '@/lib/supabaseClient'
import type { Job } from '@/types'

// Конвертирует пустые строки в null для полей с CHECK constraint
function sanitizeJob(job: Record<string, any>): Record<string, any> {
  const nullableFields = ['contract_type', 'sphere', 'format', 'job_type', 'experience_level', 'location', 'contact']
  const result = { ...job }
  for (const field of nullableFields) {
    if (result[field] === '' || result[field] === undefined) {
      result[field] = null
    }
  }
  if (result.salary_min === '' || result.salary_min === 0) result.salary_min = null
  if (result.salary_max === '' || result.salary_max === 0) result.salary_max = null
  return result
}


export const jobsService = {
  async getJobs(filters?: any, page=1, size=9) {
    let q = supabase.from('jobs').select('*',{count:'exact'}).eq('visible',true).order('created_at',{ascending:false}).range((page-1)*size, page*size-1)
    if (filters?.location) q = q.ilike('location',`%${filters.location}%`)
    if (filters?.sphere) q = q.eq('sphere', filters.sphere)
    if (filters?.experience_level) q = q.eq('experience_level', filters.experience_level)
    if (filters?.job_type) q = q.eq('job_type', filters.job_type)
    if (filters?.format) q = q.eq('format', filters.format)
    if (filters?.salary_min) q = q.gte('salary_max', filters.salary_min)
    if (filters?.q) q = q.or(`title.ilike.%${filters.q}%,company.ilike.%${filters.q}%`)
    return q
  },
  async getJobById(id: string) { return supabase.from('jobs').select('*').eq('id',id).single() },
  async getMyJobs(userId: string) { return supabase.from('jobs').select('*').eq('created_by',userId).order('created_at',{ascending:false}) },
  async getAllJobsAdmin() { return supabase.from('jobs').select('*').order('created_at',{ascending:false}) },
  async createJob(job: any) { return supabase.from('jobs').insert(sanitizeJob({...job, visible:false})).select().single() },
  async updateJob(id: string, updates: Partial<Job>) { return supabase.from('jobs').update(updates).eq('id',id).select().single() },
  async toggleVisibility(id: string, visible: boolean) { return supabase.from('jobs').update({visible}).eq('id',id) },
  async deleteJob(id: string) { return supabase.from('jobs').delete().eq('id',id) },
}

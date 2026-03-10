import { supabase } from '@/lib/supabaseClient'

export const adminService = {
  async getSettings() { return supabase.from('settings').select('*').eq('id',1).single() },
  async updateTelegramAutopost(enabled: boolean) { return supabase.from('settings').update({telegram_autopost_enabled:enabled}).eq('id',1) },
  async updateHeaderEnabled(enabled: boolean) { return supabase.from('settings').update({header_enabled:enabled}).eq('id',1) },
  async getStats() {
    const [jobs, resumes, users] = await Promise.all([
      supabase.from('jobs').select('id,visible',{count:'exact'}),
      supabase.from('resumes').select('id,visible',{count:'exact'}),
      supabase.from('users').select('id,role',{count:'exact'}),
    ])
    return {
      totalJobs:      jobs.count     || 0,
      visibleJobs:    (jobs.data     || []).filter((j:any) => j.visible).length,
      totalResumes:   resumes.count  || 0,
      visibleResumes: (resumes.data  || []).filter((r:any) => r.visible).length,
      totalUsers:     users.count    || 0,
      hrCount:        (users.data    || []).filter((u:any) => u.role === 'hr').length,
      candidateCount: (users.data    || []).filter((u:any) => u.role === 'candidate').length,
    }
  },
}

// Дописываем методы — если файл уже экспортировал объект, используем отдельные экспорты
export async function updateAutoApproveJobs(enabled: boolean) {
  return supabase.from('settings').update({ auto_approve_jobs: enabled }).eq('id', 1)
}
export async function updateAutoApproveTelegram(enabled: boolean) {
  return supabase.from('settings').update({ auto_approve_telegram: enabled }).eq('id', 1)
}

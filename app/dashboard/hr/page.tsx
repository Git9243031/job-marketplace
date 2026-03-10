'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, LogOut, Eye, EyeOff, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { jobsService } from '@/services/jobs'
import { formatSalaryShort, formatDate } from '@/lib/utils'
import type { Job } from '@/types'

export default function HRDashboard() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (!u || (u.role !== 'hr' && u.role !== 'admin')) { router.push('/'); return }
      setUser(u)
      const { data: myJobs } = await jobsService.getMyJobs(data.user.id)
      setJobs(myJobs || [])
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  const SPHERE_RU: Record<string,string> = {it:'IT',design:'Дизайн',marketing:'Маркетинг',finance:'Финансы',hr:'HR',sales:'Продажи',legal:'Юриспруденция',other:'Другое'}

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Кабинет HR</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/hr/create-job" className="flex items-center gap-2 h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors"><Plus size={15}/>Создать вакансию</Link>
          <button onClick={handleLogout} className="flex items-center gap-2 h-10 px-4 border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] text-sm rounded-[10px]"><LogOut size={14}/>Выйти</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[['Всего вакансий',jobs.length,'text-[#7C3AED]'],['Опубликовано',jobs.filter(j=>j.visible).length,'text-[#10B981]'],['На модерации',jobs.filter(j=>!j.visible).length,'text-amber-600']].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-[#64748B] mt-1">{l}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-dashed border-[#E5E7EB] p-16 text-center">
          <Briefcase size={28} className="text-[#94A3B8] mx-auto mb-3"/>
          <h3 className="font-semibold text-[#0F172A] mb-1">Нет вакансий</h3>
          <p className="text-sm text-[#64748B] mb-5">Создайте первую вакансию</p>
          <Link href="/dashboard/hr/create-job" className="inline-flex items-center gap-2 h-10 px-5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors"><Plus size={14}/>Создать</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job=>(
            <div key={job.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-[#0F172A] truncate">{job.title}</p>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${job.visible?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>
                    {job.visible?'Опубликовано':'На модерации'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  {job.company} · {job.sphere?SPHERE_RU[job.sphere]||job.sphere:''} · {formatSalaryShort(job.salary_min,job.salary_max)||'ЗП не указана'} · {formatDate(job.created_at)}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Link href={`/jobs/${job.id}`} className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors"><Eye size={13}/></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

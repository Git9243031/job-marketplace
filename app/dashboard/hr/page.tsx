'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, LogOut, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const SPHERE_RU: Record<string,string> = {
  it:'IT', design:'Дизайн', marketing:'Маркетинг',
  finance:'Финансы', hr:'HR', sales:'Продажи',
  legal:'Юриспруденция', other:'Другое',
}

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return 'ЗП не указана'
  const f = (n: number) => n >= 1000 ? `${Math.round(n/1000)}к` : String(n)
  if (min && max) return `${f(min)}–${f(max)} ₽`
  if (min) return `от ${f(min)} ₽`
  return `до ${f(max!)} ₽`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })
}

export default function HRDashboard() {
  const [user, setUser]   = useState<any>(null)
  const [jobs, setJobs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    // Таймаут — если Supabase не ответил за 8 сек, показываем ошибку
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError('Supabase не отвечает. Проверьте подключение.')
        setLoading(false)
      }
    }, 8000)

    async function init() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) { router.push('/auth/login'); return }

        // Загружаем профиль
        const { data: u, error: uErr } = await supabase
          .from('users').select('*').eq('id', authData.user.id).single()

        if (uErr || !u) {
          setError('Не удалось загрузить профиль: ' + (uErr?.message || 'нет данных'))
          setLoading(false)
          return
        }

        // Проверяем роль
        if (u.role !== 'hr' && u.role !== 'admin') {
          router.push(u.role === 'candidate' ? '/dashboard/candidate' : '/')
          return
        }

        if (cancelled) return
        setUser(u)

        // Загружаем ВСЕ вакансии HR-а (включая невидимые)
        // Важно: запрос идёт с auth токеном, RLS политика jobs_select_own разрешает
        const { data: myJobs, error: jErr } = await supabase
          .from('jobs')
          .select('*')
          .eq('created_by', authData.user.id)
          .order('created_at', { ascending: false })

        if (jErr) {
          setError('Ошибка загрузки вакансий: ' + jErr.message)
        } else {
          setJobs(myJobs || [])
        }
      } catch (e: any) {
        setError('Ошибка: ' + e.message)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    init()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
      <p className="text-sm text-[#94A3B8]">Загрузка кабинета...</p>
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-[#0F172A] mb-2">Ошибка загрузки</h2>
      <p className="text-sm text-[#64748B] mb-6">{error}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => window.location.reload()}
          className="h-9 px-4 bg-[#7C3AED] text-white text-sm rounded-[8px] hover:bg-[#6D28D9]">
          Обновить
        </button>
        <Link href="/status"
          className="h-9 px-4 border border-[#E5E7EB] text-sm rounded-[8px] text-[#64748B] hover:bg-[#F8FAFC] flex items-center">
          Проверить статус
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Кабинет HR</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{user?.name || user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/hr/create-job"
            className="flex items-center gap-2 h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors">
            <Plus size={15}/>Создать вакансию
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 h-10 px-4 border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] text-sm rounded-[10px]">
            <LogOut size={14}/>Выйти
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          ['Всего вакансий',   jobs.length,                          'text-[#7C3AED]'],
          ['Опубликовано',     jobs.filter(j => j.visible).length,   'text-[#10B981]'],
          ['На модерации',     jobs.filter(j => !j.visible).length,  'text-amber-600'],
        ].map(([l, v, c]) => (
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
          <Link href="/dashboard/hr/create-job"
            className="inline-flex items-center gap-2 h-10 px-5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors">
            <Plus size={14}/>Создать
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-medium text-[#0F172A] truncate">{job.title}</p>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${job.visible ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {job.visible ? 'Опубликовано' : 'На модерации'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  {job.company}
                  {job.sphere ? ` · ${SPHERE_RU[job.sphere] || job.sphere}` : ''}
                  {' · '}{fmtSalary(job.salary_min, job.salary_max)}
                  {' · '}{fmtDate(job.created_at)}
                </p>
              </div>
              <Link href={`/jobs/${job.id}`}
                className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors">
                <Eye size={13}/>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

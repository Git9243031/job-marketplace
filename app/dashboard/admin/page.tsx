'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, LogOut, Eye, EyeOff, Trash2, Users, Briefcase, FileText, ToggleLeft, ToggleRight, TrendingUp, Clock, CheckCircle, XCircle, Layout } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { jobsService } from '@/services/jobs'
import { resumesService } from '@/services/resumes'
import { adminService } from '@/services/admin'
import { formatDate, formatSalaryShort, cn } from '@/lib/utils'
import type { Job, Resume } from '@/types'

type Tab = 'overview' | 'jobs' | 'resumes' | 'users' | 'settings'

const TAB_LABELS: Record<Tab,string> = {
  overview: 'Обзор', jobs: 'Вакансии', resumes: 'Резюме', users: 'Пользователи', settings: 'Настройки'
}

function StatCard({ icon:Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center', color+'/10')}><Icon size={16} className={color.replace('bg-','text-')}/></div>
      </div>
      <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
      <p className="text-xs text-[#64748B] mt-0.5">{label}</p>
      {sub&&<p className="text-[11px] text-[#94A3B8] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [settings, setSettings] = useState({ telegram_autopost_enabled: false, header_enabled: true, auto_approve_jobs: false, auto_approve_telegram: false })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (!u || u.role !== 'admin') { router.push('/'); return }
      setUser(u)
      const [j, r, us, s] = await Promise.all([
        jobsService.getAllJobsAdmin(),
        resumesService.getAllResumesAdmin(),
        supabase.from('users').select('*').order('created_at'),
        adminService.getSettings(),
      ])
      setJobs(j.data || [])
      setResumes(r.data || [])
      setUsers(us.data || [])
      if (s.data) setSettings({ telegram_autopost_enabled: s.data.telegram_autopost_enabled, header_enabled: s.data.header_enabled ?? true, auto_approve_jobs: s.data.auto_approve_jobs ?? false, auto_approve_telegram: s.data.auto_approve_telegram ?? false })
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  const toggleJobVis = async (id: string, cur: boolean) => {
    await jobsService.toggleVisibility(id, !cur)
    setJobs(prev => prev.map(j => j.id===id?{...j,visible:!cur}:j))
  }
  const toggleResumeVis = async (id: string, cur: boolean) => {
    await resumesService.toggleVisibility(id, !cur)
    setResumes(prev => prev.map(r => r.id===id?{...r,visible:!cur}:r))
  }
  const toggleTelegram = async () => {
    const next = !settings.telegram_autopost_enabled
    await adminService.updateTelegramAutopost(next)
    setSettings(s=>({...s,telegram_autopost_enabled:next}))
  }
  const toggleHeader = async () => {
    const next = !settings.header_enabled
    await adminService.updateHeaderEnabled(next)
    setSettings(s=>({...s,header_enabled:next}))
  }
  const toggleAutoApproveJobs = async () => {
    const next = !settings.auto_approve_jobs
    const { updateAutoApproveJobs } = await import('@/services/admin')
    await updateAutoApproveJobs(next)
    setSettings(s=>({...s,auto_approve_jobs:next}))
  }
  const toggleAutoApproveTelegram = async () => {
    const next = !settings.auto_approve_telegram
    const { updateAutoApproveTelegram } = await import('@/services/admin')
    await updateAutoApproveTelegram(next)
    setSettings(s=>({...s,auto_approve_telegram:next}))
  }
  const deleteJob = async (id: string) => {
    if (!confirm('Удалить вакансию?')) return
    await jobsService.deleteJob(id)
    setJobs(prev=>prev.filter(j=>j.id!==id))
  }
  const deleteResume = async (id: string) => {
    if (!confirm('Удалить резюме?')) return
    await resumesService.deleteResume(id)
    setResumes(prev=>prev.filter(r=>r.id!==id))
  }

  const SPHERE_RU: Record<string,string> = {it:'IT',design:'Дизайн',marketing:'Маркетинг',finance:'Финансы',hr:'HR',sales:'Продажи',legal:'Юриспруденция',other:'Другое'}
  const ROLE_RU: Record<string,string> = {admin:'Администратор',hr:'HR',candidate:'Соискатель'}
  const ROLE_COLOR: Record<string,string> = {admin:'bg-red-50 text-red-700',hr:'bg-blue-50 text-blue-700',candidate:'bg-green-50 text-green-700'}

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/></div>

  const stats = {
    totalJobs:    jobs.length,
    pubJobs:      jobs.filter(j=>j.visible).length,
    pendingJobs:  jobs.filter(j=>!j.visible).length,
    totalResumes: resumes.length,
    pubResumes:   resumes.filter(r=>r.visible).length,
    totalUsers:   users.length,
    hrUsers:      users.filter(u=>u.role==='hr').length,
    candidates:   users.filter(u=>u.role==='candidate').length,
    recentJobs:   jobs.filter(j=>new Date(j.created_at)>new Date(Date.now()-7*86400000)).length,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EDE9FE] rounded-xl flex items-center justify-center"><ShieldCheck size={18} className="text-[#7C3AED]"/></div>
          <div><h1 className="text-2xl font-bold text-[#0F172A]">Панель администратора</h1><p className="text-sm text-[#64748B]">{user?.email}</p></div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 h-10 px-4 border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] text-sm rounded-[10px]"><LogOut size={14}/>Выйти</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] p-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn('flex-1 py-2 text-xs font-medium rounded-[8px] transition-all', tab===t?'bg-white text-[#7C3AED] shadow-sm':'text-[#64748B] hover:text-[#0F172A]')}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Briefcase}   label="Всего вакансий"   value={stats.totalJobs}    sub={`${stats.pubJobs} опубликовано`}    color="bg-[#7C3AED]"/>
            <StatCard icon={CheckCircle} label="На модерации"     value={stats.pendingJobs}  sub="ждут одобрения"                      color="bg-amber-500"/>
            <StatCard icon={FileText}    label="Всего резюме"     value={stats.totalResumes} sub={`${stats.pubResumes} опубликовано`}  color="bg-[#10B981]"/>
            <StatCard icon={Users}       label="Пользователей"    value={stats.totalUsers}   sub={`${stats.hrUsers} HR, ${stats.candidates} кандидатов`} color="bg-blue-500"/>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pending jobs */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#0F172A]">Ожидают проверки</h2>
                <button onClick={()=>setTab('jobs')} className="text-xs text-[#7C3AED] hover:underline">Все →</button>
              </div>
              {jobs.filter(j=>!j.visible).slice(0,5).map(j=>(
                <div key={j.id} className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0">
                  <div className="min-w-0"><p className="text-sm font-medium text-[#0F172A] truncate">{j.title}</p><p className="text-xs text-[#64748B]">{j.company}</p></div>
                  <button onClick={()=>toggleJobVis(j.id,j.visible)} className="shrink-0 ml-3 h-7 px-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs rounded-[6px] transition-colors">Одобрить</button>
                </div>
              ))}
              {jobs.filter(j=>!j.visible).length===0&&<p className="text-sm text-[#94A3B8] text-center py-4">Нет ожидающих</p>}
            </div>
            {/* Recent activity */}
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6">
              <h2 className="font-semibold text-[#0F172A] mb-4">Последние вакансии</h2>
              {jobs.slice(0,5).map(j=>(
                <div key={j.id} className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0">
                  <div className="min-w-0"><p className="text-sm font-medium text-[#0F172A] truncate">{j.title}</p><p className="text-xs text-[#64748B]">{j.company} · {formatDate(j.created_at)}</p></div>
                  <span className={cn('shrink-0 ml-3 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', j.visible?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700')}>{j.visible?'Опубл.':'Модерация'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── JOBS ── */}
      {tab==='jobs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748B]">Всего: <span className="font-semibold text-[#0F172A]">{jobs.length}</span></p>
            <div className="flex gap-2 text-xs"><span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ {stats.pubJobs} опубликовано</span><span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">⏳ {stats.pendingJobs} на модерации</span></div>
          </div>
          {jobs.map(j=>(
            <div key={j.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-[#0F172A] truncate">{j.title}</p>
                  <span className={cn('shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', j.visible?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700')}>{j.visible?'Опубликовано':'На модерации'}</span>
                </div>
                <p className="text-xs text-[#64748B]">{j.company} · {j.sphere?SPHERE_RU[j.sphere]||j.sphere:''} · {formatSalaryShort(j.salary_min,j.salary_max)||'ЗП не указана'} · {formatDate(j.created_at)}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={()=>toggleJobVis(j.id,j.visible)} className={cn('h-8 px-3 text-xs font-medium rounded-[6px] flex items-center gap-1 transition-colors', j.visible?'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E5E7EB]':'bg-[#10B981] text-white hover:bg-[#059669]')}>
                  {j.visible?<><EyeOff size={11}/>Скрыть</>:<><Eye size={11}/>Одобрить</>}
                </button>
                <button onClick={()=>deleteJob(j.id)} className="w-8 h-8 rounded-[6px] bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition-colors"><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RESUMES ── */}
      {tab==='resumes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748B]">Всего: <span className="font-semibold text-[#0F172A]">{resumes.length}</span></p>
            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">✓ {stats.pubResumes} опубликовано</span>
          </div>
          {resumes.map(r=>(
            <div key={r.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-[#0F172A]">{r.name}</p>
                  <span className={cn('shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', r.visible?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700')}>{r.visible?'Опубликовано':'На модерации'}</span>
                </div>
                <p className="text-xs text-[#64748B]">{r.title} · {r.location||'Локация не указана'} · {formatDate(r.created_at)}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={()=>toggleResumeVis(r.id,r.visible)} className={cn('h-8 px-3 text-xs font-medium rounded-[6px] flex items-center gap-1 transition-colors', r.visible?'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E5E7EB]':'bg-[#10B981] text-white hover:bg-[#059669]')}>
                  {r.visible?<><EyeOff size={11}/>Скрыть</>:<><Eye size={11}/>Одобрить</>}
                </button>
                <button onClick={()=>deleteResume(r.id)} className="w-8 h-8 rounded-[6px] bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition-colors"><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── USERS ── */}
      {tab==='users' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[['Всего',stats.totalUsers,'text-[#7C3AED]'],['HR / Рекрутёры',stats.hrUsers,'text-blue-600'],['Соискатели',stats.candidates,'text-green-600']].map(([l,v,c])=>(
              <div key={String(l)} className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
                <p className="text-xs text-[#64748B] mt-1">{l}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="font-semibold text-[#0F172A]">Все пользователи ({users.length})</h2>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {users.map(u=>(
                <div key={u.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-xs font-bold">{u.email?.[0]?.toUpperCase()}</div>
                    <div><p className="text-sm font-medium text-[#0F172A]">{u.email}</p><p className="text-xs text-[#94A3B8]">{formatDate(u.created_at)}</p></div>
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', ROLE_COLOR[u.role]||'bg-gray-50 text-gray-700')}>{ROLE_RU[u.role]||u.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab==='settings' && (
        <div className="max-w-2xl space-y-4">
          {/* Telegram */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5">Telegram-автопостинг</h3>
                <p className="text-sm text-[#64748B]">Автоматически отправлять новые вакансии в Telegram-канал</p>
                <p className={cn('text-xs mt-1 font-medium', settings.telegram_autopost_enabled?'text-green-600':'text-[#94A3B8]')}>
                  {settings.telegram_autopost_enabled?'✅ Включён':'⛔ Отключён'}
                </p>
              </div>
              <button onClick={toggleTelegram} className="flex items-center gap-2">
                {settings.telegram_autopost_enabled
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Header toggle */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5 flex items-center gap-2"><Layout size={15}/>Навигационная шапка</h3>
                <p className="text-sm text-[#64748B]">Показывать/скрывать шапку сайта</p>
                <p className={cn('text-xs mt-1 font-medium', settings.header_enabled?'text-green-600':'text-[#94A3B8]')}>
                  {settings.header_enabled?'✅ Видима':'⛔ Скрыта'}
                </p>
              </div>
              <button onClick={toggleHeader} className="flex items-center gap-2">
                {settings.header_enabled
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Автомодерация вакансий */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5 flex items-center gap-2">🛡 Автомодерация сайта</h3>
                <p className="text-sm text-[#64748B]">Публиковать вакансии сразу без ручного одобрения</p>
                <p className={cn('text-xs mt-1 font-medium', settings.auto_approve_jobs?'text-green-600':'text-[#94A3B8]')}>
                  {settings.auto_approve_jobs?'✅ Включена — вакансии публикуются сразу':'⛔ Выключена — вакансии ждут модерации'}
                </p>
              </div>
              <button onClick={toggleAutoApproveJobs} className="flex items-center gap-2">
                {settings.auto_approve_jobs
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Автопостинг в Telegram */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5 flex items-center gap-2">✈️ Автопостинг в Telegram</h3>
                <p className="text-sm text-[#64748B]">Отправлять новые вакансии в канал автоматически</p>
                <p className={cn('text-xs mt-1 font-medium', settings.auto_approve_telegram?'text-green-600':'text-[#94A3B8]')}>
                  {settings.auto_approve_telegram?'✅ Включён — новые вакансии летят в TG':'⛔ Выключен — только ручная отправка'}
                </p>
              </div>
              <button onClick={toggleAutoApproveTelegram} className="flex items-center gap-2">
                {settings.auto_approve_telegram
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#EDE9FE] rounded-[16px] p-5 text-sm text-[#7C3AED]">
            <p className="font-semibold mb-2">Telegram настройки</p>
            <div className="space-y-1 text-[#6D28D9] text-xs font-mono bg-[#DDD6FE]/50 rounded-[8px] p-3">
              <p>TELEGRAM_BOT_TOKEN=...</p>
              <p>TELEGRAM_CHANNEL_ID=@канал</p>
            </div>
            <p className="text-xs mt-2 text-[#6D28D9]">Настраиваются в файле .env.local</p>
          </div>
        </div>
      )}
    </div>
  )
}

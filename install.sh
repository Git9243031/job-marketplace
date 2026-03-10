#!/bin/bash
# cd job-marketplace && bash ../fix-tg-clicks.sh
set -e

echo "📊 Трекинг кликов на Telegram канал..."

# ─────────────────────────────────────────────────────────────────
# 1. API route — инкремент tg_clicks
# ─────────────────────────────────────────────────────────────────
mkdir -p app/api/jobs/tg-click

cat > app/api/jobs/tg-click/route.ts << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    const { error } = await supabase.rpc('increment_tg_clicks', { job_id: jobId })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
ENDOFFILE

echo "✅ app/api/jobs/tg-click/route.ts"

# ─────────────────────────────────────────────────────────────────
# 2. Обновляем кнопку «Все вакансии в канале» — добавляем onClick
#    Заменяем ApplyBlock чтобы принимать jobId и слать fetch
# ─────────────────────────────────────────────────────────────────
mkdir -p "app/jobs/[id]"

cat > "app/jobs/[id]/page.tsx" << 'ENDOFFILE'
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ArrowLeft, Building2, Clock, Briefcase, DollarSign, Hash, Send, ExternalLink, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

const FORMAT_RU:   Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид' }
const LEVEL_RU:    Record<string,string> = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', any:'Любой' }
const TYPE_RU:     Record<string,string> = { 'full-time':'Полная', 'part-time':'Частичная', contract:'Контракт', freelance:'Фриланс', internship:'Стажировка' }
const CONTRACT_RU: Record<string,string> = { trud:'Трудовой', gph:'ГПХ', ip:'С ИП', selfemployed:'Самозанятый' }
const SPHERE_RU:   Record<string,string> = { it:'IT', design:'Дизайн', marketing:'Маркетинг', finance:'Финансы', hr:'HR', sales:'Продажи', legal:'Юриспруденция', other:'Другое' }
const FC: Record<string,string> = { remote:'bg-emerald-50 text-emerald-700 border-emerald-100', office:'bg-blue-50 text-blue-700 border-blue-100', hybrid:'bg-amber-50 text-amber-700 border-amber-100' }
const LC: Record<string,string> = { junior:'bg-green-50 text-green-700 border-green-100', middle:'bg-blue-50 text-blue-700 border-blue-100', senior:'bg-purple-50 text-purple-700 border-purple-100', lead:'bg-amber-50 text-amber-700 border-amber-100' }

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return null
  const f = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}к` : String(n)
  if (min && max) return `${f(min)} — ${f(max)} ₽`
  if (min) return `от ${f(min)} ₽`
  return `до ${f(max!)} ₽`
}

function timeAgo(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000)
  if (d === 0) return 'сегодня'
  if (d === 1) return 'вчера'
  if (d < 7)  return `${d} дн. назад`
  return `${Math.floor(d / 7)} нед. назад`
}

function pluralViews(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'просмотр'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'просмотра'
  return 'просмотров'
}

function ApplyBlock({ job, canSeeViews }: { job: any; canSeeViews: boolean }) {
  const salary      = fmtSalary(job.salary_min, job.salary_max)
  const isTg        = job.contact?.startsWith('@')
  const contactHref = isTg ? `https://t.me/${job.contact.slice(1)}` : job.contact ? `mailto:${job.contact}` : null

  const handleTgClick = () => {
    // fire-and-forget — не блокируем переход
    fetch('/api/jobs/tg-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(() => {})
  }

  return (
    <>
      <style>{`
        @keyframes levitate  { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-8px) rotate(1deg)} }
        @keyframes levitate2 { 0%,100%{transform:translateY(0px) rotate(2deg)}  50%{transform:translateY(-6px) rotate(-1deg)} }
        @keyframes orb-pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.15);opacity:0.6} }
        .levitate  { animation: levitate  3.2s ease-in-out infinite; }
        .levitate2 { animation: levitate2 2.8s ease-in-out infinite; }
        .orb-pulse { animation: orb-pulse 4s   ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-[28px] bg-white border border-[#E5E7EB] shadow-[0_20px_60px_-10px_rgba(124,58,237,0.18)]">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] orb-pulse pointer-events-none" style={{filter:'blur(2px)',opacity:0.3}}/>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] orb-pulse pointer-events-none" style={{filter:'blur(3px)',opacity:0.2,animationDelay:'1.5s'}}/>

        <div className="relative p-6">
          <div className="flex justify-center mb-5">
            <div className="levitate inline-flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {job.company.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] leading-none">{job.company}</p>
                {job.location && <p className="text-[11px] text-[#94A3B8] mt-0.5">{job.location}</p>}
              </div>
            </div>
          </div>

          {salary && (
            <div className="levitate2 text-center mb-5">
              <span className="inline-block bg-gradient-to-r from-[#059669] to-[#10B981] text-white text-lg font-black px-5 py-2 rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.35)] tracking-tight">{salary}</span>
              <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium">в месяц</p>
            </div>
          )}

          <div className="border-t border-dashed border-[#E5E7EB] mb-5"/>

          <div className="space-y-2.5">
            {contactHref ? (
              <a href={contactHref} target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-between w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-bold text-sm shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 transition-all duration-200">
                <span className="flex items-center gap-2.5">
                  {isTg ? <Send size={16} className="shrink-0"/> : <ExternalLink size={16} className="shrink-0"/>}
                  {isTg ? 'Написать в Telegram' : 'Написать на email'}
                </span>
                <span className="text-white/60 group-hover:text-white transition-colors text-lg leading-none">→</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl bg-[#F1F5F9] text-[#94A3B8] text-sm font-medium">
                Контакт не указан
              </div>
            )}

            {/* Кнопка TG — с трекингом клика */}
            <a
              href="https://t.me/joba_box"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleTgClick}
              className="group flex items-center justify-between w-full px-5 py-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-semibold text-sm hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:-translate-y-0.5 transition-all duration-200">
              <span className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Все вакансии в канале
              </span>
              <span className="text-[#93C5FD] group-hover:text-[#2563EB] transition-colors font-bold">@joba_box</span>
            </a>
          </div>

          {/* Дата и просмотры — каждый на своей строке */}
          <div className="mt-3 pt-3 border-t border-dashed border-[#E5E7EB] flex flex-col items-center gap-1">
            <p className="text-[11px] text-[#CBD5E1] flex items-center gap-1">
              <Clock size={11}/>Опубликовано {timeAgo(job.created_at)}
            </p>
            {canSeeViews && (
              <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                <Eye size={11}/>{job.views ?? 0} {pluralViews(job.views ?? 0)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Детали */}
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.09)] transition-shadow duration-300">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-4">О вакансии</p>
        <div className="space-y-3">
          {job.format && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Формат</span>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', FC[job.format] || 'bg-gray-50 text-gray-600')}>{FORMAT_RU[job.format]}</span>
            </div>
          )}
          {job.experience_level && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Уровень</span>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', LC[job.experience_level] || 'bg-gray-50 text-gray-600')}>{LEVEL_RU[job.experience_level]}</span>
            </div>
          )}
          {job.job_type && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Занятость</span>
              <span className="text-xs font-semibold text-[#0F172A]">{TYPE_RU[job.job_type]}</span>
            </div>
          )}
          {job.contract_type && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Договор</span>
              <span className="text-xs font-semibold text-[#7C3AED]">{CONTRACT_RU[job.contract_type]}</span>
            </div>
          )}
          {job.location && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Город</span>
              <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                <MapPin size={11} className="text-[#94A3B8]"/>{job.location}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function JobDetailPage() {
  const { id } = useParams() as { id: string }
  const [job, setJob]                 = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [canSeeViews, setCanSeeViews] = useState(false)

  useEffect(() => {
    if (!id) return

    supabase.from('jobs').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false) })

    // Инкремент просмотра
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id }),
    }).catch(() => {})

    // Роль
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('users').select('role').eq('id', session.user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.role === 'admin' || data?.role === 'hr') setCanSeeViews(true)
        })
    })
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
    </div>
  )

  if (!job) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Вакансия не найдена</h1>
      <p className="text-sm text-[#64748B] mb-4">Возможно, она была удалена или ещё не опубликована.</p>
      <Link href="/" className="text-[#7C3AED] hover:underline text-sm">← Вернуться к вакансиям</Link>
    </div>
  )

  const salary = fmtSalary(job.salary_min, job.salary_max)

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft size={14}/>Назад к вакансиям
        </Link>
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
            <div className="flex gap-2 mb-4 flex-wrap">
              {job.sphere && <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] border border-[#E5E7EB] px-2.5 py-1 rounded-full">{SPHERE_RU[job.sphere] || job.sphere}</span>}
              {job.experience_level && <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', LC[job.experience_level] || 'bg-gray-50 text-gray-600 border-gray-100')}>{LEVEL_RU[job.experience_level]}</span>}
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 leading-tight">{job.title}</h1>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-[#7C3AED] font-semibold"><Building2 size={15}/>{job.company}</div>
              {canSeeViews && (
                <div className="flex items-center gap-1 text-[#94A3B8] text-xs bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E5E7EB]">
                  <Eye size={12}/><span>{job.views ?? 0} {pluralViews(job.views ?? 0)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {job.format && <span className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border', FC[job.format] || 'bg-gray-50 text-gray-600 border-gray-100')}><MapPin size={13}/>{FORMAT_RU[job.format]}</span>}
              {job.job_type && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"><Briefcase size={13}/>{TYPE_RU[job.job_type]}</span>}
              {job.contract_type && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#DDD6FE] bg-[#EDE9FE] text-[#7C3AED]">{CONTRACT_RU[job.contract_type]}</span>}
              {salary && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-[#F0FDF4] text-[#059669] border-[#D1FAE5]"><DollarSign size={13}/>{salary}</span>}
              <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#94A3B8]"><Clock size={13}/>{timeAgo(job.created_at)}</span>
            </div>
            {job.skills?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Стек / Навыки</p>
                <div className="flex flex-wrap gap-2">{job.skills.map((s: string) => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] font-medium">{s}</span>)}</div>
              </div>
            )}
            {job.tags?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 flex items-center gap-1"><Hash size={11}/>Теги</p>
                <div className="flex flex-wrap gap-1.5">{job.tags.map((t: string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">{t}</span>)}</div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Описание</p>
              <div className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </div>
          </div>
          <div className="space-y-4"><ApplyBlock job={job} canSeeViews={canSeeViews}/></div>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

echo "✅ app/jobs/[id]/page.tsx — onClick трекинг на TG кнопке"

# ─────────────────────────────────────────────────────────────────
# 3. Таб «Аналитика» в админке
# ─────────────────────────────────────────────────────────────────
mkdir -p app/dashboard/admin/analytics

cat > app/dashboard/admin/analytics/page.tsx << 'ENDOFFILE'
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, ExternalLink, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function pluralViews(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'просмотр'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'просмотра'
  return 'просмотров'
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [jobs, setJobs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy]   = useState<'tg_clicks' | 'views'>('tg_clicks')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).maybeSingle()
      if (user?.role !== 'admin') { router.replace('/'); return }

      const { data } = await supabase
        .from('jobs')
        .select('id, title, company, views, tg_clicks, visible, created_at')
        .order('tg_clicks', { ascending: false })

      setJobs(data ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const sorted = [...jobs].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))

  const totalViews    = jobs.reduce((s, j) => s + (j.views ?? 0), 0)
  const totalClicks   = jobs.reduce((s, j) => s + (j.tg_clicks ?? 0), 0)
  const avgCtr        = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0'

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="bg-[#F8FAFC] min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">

        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft size={14}/>Назад в админку
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={22} className="text-[#7C3AED]"/>
          <h1 className="text-2xl font-bold text-[#0F172A]">Аналитика вакансий</h1>
        </div>

        {/* Сводные метрики */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm">
            <p className="text-xs text-[#94A3B8] mb-1">Всего просмотров</p>
            <p className="text-2xl font-bold text-[#0F172A]">{totalViews.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1"><Eye size={12} className="text-[#94A3B8]"/><span className="text-xs text-[#94A3B8]">по всем вакансиям</span></div>
          </div>
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm">
            <p className="text-xs text-[#94A3B8] mb-1">Переходов в канал</p>
            <p className="text-2xl font-bold text-[#2563EB]">{totalClicks.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#94A3B8] shrink-0"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-xs text-[#94A3B8]">@joba_box</span>
            </div>
          </div>
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm">
            <p className="text-xs text-[#94A3B8] mb-1">CTR (клики / просмотры)</p>
            <p className="text-2xl font-bold text-[#10B981]">{avgCtr}%</p>
            <div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-[#94A3B8]"/><span className="text-xs text-[#94A3B8]">средний по всем</span></div>
          </div>
        </div>

        {/* Сортировка */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-[#64748B]">Сортировать по:</span>
          <button onClick={() => setSortBy('tg_clicks')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'tg_clicks' ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-[#64748B] border-[#E5E7EB] hover:border-[#7C3AED]'}`}>
            Переходам в канал
          </button>
          <button onClick={() => setSortBy('views')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'views' ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-[#64748B] border-[#E5E7EB] hover:border-[#7C3AED]'}`}>
            Просмотрам
          </button>
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-[#94A3B8] uppercase tracking-wide px-5 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
            <span>Вакансия</span>
            <span className="text-right w-20">Просмотры</span>
            <span className="text-right w-24 ml-4">Переходы TG</span>
            <span className="text-right w-16 ml-4">CTR</span>
            <span className="text-right w-16 ml-4">Статус</span>
          </div>

          {sorted.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#94A3B8]">Нет данных</div>
          )}

          {sorted.map((job, i) => {
            const views   = job.views ?? 0
            const clicks  = job.tg_clicks ?? 0
            const ctr     = views > 0 ? ((clicks / views) * 100).toFixed(1) : '—'
            const maxClicks = sorted[0]?.tg_clicks ?? 1

            return (
              <div key={job.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-5 py-4 items-center border-b border-[#E5E7EB] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#FAFAFA]'}`}>
                <div className="min-w-0 pr-4">
                  <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-[#0F172A] hover:text-[#7C3AED] truncate block transition-colors">
                    {job.title}
                  </Link>
                  <p className="text-xs text-[#94A3B8] truncate">{job.company}</p>
                  {/* Прогресс-бар кликов */}
                  {clicks > 0 && (
                    <div className="mt-1.5 h-1 bg-[#F1F5F9] rounded-full overflow-hidden w-full max-w-[200px]">
                      <div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-full transition-all"
                        style={{ width: `${Math.round((clicks / maxClicks) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-right w-20">
                  <span className="text-sm font-semibold text-[#0F172A]">{views}</span>
                  <p className="text-[10px] text-[#94A3B8]">{pluralViews(views)}</p>
                </div>
                <div className="text-right w-24 ml-4">
                  <span className={`text-sm font-bold ${clicks > 0 ? 'text-[#2563EB]' : 'text-[#CBD5E1]'}`}>{clicks}</span>
                  <p className="text-[10px] text-[#94A3B8]">переходов</p>
                </div>
                <div className="text-right w-16 ml-4">
                  <span className={`text-sm font-semibold ${parseFloat(ctr) > 10 ? 'text-[#10B981]' : parseFloat(ctr) > 0 ? 'text-[#F59E0B]' : 'text-[#CBD5E1]'}`}>
                    {ctr === '—' ? '—' : `${ctr}%`}
                  </span>
                </div>
                <div className="text-right w-16 ml-4">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${job.visible ? 'bg-green-50 text-green-600' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                    {job.visible ? 'видна' : 'скрыта'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

echo "✅ app/dashboard/admin/analytics/page.tsx"

rm -rf .next

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ⚠️  Запусти в Supabase → SQL Editor:"
echo ""
echo "  -- Колонка tg_clicks"
echo "  ALTER TABLE public.jobs"
echo "    ADD COLUMN IF NOT EXISTS tg_clicks integer NOT NULL DEFAULT 0;"
echo ""
echo "  -- RPC функция"
echo "  CREATE OR REPLACE FUNCTION increment_tg_clicks(job_id uuid)"
echo "  RETURNS void LANGUAGE sql SECURITY DEFINER AS \$\$"
echo "    UPDATE public.jobs SET tg_clicks = tg_clicks + 1 WHERE id = job_id;"
echo "  \$\$;"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  Аналитика доступна по адресу:"
echo "  http://localhost:3000/dashboard/admin/analytics"
echo ""
echo "npm run dev"
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

            <a href="https://t.me/joba_box" target="_blank" rel="noopener noreferrer"
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

          <div className="mt-3 pt-3 border-t border-dashed border-[#E5E7EB] flex items-center justify-center gap-3">
            <p className="text-[11px] text-[#CBD5E1] flex items-center gap-1">
              <Clock size={11}/>Опубликовано {timeAgo(job.created_at)}
            </p>
            {canSeeViews && (
              <>
                <span className="text-[#E5E7EB]">·</span>
                <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                  <Eye size={11}/>{job.views ?? 0} {pluralViews(job.views ?? 0)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

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

    // Загружаем вакансию
    supabase.from('jobs').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false) })

    // Инкремент просмотра — fire and forget
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id }),
    }).catch(() => {})

    // Проверяем роль
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

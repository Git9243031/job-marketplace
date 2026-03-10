'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ArrowLeft, Building2, Clock, Briefcase, DollarSign, Hash, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatSalary, timeAgo, cn } from '@/lib/utils'

const FORMAT_RU: Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид' }
const LEVEL_RU:  Record<string,string> = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', any:'Любой' }
const TYPE_RU:   Record<string,string> = { 'full-time':'Полная занятость', 'part-time':'Частичная', contract:'Контракт', freelance:'Фриланс', internship:'Стажировка' }
const CONTRACT_RU: Record<string,string> = { trud:'Трудовой договор', gph:'ГПХ', ip:'Договор с ИП', selfemployed:'Самозанятый' }
const SPHERE_RU: Record<string,string> = { it:'IT', design:'Дизайн', marketing:'Маркетинг', finance:'Финансы', hr:'HR', sales:'Продажи', legal:'Юриспруденция', other:'Другое' }

const FC: Record<string,string> = { remote:'bg-emerald-50 text-emerald-700 border-emerald-100', office:'bg-blue-50 text-blue-700 border-blue-100', hybrid:'bg-amber-50 text-amber-700 border-amber-100' }
const LC: Record<string,string> = { junior:'bg-green-50 text-green-700 border-green-100', middle:'bg-blue-50 text-blue-700 border-blue-100', senior:'bg-purple-50 text-purple-700 border-purple-100', lead:'bg-amber-50 text-amber-700 border-amber-100' }

export default function JobDetailPage() {
  const { id } = useParams() as { id: string }
  const [job, setJob]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('jobs').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Вакансия не найдена</h1>
      <p className="text-sm text-[#64748B] mb-4">Возможно, она была удалена или ещё не опубликована.</p>
      <Link href="/" className="text-[#7C3AED] hover:underline text-sm">← Вернуться к вакансиям</Link>
    </div>
  )

  const salary = formatSalary(job.salary_min, job.salary_max)

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft size={14} />Назад к вакансиям
        </Link>

        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Main */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
            {/* Badges */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {job.sphere && <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] border border-[#E5E7EB] px-2.5 py-1 rounded-full">{SPHERE_RU[job.sphere] || job.sphere}</span>}
              {job.experience_level && <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', LC[job.experience_level] || 'bg-gray-50 text-gray-600 border-gray-100')}>{LEVEL_RU[job.experience_level]}</span>}
            </div>

            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 leading-tight">{job.title}</h1>
            <div className="flex items-center gap-2 text-[#7C3AED] font-semibold mb-5">
              <Building2 size={15} />{job.company}
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {job.format && <span className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border', FC[job.format] || 'bg-gray-50 text-gray-600 border-gray-100')}><MapPin size={13}/>{FORMAT_RU[job.format]}</span>}
              {job.job_type && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"><Briefcase size={13}/>{TYPE_RU[job.job_type]}</span>}
              {job.contract_type && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#DDD6FE] bg-[#EDE9FE] text-[#7C3AED]">{CONTRACT_RU[job.contract_type]}</span>}
              {(job.salary_min || job.salary_max) && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-[#F0FDF4] text-[#059669] border-[#D1FAE5]"><DollarSign size={13}/>{salary}</span>}
              <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#94A3B8]"><Clock size={13}/>{timeAgo(job.created_at)}</span>
            </div>

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Стек / Навыки</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s: string) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Telegram tags */}
            {job.tags?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 flex items-center gap-1"><Hash size={11}/>Теги</p>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Описание</p>
              <div className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply card */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Откликнуться</p>
              {job.contact ? (
                <a
                  href={job.contact.startsWith('@') ? `https://t.me/${job.contact.slice(1)}` : `mailto:${job.contact}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 h-10 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-[10px] text-sm transition-colors"
                >
                  <Phone size={14} />
                  {job.contact.startsWith('@') ? 'Написать в Telegram' : 'Написать на email'}
                </a>
              ) : (
                <p className="text-xs text-[#94A3B8] text-center">Контакт не указан</p>
              )}
            </div>

            {/* Job info card */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">О вакансии</p>
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-[#0F172A]">
                  <MapPin size={13} className="text-[#94A3B8] shrink-0"/>
                  {job.location}
                </div>
              )}
              {job.salary_min || job.salary_max ? (
                <div className="flex items-center gap-2 text-sm text-[#059669] font-semibold">
                  <DollarSign size={13} className="shrink-0"/>
                  {salary}
                </div>
              ) : null}
              {job.format && (
                <div className="flex items-center gap-2 text-sm text-[#0F172A]">
                  <Briefcase size={13} className="text-[#94A3B8] shrink-0"/>
                  {FORMAT_RU[job.format]}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

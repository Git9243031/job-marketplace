'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ArrowLeft, Clock, Briefcase, DollarSign, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatSalary, timeAgo, cn } from '@/lib/utils'

const FORMAT_RU: Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид', any:'Любой' }
const LEVEL_RU:  Record<string,string> = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', any:'Любой' }
const SPHERE_RU: Record<string,string> = { it:'IT', design:'Дизайн', marketing:'Маркетинг', finance:'Финансы', hr:'HR', sales:'Продажи', legal:'Юриспруденция', other:'Другое' }
const LC: Record<string,string> = { junior:'bg-green-50 text-green-700 border-green-100', middle:'bg-blue-50 text-blue-700 border-blue-100', senior:'bg-purple-50 text-purple-700 border-purple-100', lead:'bg-amber-50 text-amber-700 border-amber-100' }

export default function ResumeDetailPage() {
  const { id } = useParams() as { id: string }
  const [resume, setResume]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('resumes').select('*').eq('id', id).single()
      .then(({ data }) => { setResume(data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin" />
    </div>
  )

  if (!resume) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Резюме не найдено</h1>
      <Link href="/resumes" className="text-[#7C3AED] hover:underline text-sm">← Вернуться к резюме</Link>
    </div>
  )

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/resumes" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft size={14} />Назад к резюме
        </Link>

        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Main */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {resume.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] leading-tight">{resume.name}</h1>
                <p className="text-[#7C3AED] font-semibold text-base mt-0.5">{resume.title}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {resume.sphere && <span className="text-xs bg-[#F1F5F9] text-[#64748B] border border-[#E5E7EB] px-2.5 py-0.5 rounded-full">{SPHERE_RU[resume.sphere] || resume.sphere}</span>}
                  {resume.experience_level && <span className={cn('text-xs px-2.5 py-0.5 rounded-full border', LC[resume.experience_level] || 'bg-gray-50 text-gray-600 border-gray-100')}>{LEVEL_RU[resume.experience_level]}</span>}
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-[#E5E7EB]">
              {resume.location && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"><MapPin size={13}/>{resume.location}</span>}
              {resume.format && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"><Briefcase size={13}/>{FORMAT_RU[resume.format] || resume.format}</span>}
              {resume.expected_salary && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-[#F0FDF4] text-[#059669] border-[#D1FAE5]"><DollarSign size={13}/>{formatSalary(resume.expected_salary)}</span>}
              <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#94A3B8]"><Clock size={13}/>{timeAgo(resume.created_at)}</span>
            </div>

            {/* Bio */}
            {resume.bio && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">О себе</p>
                <p className="text-sm text-[#0F172A] leading-relaxed">{resume.bio}</p>
              </div>
            )}

            {/* Skills */}
            {resume.skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Навыки</p>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((s: string) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Детали</p>
              <div className="text-sm text-[#0F172A] space-y-2">
                <p>Опыт: <span className="font-semibold">{resume.experience_years} лет</span></p>
                {resume.expected_salary && <p>Ожидания: <span className="font-semibold text-[#059669]">{formatSalary(resume.expected_salary)}</span></p>}
              </div>
              {resume.portfolio && (
                <a href={resume.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[#7C3AED] hover:underline mt-2">
                  <ExternalLink size={13}/>Портфолио
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

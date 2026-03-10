'use client'
import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Clock, ChevronDown, DollarSign } from 'lucide-react'
import { cn, formatSalaryShort, timeAgo } from '@/lib/utils'

const FORMAT_RU: Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид', any:'Любой' }
const LEVEL_RU:  Record<string,string> = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', any:'Любой' }
const LC: Record<string,string> = {
  junior: 'bg-green-50 text-green-700 border-green-100',
  middle: 'bg-blue-50 text-blue-700 border-blue-100',
  senior: 'bg-purple-50 text-purple-700 border-purple-100',
  lead:   'bg-amber-50 text-amber-700 border-amber-100',
}

interface Props { resume: any }

export function ResumeCard({ resume }: Props) {
  const [expanded, setExpanded] = useState(false)
  const initials = resume.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <article className="bg-white rounded-[16px] border border-[#E5E7EB] hover:border-[#7C3AED]/30 hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/resumes/${resume.id}`}>
              <h3 className="font-bold text-[#0F172A] text-base leading-snug hover:text-[#7C3AED] transition-colors cursor-pointer">{resume.name}</h3>
            </Link>
            <p className="text-[#7C3AED] text-sm font-medium">{resume.title}</p>
          </div>
          {resume.expected_salary && (
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-[#0F172A]">{formatSalaryShort(resume.expected_salary)} ₽</p>
              <p className="text-[10px] text-[#94A3B8]">в месяц</p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {resume.experience_level && <span className={cn('text-xs px-2.5 py-1 rounded-full border', LC[resume.experience_level] || 'bg-gray-50 text-gray-600 border-gray-100')}>{LEVEL_RU[resume.experience_level]}</span>}
          {resume.format && <span className="text-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]">{FORMAT_RU[resume.format] || resume.format}</span>}
          {resume.experience_years > 0 && <span className="text-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]">{resume.experience_years} лет опыта</span>}
        </div>

        {/* Skills */}
        {resume.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {resume.skills.slice(0, 5).map((s: string) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB]">{s}</span>
            ))}
            {resume.skills.length > 5 && <span className="text-xs text-[#94A3B8]">+{resume.skills.length - 5}</span>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
            {resume.location && <span className="flex items-center gap-1"><MapPin size={11}/>{resume.location}</span>}
            <span className="flex items-center gap-1"><Clock size={11}/>{timeAgo(resume.created_at)}</span>
          </div>
          <button
            onClick={() => setExpanded(o => !o)}
            className="flex items-center gap-1 text-[#7C3AED] hover:text-[#6D28D9] font-medium text-xs transition-colors"
          >
            {expanded ? 'Свернуть' : 'Развернуть'}
            <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#F1F5F9] px-5 py-4 space-y-3">
          {resume.bio && <p className="text-sm text-[#64748B] leading-relaxed">{resume.bio}</p>}
          <Link href={`/resumes/${resume.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors">
            Открыть резюме →
          </Link>
        </div>
      )}
    </article>
  )
}

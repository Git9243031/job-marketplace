'use client'
import Link from 'next/link'
import { MapPin, Clock, Flame, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const FORMAT_LABELS: Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид' }
const LEVEL_LABELS:  Record<string,string> = { junior:'junior', middle:'middle', senior:'senior', lead:'lead', any:'any' }
const FORMAT_COLORS: Record<string,string> = {
  remote: 'bg-emerald-50 text-emerald-700',
  office: 'bg-blue-50 text-blue-700',
  hybrid: 'bg-amber-50 text-amber-700',
}
const LEVEL_COLORS: Record<string,string> = {
  junior:  'bg-green-100 text-green-700',
  middle:  'bg-blue-100 text-blue-700',
  senior:  'bg-purple-100 text-purple-700',
  lead:    'bg-amber-100 text-amber-700',
  any:     'bg-gray-100 text-gray-600',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'сегодня'
  if (d === 1) return 'вчера'
  if (d < 7)  return `${d} дн. назад`
  if (d < 30) return `${Math.floor(d/7)} нед. назад`
  const m = Math.floor(d/30)
  return `${m} мес. назад`
}

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}к` : String(n)
  if (min && max) return `${fmt(min)}–${fmt(max)} ₽`
  if (min) return `от ${fmt(min)} ₽`
  return `до ${fmt(max!)} ₽`
}

export function JobCard({ job }: { job: any }) {
  const isHot      = !!job.salary_min
  const isFeatured = job.created_at && (Date.now() - new Date(job.created_at).getTime()) < 7*24*60*60*1000
  const salary     = fmtSalary(job.salary_min, job.salary_max)
  const skills     = job.skills || []
  const level      = job.experience_level

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <article className={cn(
        'bg-white rounded-[16px] border transition-all duration-200 h-full flex flex-col',
        'hover:shadow-[0_4px_20px_rgba(124,58,237,0.10)] hover:-translate-y-0.5',
        isFeatured ? 'border-[#7C3AED]/30' : 'border-[#E5E7EB]',
      )}>
        <div className="p-5 flex flex-col gap-3 flex-1">

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap min-h-[20px]">
            {isHot && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                <Flame size={9}/>Горячая
              </span>
            )}
            {isFeatured && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#7C3AED] bg-[#EDE9FE] px-1.5 py-0.5 rounded-full">
                <Star size={9}/>Топ
              </span>
            )}
            {level && level !== 'any' && (
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', LEVEL_COLORS[level] || 'bg-gray-100 text-gray-600')}>
                {LEVEL_LABELS[level] || level}
              </span>
            )}
          </div>

          {/* Title + company */}
          <div>
            <h3 className="font-semibold text-[#0F172A] text-[15px] leading-snug group-hover:text-[#7C3AED] transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-[#7C3AED] font-medium mt-1">{job.company}</p>
          </div>

          {/* Location + format */}
          <div className="flex items-center gap-2 flex-wrap">
            {job.location && (
              <span className="flex items-center gap-1 text-xs text-[#64748B]">
                <MapPin size={11}/>{job.location}
              </span>
            )}
            {job.format && (
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', FORMAT_COLORS[job.format] || 'bg-gray-50 text-gray-600')}>
                {FORMAT_LABELS[job.format] || job.format}
              </span>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 4).map((s: string) => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#E5E7EB]">
                  {s}
                </span>
              ))}
              {skills.length > 4 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#94A3B8]">+{skills.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#F1F5F9] flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
            <Clock size={11}/>{timeAgo(job.created_at)}
          </span>
          {salary && <span className="text-sm font-bold text-[#0F172A]">{salary}</span>}
        </div>
      </article>
    </Link>
  )
}

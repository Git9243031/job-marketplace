'use client'
import { Search, X, Flame, Star, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface Filters {
  q: string; sphere: string; level: string; format: string
  jobType: string; salaryMin: number; hot: boolean; featured: boolean
}
export const DEFAULT_FILTERS: Filters = {
  q:'', sphere:'all', level:'all', format:'all', jobType:'all', salaryMin:0, hot:false, featured:false
}

const SPHERE_OPTIONS  = [
  {value:'all',label:'Все сферы'},{value:'it',label:'IT'},{value:'design',label:'Дизайн'},
  {value:'marketing',label:'Маркетинг'},{value:'finance',label:'Финансы'},
  {value:'hr',label:'HR'},{value:'sales',label:'Продажи'},
  {value:'legal',label:'Юриспруденция'},{value:'other',label:'Другое'},
]
const LEVEL_OPTIONS   = [
  {value:'all',label:'Уровень'},{value:'junior',label:'Junior'},{value:'middle',label:'Middle'},
  {value:'senior',label:'Senior'},{value:'lead',label:'Lead'},{value:'any',label:'Любой'},
]
const FORMAT_OPTIONS  = [
  {value:'all',label:'Формат'},{value:'remote',label:'Удалённо'},
  {value:'office',label:'Офис'},{value:'hybrid',label:'Гибрид'},
]
const JOBTYPE_OPTIONS = [
  {value:'all',label:'Тип'},{value:'full-time',label:'Полная'},
  {value:'part-time',label:'Частичная'},{value:'contract',label:'Контракт'},
  {value:'freelance',label:'Фриланс'},{value:'internship',label:'Стажировка'},
]
const SALARY_OPTIONS  = [
  {value:0,label:'Зарплата'},{value:50000,label:'от 50 000'},{value:80000,label:'от 80 000'},
  {value:100000,label:'от 100 000'},{value:150000,label:'от 150 000'},
  {value:200000,label:'от 200 000'},{value:300000,label:'от 300 000'},
]

// Dropdown-пилюля
function FilterPill({
  label, value, options, onChange, active,
}: {
  label: string; value: string|number; options: {value:string|number;label:string}[]
  onChange: (v: string|number) => void; active: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap',
          active
            ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
            : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#7C3AED]/40 hover:text-[#7C3AED]'
        )}
      >
        {active ? current?.label : label}
        <ChevronDown size={13} className={cn('transition-transform text-[#94A3B8]', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 min-w-[160px] py-1.5 overflow-hidden">
          {options.map(o => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm transition-colors',
                o.value === value
                  ? 'text-[#7C3AED] font-semibold bg-[#F5F3FF]'
                  : 'text-[#374151] hover:bg-[#F9FAFB]'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props { filters: Filters; onChange: (f: Filters) => void; total: number }

export function JobFilters({ filters, onChange, total }: Props) {
  const set = (k: keyof Filters, v: any) => onChange({ ...filters, [k]: v })
  const hasActive = filters.q || filters.sphere !== 'all' || filters.level !== 'all' ||
    filters.format !== 'all' || filters.jobType !== 'all' || filters.salaryMin > 0 ||
    filters.hot || filters.featured

  return (
    <div className="space-y-3">
      {/* Поиск */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          value={filters.q}
          onChange={e => set('q', e.target.value)}
          placeholder="Должность, компания или стек..."
          className="w-full h-12 pl-11 pr-4 rounded-[12px] border border-[#E5E7EB] bg-white text-sm placeholder:text-[#94A3B8] text-[#0F172A] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 shadow-sm"
        />
        {filters.q && (
          <button onClick={() => set('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Фильтры-пилюли */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Горячие */}
        <button
          type="button"
          onClick={() => set('hot', !filters.hot)}
          className={cn(
            'flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all',
            filters.hot
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-orange-200 hover:text-orange-500'
          )}
        >
          <Flame size={13} />Горячие
        </button>

        {/* Топ */}
        <button
          type="button"
          onClick={() => set('featured', !filters.featured)}
          className={cn(
            'flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all',
            filters.featured
              ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
              : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#DDD6FE] hover:text-[#7C3AED]'
          )}
        >
          <Star size={13} />Топ
        </button>

        {/* Разделитель */}
        <div className="w-px h-6 bg-[#E5E7EB]" />

        <FilterPill label="Сфера"    value={filters.sphere}          options={SPHERE_OPTIONS}  onChange={v => set('sphere', v)}   active={filters.sphere !== 'all'} />
        <FilterPill label="Уровень"  value={filters.level}           options={LEVEL_OPTIONS}   onChange={v => set('level', v)}    active={filters.level !== 'all'} />
        <FilterPill label="Формат"   value={filters.format}          options={FORMAT_OPTIONS}  onChange={v => set('format', v)}   active={filters.format !== 'all'} />
        <FilterPill label="Тип"      value={filters.jobType}         options={JOBTYPE_OPTIONS} onChange={v => set('jobType', v)}  active={filters.jobType !== 'all'} />
        <FilterPill label="Зарплата" value={filters.salaryMin}       options={SALARY_OPTIONS.map(o=>({value:o.value,label:o.label}))} onChange={v => set('salaryMin', Number(v))} active={filters.salaryMin > 0} />

        {hasActive && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-sm text-[#EF4444] hover:text-[#DC2626] transition-colors ml-auto"
          >
            <X size={13} />Сбросить
          </button>
        )}
      </div>
    </div>
  )
}

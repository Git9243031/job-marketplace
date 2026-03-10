'use client'
import { Search, X } from 'lucide-react'

export interface ResumeFilterState {
  q: string; sphere: string; level: string; format: string; salaryMax: number
}
export const DEFAULT_RESUME_FILTERS: ResumeFilterState = { q:'', sphere:'all', level:'all', format:'all', salaryMax:0 }

const SPHERES = [{value:'all',label:'Все сферы'},{value:'it',label:'IT'},{value:'design',label:'Дизайн'},{value:'marketing',label:'Маркетинг'},{value:'finance',label:'Финансы'},{value:'hr',label:'HR'},{value:'sales',label:'Продажи'},{value:'legal',label:'Юриспруденция'},{value:'other',label:'Другое'}]
const LEVELS  = [{value:'all',label:'Любой уровень'},{value:'junior',label:'Junior'},{value:'middle',label:'Middle'},{value:'senior',label:'Senior'},{value:'lead',label:'Lead'}]
const FORMATS = [{value:'all',label:'Любой формат'},{value:'remote',label:'Удалённо'},{value:'office',label:'Офис'},{value:'hybrid',label:'Гибрид'}]
const SALARY_MAX = [{value:0,label:'Любая зарплата'},{value:100000,label:'до 100 000 ₽'},{value:150000,label:'до 150 000 ₽'},{value:200000,label:'до 200 000 ₽'},{value:300000,label:'до 300 000 ₽'}]

interface Props { filters: ResumeFilterState; onChange: (f: ResumeFilterState) => void; total: number }

function Select({ label, value, options, onChange }: { label:string; value:string; options:{value:string;label:string}[]; onChange:(v:string)=>void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="h-9 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#7C3AED] appearance-none cursor-pointer">
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function ResumeFilters({ filters, onChange, total }: Props) {
  const set = (k: keyof ResumeFilterState, v: any) => onChange({...filters, [k]: v})
  const hasActive = filters.q || filters.sphere!=='all' || filters.level!=='all' || filters.format!=='all' || filters.salaryMax>0
  return (
    <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 space-y-4 shadow-sm">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input value={filters.q} onChange={e=>set('q',e.target.value)} placeholder="Имя, должность, навык..." className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#E5E7EB] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10" />
      </div>
      <div className="border-t border-[#F1F5F9]" />
      <div className="grid gap-3">
        <Select label="Сфера"         value={filters.sphere}          options={SPHERES}                                                   onChange={v=>set('sphere',v)}   />
        <Select label="Уровень"       value={filters.level}           options={LEVELS}                                                    onChange={v=>set('level',v)}    />
        <Select label="Формат"        value={filters.format}          options={FORMATS}                                                   onChange={v=>set('format',v)}   />
        <Select label="Зарплата до"   value={String(filters.salaryMax)} options={SALARY_MAX.map(o=>({value:String(o.value),label:o.label}))} onChange={v=>set('salaryMax',Number(v))} />
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-[#64748B]">Найдено: <span className="font-semibold text-[#0F172A]">{total}</span></span>
        {hasActive && <button onClick={()=>onChange(DEFAULT_RESUME_FILTERS)} className="flex items-center gap-1 text-xs text-[#EF4444] hover:underline"><X size={10}/>Сбросить</button>}
      </div>
    </div>
  )
}

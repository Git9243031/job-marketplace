'use client'
import { Search, X, Flame, Star, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface Filters {
  q: string; sphere: string; subSphere: string; level: string; format: string
  jobType: string; salaryMin: number; hot: boolean; featured: boolean
}
export const DEFAULT_FILTERS: Filters = {
  q:'', sphere:'all', subSphere:'all', level:'all', format:'all',
  jobType:'all', salaryMin:0, hot:false, featured:false
}

// ── Двухуровневая иерархия сфер ──────────────────────────────────
export const SPHERE_TREE: {
  value: string; label: string
  children?: { value: string; label: string }[]
}[] = [
  {
    value: 'it', label: 'IT',
    children: [
      { value: 'it_backend',    label: 'Backend' },
      { value: 'it_frontend',   label: 'Frontend' },
      { value: 'it_mobile',     label: 'Mobile' },
      { value: 'it_qa',         label: 'QA' },
      { value: 'it_devops',     label: 'Infrastructure & DevOps' },
      { value: 'it_data',       label: 'Data & ML' },
      { value: 'it_analytics',  label: 'Analytics' },
      { value: 'it_security',   label: 'Information Security' },
      { value: 'it_fullstack',  label: 'Fullstack' },
    ],
  },
  {
    value: 'design', label: 'Дизайн',
    children: [
      { value: 'design_product', label: 'Product Design' },
      { value: 'design_ux',      label: 'UX Research' },
      { value: 'design_graphic', label: 'Graphic Design' },
      { value: 'design_motion',  label: 'Motion Design' },
    ],
  },
  {
    value: 'marketing', label: 'Маркетинг',
    children: [
      { value: 'marketing_performance', label: 'Performance' },
      { value: 'marketing_smm',         label: 'SMM' },
      { value: 'marketing_content',     label: 'Content' },
      { value: 'marketing_seo',         label: 'SEO' },
      { value: 'marketing_brand',       label: 'Brand' },
    ],
  },
  {
    value: 'management', label: 'Management & Product',
    children: [
      { value: 'mgmt_product',   label: 'Product Manager' },
      { value: 'mgmt_project',   label: 'Project Manager' },
      { value: 'mgmt_top',       label: 'Top Management' },
      { value: 'mgmt_scrum',     label: 'Scrum Master' },
    ],
  },
  { value: 'finance',  label: 'Финансы',  children: [
    { value: 'finance_analyst',  label: 'Аналитик' },
    { value: 'finance_account',  label: 'Бухгалтерия' },
    { value: 'finance_audit',    label: 'Аудит' },
  ]},
  { value: 'hr',    label: 'HR',    children: [
    { value: 'hr_recruit',  label: 'Рекрутинг' },
    { value: 'hr_bp',       label: 'HR BP' },
    { value: 'hr_learning', label: 'L&D' },
  ]},
  { value: 'sales', label: 'Продажи', children: [
    { value: 'sales_b2b',    label: 'B2B' },
    { value: 'sales_b2c',    label: 'B2C' },
    { value: 'sales_account',label: 'Account Manager' },
  ]},
  { value: 'legal',  label: 'Юриспруденция', children: [
    { value: 'legal_corp',   label: 'Корпоративное право' },
    { value: 'legal_ip',     label: 'IP / IT право' },
  ]},
  { value: 'other',  label: 'Другое' },
]

// ── Модальный выбор сферы ─────────────────────────────────────────
function SphereModal({
  open, onClose, sphere, subSphere, onChange,
}: {
  open: boolean; onClose: () => void
  sphere: string; subSphere: string
  onChange: (sphere: string, subSphere: string) => void
}) {
  const [activeSphere, setActiveSphere] = useState(sphere === 'all' ? 'it' : sphere)

  useEffect(() => {
    if (open) setActiveSphere(sphere === 'all' ? 'it' : sphere)
  }, [open, sphere])

  if (!open) return null

  const currentNode = SPHERE_TREE.find(s => s.value === activeSphere)
  const selectedSubs = subSphere !== 'all' ? subSphere.split(',').filter(Boolean) : []

  const toggleSub = (val: string) => {
    const current = selectedSubs
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
    onChange(activeSphere, next.length ? next.join(',') : 'all')
  }

  const selectAll = () => {
    if (!currentNode?.children) return
    onChange(activeSphere, currentNode.children.map(c => c.value).join(','))
  }

  const clearAll = () => onChange('all', 'all')

  const apply = () => {
    if (activeSphere !== sphere && subSphere !== 'all') onChange(activeSphere, 'all')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] w-full max-w-[660px] overflow-hidden flex flex-col" style={{maxHeight:'80vh'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <h2 className="text-base font-semibold text-[#0F172A]">Выбор сферы</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Левый список сфер */}
          <div className="w-48 border-r border-[#F1F5F9] overflow-y-auto py-2 shrink-0">
            {SPHERE_TREE.map(s => (
              <button
                key={s.value}
                onClick={() => { setActiveSphere(s.value); onChange(s.value, 'all') }}
                className={cn(
                  'w-full text-left px-5 py-2.5 text-sm transition-colors',
                  activeSphere === s.value
                    ? 'font-semibold text-[#0F172A] bg-[#F8FAFC]'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Правая панель подкатегорий */}
          <div className="flex-1 overflow-y-auto p-5">
            {currentNode?.children ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[#0F172A]">{currentNode.label}</span>
                  <button
                    onClick={selectAll}
                    className="text-xs font-medium text-[#7C3AED] hover:underline"
                  >
                    Выбрать все
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentNode.children.map(child => {
                    const isActive = selectedSubs.includes(child.value) ||
                      (sphere === activeSphere && subSphere === 'all' && false)
                    return (
                      <button
                        key={child.value}
                        onClick={() => toggleSub(child.value)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all',
                          isActive
                            ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
                            : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#DDD6FE] hover:text-[#7C3AED]'
                        )}
                      >
                        {child.label}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[#94A3B8]">
                Нет подкатегорий
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9]">
          <button
            onClick={clearAll}
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Сбросить всё
          </button>
          <button
            onClick={apply}
            className="px-5 py-2 bg-[#7C3AED] text-white text-sm font-semibold rounded-[10px] hover:bg-[#6D28D9] transition-colors"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}

const LEVEL_OPTIONS = [
  {value:'all',label:'Уровень'},{value:'junior',label:'Junior'},{value:'middle',label:'Middle'},
  {value:'senior',label:'Senior'},{value:'lead',label:'Lead'},
]
const FORMAT_OPTIONS = [
  {value:'all',label:'Формат'},{value:'remote',label:'Удалённо'},
  {value:'office',label:'Офис'},{value:'hybrid',label:'Гибрид'},
]
const JOBTYPE_OPTIONS = [
  {value:'all',label:'Тип'},{value:'full-time',label:'Полная'},
  {value:'part-time',label:'Частичная'},{value:'contract',label:'Контракт'},
  {value:'freelance',label:'Фриланс'},{value:'internship',label:'Стажировка'},
]
const SALARY_OPTIONS = [
  {value:0,label:'Зарплата'},{value:50000,label:'от 50 000'},{value:80000,label:'от 80 000'},
  {value:100000,label:'от 100 000'},{value:150000,label:'от 150 000'},
  {value:200000,label:'от 200 000'},{value:300000,label:'от 300 000'},
]

function FilterPill({
  label, value, options, onChange, active,
}: {
  label: string; value: string|number
  options: {value:string|number;label:string}[]
  onChange: (v: string|number) => void; active: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
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
        <div className="absolute left-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 min-w-[160px] py-1.5">
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
  const [sphereOpen, setSphereOpen] = useState(false)
  const set = (k: keyof Filters, v: any) => onChange({ ...filters, [k]: v })

  const sphereActive = filters.sphere !== 'all'
  const sphereLabel = (() => {
    if (!sphereActive) return 'Сфера'
    const node = SPHERE_TREE.find(s => s.value === filters.sphere)
    const subs = filters.subSphere !== 'all' ? filters.subSphere.split(',') : []
    if (subs.length === 1) {
      const child = node?.children?.find(c => c.value === subs[0])
      return child?.label ?? node?.label ?? 'Сфера'
    }
    if (subs.length > 1) return `${node?.label} (${subs.length})`
    return node?.label ?? 'Сфера'
  })()

  const hasActive = filters.q || sphereActive || filters.level !== 'all' ||
    filters.format !== 'all' || filters.jobType !== 'all' || filters.salaryMin > 0 ||
    filters.hot || filters.featured

  return (
    <>
      <SphereModal
        open={sphereOpen}
        onClose={() => setSphereOpen(false)}
        sphere={filters.sphere}
        subSphere={filters.subSphere}
        onChange={(sphere, subSphere) => onChange({ ...filters, sphere, subSphere })}
      />

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

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 items-center">
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

          <div className="w-px h-6 bg-[#E5E7EB]" />

          {/* Кнопка сферы — открывает модалку */}
          <button
            type="button"
            onClick={() => setSphereOpen(true)}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap',
              sphereActive
                ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
                : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#7C3AED]/40 hover:text-[#7C3AED]'
            )}
          >
            <SlidersHorizontal size={13} />
            {sphereLabel}
          </button>

          <FilterPill label="Уровень"  value={filters.level}    options={LEVEL_OPTIONS}   onChange={v => set('level', String(v))}   active={filters.level !== 'all'} />
          <FilterPill label="Формат"   value={filters.format}   options={FORMAT_OPTIONS}  onChange={v => set('format', String(v))}  active={filters.format !== 'all'} />
          <FilterPill label="Тип"      value={filters.jobType}  options={JOBTYPE_OPTIONS} onChange={v => set('jobType', String(v))} active={filters.jobType !== 'all'} />
          <FilterPill label="Зарплата" value={filters.salaryMin} options={SALARY_OPTIONS.map(o=>({value:o.value,label:o.label}))} onChange={v => set('salaryMin', Number(v))} active={filters.salaryMin > 0} />

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
    </>
  )
}

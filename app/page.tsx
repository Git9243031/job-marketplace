'use client'
import { useState, useEffect, useCallback } from 'react'
import { Briefcase, Users, MapPin, TrendingUp } from 'lucide-react'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, DEFAULT_FILTERS, type Filters } from '@/components/jobs/JobFilters'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const PER_PAGE = 9

function Pagination({ page, totalPages, onChange }: { page:number; totalPages:number; onChange:(p:number)=>void }) {
  if (totalPages <= 1) return null
  const pages = Array.from({length: Math.min(totalPages, 5)}, (_,i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })
  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E7EB] text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors">
        ‹
      </button>
      {pages[0] > 1 && <><button onClick={()=>onChange(1)} className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E7EB] text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">1</button><span className="text-[#94A3B8] px-1">…</span></>}
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm font-medium transition-colors ${p === page ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'border-[#E5E7EB] text-[#374151] hover:border-[#7C3AED] hover:text-[#7C3AED]'}`}>
          {p}
        </button>
      ))}
      {pages[pages.length-1] < totalPages && <><span className="text-[#94A3B8] px-1">…</span><button onClick={()=>onChange(totalPages)} className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E7EB] text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors">{totalPages}</button></>}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E7EB] text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors">
        ›
      </button>
    </div>
  )
}

export default function HomePage() {
  const [filters, setFilters]   = useState<Filters>(DEFAULT_FILTERS)
  const [jobs, setJobs]         = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [totalJobs, setTotalJobs] = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    supabase.from('settings').select('header_enabled').eq('id', 1).single()
      .then(({ data }) => { if (data) setHeroVisible(data.header_enabled ?? true) })
    const ch = supabase.channel('hero-realtime')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'settings', filter:'id=eq.1' },
        p => setHeroVisible(p.new.header_enabled ?? true))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    let q = supabase.from('jobs').select('*', { count:'exact' })
      .eq('visible', true).order('created_at', { ascending: false })
      .range((p-1)*PER_PAGE, p*PER_PAGE-1)
    if (f.q)               q = q.or(`title.ilike.%${f.q}%,company.ilike.%${f.q}%,description.ilike.%${f.q}%`)
    if (f.sphere  !== 'all') q = q.eq('sphere', f.sphere)
    if (f.level   !== 'all') q = q.eq('experience_level', f.level)
    if (f.format  !== 'all') q = q.eq('format', f.format)
    if (f.jobType !== 'all') q = q.eq('job_type', f.jobType)
    if (f.salaryMin > 0)     q = q.gte('salary_max', f.salaryMin)
    if (f.hot)               q = q.not('salary_min', 'is', null)
    if (f.featured)          q = q.gte('created_at', new Date(Date.now()-7*24*60*60*1000).toISOString())
    const { data, count } = await q
    setJobs(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(filters, page) }, [filters, page, load])
  useEffect(() => {
    supabase.from('jobs').select('id', { count:'exact', head:true }).eq('visible', true)
      .then(({ count }) => setTotalJobs(count || 0))
  }, [])

  const onFilter = (f: Filters) => { setFilters(f); setPage(1) }
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="bg-[#F8FAFC] min-h-screen">

      {/* Hero */}
      {heroVisible && (
        <section className="bg-white border-b border-[#E5E7EB] py-12 px-4 text-center">
          <p className="text-[#7C3AED] font-semibold text-sm mb-3">
            ~{totalJobs} горячих вакансий прямо сейчас
          </p>
          <h1 className="text-4xl font-extrabold text-[#0F172A] mb-2 leading-tight">
            Найди работу мечты<br/><span className="text-[#7C3AED]">в России</span>
          </h1>
          <p className="text-[#64748B] text-base max-w-xl mx-auto mb-8">
            {totalJobs} вакансий от лучших компаний. Без лишних шагов — найди и откликнись.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { icon: Briefcase,  value:`${totalJobs}+`, label:'Вакансий'     },
              { icon: MapPin,     value:'12+',            label:'Городов'      },
              { icon: Users,      value:'800+',           label:'Компаний'     },
              { icon: TrendingUp, value:'5к+',            label:'Специалистов' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon size={20} className="text-[#7C3AED]"/>
                <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
                <p className="text-xs text-[#64748B]">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Контент */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Заголовок + фильтры */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-2xl font-bold text-[#0F172A]">IT Вакансии</h2>
            <span className="text-[#94A3B8] text-sm">{total} {total === 1 ? 'вакансия' : total < 5 ? 'вакансии' : 'вакансий'}</span>
          </div>
          <JobFilters filters={filters} onChange={onFilter} total={total} />
        </div>

        {/* Грид карточек */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-16 text-center">
            <Briefcase size={32} className="text-[#CBD5E1] mx-auto mb-3"/>
            <h3 className="font-semibold text-[#0F172A] mb-1">Вакансии не найдены</h3>
            <p className="text-sm text-[#94A3B8] mb-4">Попробуйте изменить фильтры или сброcьте их</p>
            <button onClick={() => onFilter(DEFAULT_FILTERS)} className="text-sm text-[#7C3AED] font-medium hover:underline">
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map(job => <JobCard key={job.id} job={job}/>)}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior:'smooth' }) }}/>
          </>
        )}
      </div>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] py-12 px-4 text-center text-white mt-8">
        <h2 className="text-2xl font-bold mb-2">Разместите вакансию бесплатно</h2>
        <p className="text-purple-200 text-sm mb-6">Тысячи специалистов ищут работу прямо сейчас</p>
        <Link href="/auth/register" className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-6 py-3 rounded-[12px] transition-colors text-sm">
          Начать бесплатно →
        </Link>
      </section>
    </div>
  )
}

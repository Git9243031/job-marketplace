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

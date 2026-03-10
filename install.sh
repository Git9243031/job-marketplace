#!/bin/bash
# cd job-marketplace && bash ../fix-hr-redirect-health.sh
set -e

echo "🔧 Фикс: HR редирект + бесконечный лоадер + health-check страница..."

# ─────────────────────────────────────────────────────────────────
# 1. HR DASHBOARD — проблема в getMyJobs, он делает запрос
#    с фильтром visible=true через RLS, а HR-у нужны ВСЕ его вакансии
#    включая невидимые. Если запрос падает — loading зависает навсегда.
#    Добавляем timeout + fallback + исправляем запрос своих вакансий.
# ─────────────────────────────────────────────────────────────────
cat > app/dashboard/hr/page.tsx << 'EOF'
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, LogOut, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const SPHERE_RU: Record<string,string> = {
  it:'IT', design:'Дизайн', marketing:'Маркетинг',
  finance:'Финансы', hr:'HR', sales:'Продажи',
  legal:'Юриспруденция', other:'Другое',
}

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return 'ЗП не указана'
  const f = (n: number) => n >= 1000 ? `${Math.round(n/1000)}к` : String(n)
  if (min && max) return `${f(min)}–${f(max)} ₽`
  if (min) return `от ${f(min)} ₽`
  return `до ${f(max!)} ₽`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })
}

export default function HRDashboard() {
  const [user, setUser]   = useState<any>(null)
  const [jobs, setJobs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    // Таймаут — если Supabase не ответил за 8 сек, показываем ошибку
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError('Supabase не отвечает. Проверьте подключение.')
        setLoading(false)
      }
    }, 8000)

    async function init() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) { router.push('/auth/login'); return }

        // Загружаем профиль
        const { data: u, error: uErr } = await supabase
          .from('users').select('*').eq('id', authData.user.id).single()

        if (uErr || !u) {
          setError('Не удалось загрузить профиль: ' + (uErr?.message || 'нет данных'))
          setLoading(false)
          return
        }

        // Проверяем роль
        if (u.role !== 'hr' && u.role !== 'admin') {
          router.push(u.role === 'candidate' ? '/dashboard/candidate' : '/')
          return
        }

        if (cancelled) return
        setUser(u)

        // Загружаем ВСЕ вакансии HR-а (включая невидимые)
        // Важно: запрос идёт с auth токеном, RLS политика jobs_select_own разрешает
        const { data: myJobs, error: jErr } = await supabase
          .from('jobs')
          .select('*')
          .eq('created_by', authData.user.id)
          .order('created_at', { ascending: false })

        if (jErr) {
          setError('Ошибка загрузки вакансий: ' + jErr.message)
        } else {
          setJobs(myJobs || [])
        }
      } catch (e: any) {
        setError('Ошибка: ' + e.message)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    init()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
      <p className="text-sm text-[#94A3B8]">Загрузка кабинета...</p>
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-[#0F172A] mb-2">Ошибка загрузки</h2>
      <p className="text-sm text-[#64748B] mb-6">{error}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => window.location.reload()}
          className="h-9 px-4 bg-[#7C3AED] text-white text-sm rounded-[8px] hover:bg-[#6D28D9]">
          Обновить
        </button>
        <Link href="/status"
          className="h-9 px-4 border border-[#E5E7EB] text-sm rounded-[8px] text-[#64748B] hover:bg-[#F8FAFC] flex items-center">
          Проверить статус
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Кабинет HR</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{user?.name || user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/hr/create-job"
            className="flex items-center gap-2 h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors">
            <Plus size={15}/>Создать вакансию
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 h-10 px-4 border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] text-sm rounded-[10px]">
            <LogOut size={14}/>Выйти
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          ['Всего вакансий',   jobs.length,                          'text-[#7C3AED]'],
          ['Опубликовано',     jobs.filter(j => j.visible).length,   'text-[#10B981]'],
          ['На модерации',     jobs.filter(j => !j.visible).length,  'text-amber-600'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-[#64748B] mt-1">{l}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-dashed border-[#E5E7EB] p-16 text-center">
          <Briefcase size={28} className="text-[#94A3B8] mx-auto mb-3"/>
          <h3 className="font-semibold text-[#0F172A] mb-1">Нет вакансий</h3>
          <p className="text-sm text-[#64748B] mb-5">Создайте первую вакансию</p>
          <Link href="/dashboard/hr/create-job"
            className="inline-flex items-center gap-2 h-10 px-5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors">
            <Plus size={14}/>Создать
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-medium text-[#0F172A] truncate">{job.title}</p>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${job.visible ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {job.visible ? 'Опубликовано' : 'На модерации'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  {job.company}
                  {job.sphere ? ` · ${SPHERE_RU[job.sphere] || job.sphere}` : ''}
                  {' · '}{fmtSalary(job.salary_min, job.salary_max)}
                  {' · '}{fmtDate(job.created_at)}
                </p>
              </div>
              <Link href={`/jobs/${job.id}`}
                className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors">
                <Eye size={13}/>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
EOF

echo "✅ app/dashboard/hr/page.tsx — фикс редиректа + таймаут"

# ─────────────────────────────────────────────────────────────────
# 2. /status — секретная страница диагностики Supabase
# ─────────────────────────────────────────────────────────────────
mkdir -p app/status

cat > app/status/page.tsx << 'EOF'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Check {
  name: string
  status: 'ok' | 'error' | 'loading'
  latency?: number
  detail?: string
}

async function runCheck(name: string, fn: () => Promise<string>): Promise<Check> {
  const t0 = Date.now()
  try {
    const detail = await fn()
    return { name, status: 'ok', latency: Date.now() - t0, detail }
  } catch (e: any) {
    return { name, status: 'error', latency: Date.now() - t0, detail: e.message }
  }
}

export default function StatusPage() {
  const [checks, setChecks] = useState<Check[]>([
    { name: 'Auth — getSession',      status: 'loading' },
    { name: 'DB — jobs (SELECT)',     status: 'loading' },
    { name: 'DB — resumes (SELECT)',  status: 'loading' },
    { name: 'DB — settings (SELECT)', status: 'loading' },
    { name: 'DB — users (SELECT)',    status: 'loading' },
    { name: 'Env — SUPABASE_URL',     status: 'loading' },
    { name: 'Env — APP_URL',          status: 'loading' },
  ])
  const [runAt, setRunAt] = useState<string>('')
  const [running, setRunning] = useState(false)

  const runAll = async () => {
    setRunning(true)
    setRunAt(new Date().toLocaleTimeString('ru-RU'))

    // Reset
    setChecks(c => c.map(x => ({ ...x, status: 'loading', detail: undefined, latency: undefined })))

    const results = await Promise.all([
      runCheck('Auth — getSession', async () => {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw new Error(error.message)
        return data.session ? `Залогинен: ${data.session.user.email}` : 'Анонимный пользователь'
      }),
      runCheck('DB — jobs (SELECT)', async () => {
        const { count, error } = await supabase.from('jobs').select('id', { count: 'exact', head: true })
        if (error) throw new Error(error.message)
        return `${count ?? 0} записей`
      }),
      runCheck('DB — resumes (SELECT)', async () => {
        const { count, error } = await supabase.from('resumes').select('id', { count: 'exact', head: true })
        if (error) throw new Error(error.message)
        return `${count ?? 0} записей`
      }),
      runCheck('DB — settings (SELECT)', async () => {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
        if (error) throw new Error(error.message)
        return `header=${data.header_enabled} tg=${data.telegram_autopost_enabled}`
      }),
      runCheck('DB — users (SELECT)', async () => {
        const { data: auth } = await supabase.auth.getSession()
        if (!auth.session) return 'Пропущено (не авторизован)'
        const { data, error } = await supabase.from('users').select('role').eq('id', auth.session.user.id).single()
        if (error) throw new Error(error.message)
        return `role = ${data.role}`
      }),
      runCheck('Env — SUPABASE_URL', async () => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL не задан')
        return url
      }),
      runCheck('Env — APP_URL', async () => {
        const url = process.env.NEXT_PUBLIC_APP_URL
        if (!url) throw new Error('NEXT_PUBLIC_APP_URL не задан')
        return url
      }),
    ])

    setChecks(results)
    setRunning(false)
  }

  useEffect(() => { runAll() }, [])

  const allOk    = checks.every(c => c.status === 'ok')
  const hasError = checks.some(c => c.status === 'error')
  const isLoading = checks.some(c => c.status === 'loading')

  return (
    <div className="min-h-screen bg-[#0F172A] text-white px-4 py-12 font-mono">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : allOk ? 'bg-green-400' : 'bg-red-500'}`}/>
              <h1 className="text-lg font-bold">System Status</h1>
              <span className="text-xs text-[#475569] bg-[#1E293B] px-2 py-0.5 rounded">ВакансияРФ</span>
            </div>
            {runAt && <p className="text-xs text-[#475569]">Проверка в {runAt}</p>}
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-2 h-8 px-4 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {running ? (
              <span className="w-3 h-3 border border-[#475569] border-t-white rounded-full animate-spin"/>
            ) : '↻'} Повторить
          </button>
        </div>

        {/* Overall status */}
        <div className={`rounded-xl border p-4 mb-6 text-sm ${
          isLoading ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
          allOk     ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {isLoading ? '⏳ Выполняется проверка...' :
           allOk     ? '✅ Все системы работают нормально' :
                       `⛔ Обнаружены проблемы: ${checks.filter(c=>c.status==='error').length} из ${checks.length}`}
        </div>

        {/* Checks */}
        <div className="space-y-2">
          {checks.map((c) => (
            <div key={c.name} className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="shrink-0 w-5 text-center">
                {c.status === 'loading' && <span className="inline-block w-3 h-3 border border-[#475569] border-t-amber-400 rounded-full animate-spin"/>}
                {c.status === 'ok'      && <span className="text-green-400">✓</span>}
                {c.status === 'error'   && <span className="text-red-500">✗</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#E2E8F0]">{c.name}</p>
                {c.detail && (
                  <p className={`text-xs mt-0.5 truncate ${c.status === 'error' ? 'text-red-400' : 'text-[#64748B]'}`}>
                    {c.detail}
                  </p>
                )}
              </div>
              {c.latency !== undefined && (
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded ${
                  c.latency < 300  ? 'text-green-400 bg-green-400/10' :
                  c.latency < 1000 ? 'text-amber-400 bg-amber-400/10' :
                                     'text-red-400 bg-red-400/10'
                }`}>
                  {c.latency}ms
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Env block */}
        <div className="mt-6 bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-xs text-[#475569] space-y-1">
          <p className="text-[#64748B] font-semibold mb-2">Переменные окружения</p>
          <p>SUPABASE_URL: <span className="text-[#94A3B8]">{process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ задан' : '✗ не задан'}</span></p>
          <p>SUPABASE_ANON_KEY: <span className="text-[#94A3B8]">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ задан' : '✗ не задан'}</span></p>
          <p>APP_URL: <span className="text-[#94A3B8]">{process.env.NEXT_PUBLIC_APP_URL || '✗ не задан'}</span></p>
        </div>

        <p className="text-center text-[#334155] text-xs mt-8">
          Секретная страница диагностики · /status
        </p>
      </div>
    </div>
  )
}
EOF

echo "✅ app/status/page.tsx — страница диагностики"

# ─────────────────────────────────────────────────────────────────
# 3. Candidate dashboard — тот же паттерн с таймаутом и ошибками
# ─────────────────────────────────────────────────────────────────
cat > app/dashboard/candidate/page.tsx << 'EOF'
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, LogOut, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })
}

export default function CandidateDashboard() {
  const [user, setUser]     = useState<any>(null)
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) { setError('Supabase не отвечает. Проверьте подключение.'); setLoading(false) }
    }, 8000)

    async function init() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) { router.push('/auth/login'); return }

        const { data: u, error: uErr } = await supabase
          .from('users').select('*').eq('id', authData.user.id).single()

        if (uErr || !u) {
          setError('Не удалось загрузить профиль: ' + (uErr?.message || 'нет данных'))
          setLoading(false)
          return
        }

        // Если роль не candidate — редирект на правильный дашборд
        if (u.role !== 'candidate') {
          router.push(u.role === 'admin' ? '/dashboard/admin' : u.role === 'hr' ? '/dashboard/hr' : '/')
          return
        }

        if (cancelled) return
        setUser(u)

        const { data: myResumes, error: rErr } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', authData.user.id)
          .order('created_at', { ascending: false })

        if (rErr) setError('Ошибка загрузки резюме: ' + rErr.message)
        else setResumes(myResumes || [])
      } catch (e: any) {
        setError('Ошибка: ' + e.message)
      } finally {
        if (!cancelled) { clearTimeout(timeout); setLoading(false) }
      }
    }

    init()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
      <p className="text-sm text-[#94A3B8]">Загрузка кабинета...</p>
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-[#0F172A] mb-2">Ошибка загрузки</h2>
      <p className="text-sm text-[#64748B] mb-6">{error}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => window.location.reload()}
          className="h-9 px-4 bg-[#7C3AED] text-white text-sm rounded-[8px] hover:bg-[#6D28D9]">
          Обновить
        </button>
        <Link href="/status"
          className="h-9 px-4 border border-[#E5E7EB] text-sm rounded-[8px] text-[#64748B] hover:bg-[#F8FAFC] flex items-center">
          Проверить статус
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Кабинет соискателя</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{user?.name || user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/candidate/create-resume"
            className="flex items-center gap-2 h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors">
            <Plus size={15}/>Создать резюме
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 h-10 px-4 border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] text-sm rounded-[10px]">
            <LogOut size={14}/>Выйти
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          ['Всего резюме',  resumes.length,                          'text-[#7C3AED]'],
          ['Опубликовано',  resumes.filter(r => r.visible).length,  'text-[#10B981]'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-[#64748B] mt-1">{l}</p>
          </div>
        ))}
      </div>

      {resumes.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-dashed border-[#E5E7EB] p-16 text-center">
          <FileText size={28} className="text-[#94A3B8] mx-auto mb-3"/>
          <h3 className="font-semibold text-[#0F172A] mb-1">Нет резюме</h3>
          <p className="text-sm text-[#64748B] mb-5">Создайте своё первое резюме</p>
          <Link href="/dashboard/candidate/create-resume"
            className="inline-flex items-center gap-2 h-10 px-5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors">
            <Plus size={14}/>Создать
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map(r => (
            <div key={r.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-[#0F172A] truncate">{r.title || r.name}</p>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${r.visible ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {r.visible ? 'Опубликовано' : 'На модерации'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">{r.name} · {fmtDate(r.created_at)}</p>
              </div>
              <Link href={`/resumes/${r.id}`}
                className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors">
                <Eye size={13}/>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
EOF

echo "✅ app/dashboard/candidate/page.tsx — таймаут + правильный роль-редирект"

rm -rf .next
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Готово!                                                  ║"
echo "║                                                              ║"
echo "║  Страница диагностики: http://localhost:3000/status         ║"
echo "║  (покажет все проверки Supabase в реальном времени)         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "npm run dev"

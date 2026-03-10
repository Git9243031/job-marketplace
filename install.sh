#!/bin/bash
# cd job-marketplace && bash ../fix-status-users.sh
set -e

cat > app/status/page.tsx << 'ENDOFFILE'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Status = 'ok' | 'error' | 'loading' | 'timeout'
interface Check { name: string; status: Status; latency?: number; detail?: string }

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Таймаут ${ms}ms`)), ms)),
  ])
}

async function runCheck(name: string, fn: () => Promise<string>, ms = 5000): Promise<Check> {
  const t0 = Date.now()
  try {
    const detail = await withTimeout(fn(), ms)
    return { name, status: 'ok', latency: Date.now() - t0, detail }
  } catch (e: any) {
    return { name, status: e.message?.includes('Таймаут') ? 'timeout' : 'error', latency: Date.now() - t0, detail: e.message }
  }
}

const INITIAL: Check[] = [
  { name: 'Auth — getSession',      status: 'loading' },
  { name: 'DB — jobs (SELECT)',     status: 'loading' },
  { name: 'DB — resumes (SELECT)',  status: 'loading' },
  { name: 'DB — settings (SELECT)', status: 'loading' },
  { name: 'DB — users (SELECT)',    status: 'loading' },
  { name: 'Env — SUPABASE_URL',     status: 'loading' },
  { name: 'Env — APP_URL',          status: 'loading' },
]

export default function StatusPage() {
  const [checks, setChecks]   = useState<Check[]>(INITIAL)
  const [runAt, setRunAt]     = useState('')
  const [running, setRunning] = useState(false)

  const updateCheck = (name: string, result: Check) =>
    setChecks(prev => prev.map(c => c.name === name ? result : c))

  const runAll = async () => {
    setRunning(true)
    setRunAt(new Date().toLocaleTimeString('ru-RU'))
    setChecks(INITIAL)

    const checkDefs = [
      {
        name: 'Auth — getSession',
        fn: async () => {
          const { data, error } = await supabase.auth.getSession()
          if (error) throw new Error(error.message)
          return data.session ? `Залогинен: ${data.session.user.email}` : 'Анонимный пользователь'
        },
      },
      {
        name: 'DB — jobs (SELECT)',
        fn: async () => {
          const { count, error } = await supabase.from('jobs').select('id', { count: 'exact', head: true })
          if (error) throw new Error(error.message)
          return `${count ?? 0} записей`
        },
      },
      {
        name: 'DB — resumes (SELECT)',
        fn: async () => {
          const { count, error } = await supabase.from('resumes').select('id', { count: 'exact', head: true })
          if (error) throw new Error(error.message)
          return `${count ?? 0} записей`
        },
      },
      {
        name: 'DB — settings (SELECT)',
        fn: async () => {
          // maybeSingle — не падает если 0 строк
          const { data, error } = await supabase
            .from('settings').select('header_enabled,telegram_autopost_enabled').eq('id', 1).maybeSingle()
          if (error) throw new Error(error.message)
          if (!data) throw new Error('Нет строки settings с id=1')
          return `hero=${data.header_enabled} tg=${data.telegram_autopost_enabled}`
        },
      },
      {
        name: 'DB — users (SELECT)',
        fn: async () => {
          const { data: auth } = await supabase.auth.getSession()
          if (!auth.session) return 'Пропущено (не авторизован)'
          // maybeSingle вместо single — не бросает ошибку если 0 строк
          const { data, error } = await supabase
            .from('users').select('role').eq('id', auth.session.user.id).maybeSingle()
          if (error) throw new Error(error.message)
          if (!data) throw new Error('Нет записи в public.users — триггер не сработал при регистрации')
          return `role = ${data.role}`
        },
      },
      {
        name: 'Env — SUPABASE_URL',
        fn: async () => {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL
          if (!url) throw new Error('Не задан')
          return url
        },
      },
      {
        name: 'Env — APP_URL',
        fn: async () => {
          const url = process.env.NEXT_PUBLIC_APP_URL
          if (!url) throw new Error('NEXT_PUBLIC_APP_URL не задан')
          return url
        },
      },
    ]

    await Promise.all(
      checkDefs.map(({ name, fn }) =>
        runCheck(name, fn, 5000).then(result => updateCheck(name, result))
      )
    )
    setRunning(false)
  }

  useEffect(() => { runAll() }, [])

  const allOk    = checks.every(c => c.status === 'ok')
  const isLoading = checks.some(c => c.status === 'loading')

  const statusIcon = (s: Status) => {
    if (s === 'loading') return <span className="inline-block w-3 h-3 border border-[#475569] border-t-amber-400 rounded-full animate-spin"/>
    if (s === 'ok')      return <span className="text-green-400 text-base">✓</span>
    if (s === 'timeout') return <span className="text-amber-400 text-base">⏱</span>
    return <span className="text-red-500 text-base">✗</span>
  }

  const latencyColor = (ms?: number) => {
    if (!ms) return ''
    if (ms < 400)  return 'text-green-400 bg-green-400/10'
    if (ms < 1500) return 'text-amber-400 bg-amber-400/10'
    return 'text-red-400 bg-red-400/10'
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white px-4 py-12 font-mono">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-3 h-3 rounded-full transition-colors ${isLoading ? 'bg-amber-400 animate-pulse' : allOk ? 'bg-green-400' : 'bg-red-500'}`}/>
              <h1 className="text-lg font-bold tracking-tight">System Status</h1>
              <span className="text-xs text-[#475569] bg-[#1E293B] px-2 py-0.5 rounded border border-[#334155]">ВакансияРФ</span>
            </div>
            {runAt && <p className="text-xs text-[#475569] pl-6">Проверка в {runAt}</p>}
          </div>
          <button onClick={runAll} disabled={running}
            className="flex items-center gap-2 h-8 px-4 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs rounded-lg transition-colors disabled:opacity-40">
            {running ? <span className="w-3 h-3 border border-[#475569] border-t-white rounded-full animate-spin"/> : <span>↻</span>}
            {running ? 'Проверка...' : 'Повторить'}
          </button>
        </div>

        <div className={`rounded-xl border p-3.5 mb-5 text-sm font-medium ${
          isLoading ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          allOk     ? 'bg-green-500/10  border-green-500/20  text-green-400' :
                      'bg-red-500/10    border-red-500/20    text-red-400'
        }`}>
          {isLoading ? '⏳ Выполняется проверка...' :
           allOk     ? '✅ Все системы работают нормально' :
           `⛔ Проблемы: ${checks.filter(c => c.status !== 'ok').length} из ${checks.length}`}
        </div>

        <div className="space-y-1.5">
          {checks.map(c => (
            <div key={c.name} className={`bg-[#1E293B] border rounded-lg px-4 py-3 flex items-center gap-3 ${
              c.status === 'error' ? 'border-red-500/40' : c.status === 'timeout' ? 'border-amber-500/40' : 'border-[#334155]'
            }`}>
              <div className="shrink-0 w-5 flex justify-center">{statusIcon(c.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#CBD5E1]">{c.name}</p>
                {c.detail && (
                  <p className={`text-xs mt-0.5 truncate ${
                    c.status === 'error' ? 'text-red-400' : c.status === 'timeout' ? 'text-amber-400' : 'text-[#475569]'
                  }`}>{c.detail}</p>
                )}
              </div>
              {c.latency !== undefined && (
                <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded font-medium ${latencyColor(c.latency)}`}>
                  {c.latency}ms
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-1.5">
          <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest mb-3">Environment</p>
          {([
            ['NEXT_PUBLIC_SUPABASE_URL',      process.env.NEXT_PUBLIC_SUPABASE_URL],
            ['NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
            ['NEXT_PUBLIC_APP_URL',           process.env.NEXT_PUBLIC_APP_URL],
          ] as [string, string | undefined][]).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#475569]">{key}</span>
              <span className={`text-xs font-medium ${val ? 'text-green-400' : 'text-red-400'}`}>
                {val ? (key.includes('KEY') ? '✓ задан (скрыт)' : val) : '✗ не задан'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest mb-2">Заметки</p>
          <p className="text-xs text-[#475569] leading-relaxed">
            На Free (Nano) плане Supabase засыпает после ~10 минут неактивности.
            Первый запрос занимает 2–5 сек. Если таймауты — подожди 10 сек и нажми «Повторить».
          </p>
        </div>

        <p className="text-center text-[#1E293B] text-xs mt-8 select-none">/status · только для разработчиков</p>
      </div>
    </div>
  )
}
ENDOFFILE

rm -rf .next
echo "✅ app/status/page.tsx — исправлен .maybeSingle()"
echo "npm run dev → http://localhost:3000/status"
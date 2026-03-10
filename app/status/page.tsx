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

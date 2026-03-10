'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Eye, EyeOff, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [showConf, setShowConf]         = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return }
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 2000)
  }

  if (!sessionReady) return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-sm text-[#64748B]">Проверяем ссылку...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase size={22} className="text-white"/></div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Новый пароль</h1>
          <p className="text-sm text-[#64748B] mt-1">Придумайте надёжный пароль</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-[#10B981]"/></div>
              <h2 className="font-bold text-[#0F172A] mb-2">Пароль изменён!</h2>
              <p className="text-sm text-[#64748B]">Перенаправляем на страницу входа...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F172A]">Новый пароль</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов" required
                    className="h-10 w-full pl-3 pr-10 rounded-[10px] border border-[#E5E7EB] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"/>
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F172A]">Повторите пароль</label>
                <div className="relative">
                  <input type={showConf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Повторите пароль" required
                    className="h-10 w-full pl-3 pr-10 rounded-[10px] border border-[#E5E7EB] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"/>
                  <button type="button" onClick={() => setShowConf(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                    {showConf ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {confirm && <p className={`text-xs ${password === confirm ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{password === confirm ? '✓ Пароли совпадают' : '✗ Пароли не совпадают'}</p>}
              </div>
              {error && <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-3 py-2 text-xs text-[#EF4444]">{error}</div>}
              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-[10px] text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Сохранить новый пароль'}
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors">Вернуться ко входу</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

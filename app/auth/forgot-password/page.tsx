'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ArrowLeft, Mail, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase size={22} className="text-white"/></div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Восстановление пароля</h1>
          <p className="text-sm text-[#64748B] mt-1">Отправим ссылку для сброса на email</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-[#10B981]"/></div>
              <h2 className="font-bold text-[#0F172A] mb-2">Письмо отправлено!</h2>
              <p className="text-sm text-[#64748B] mb-1">Проверьте почту <span className="font-medium text-[#0F172A]">{email}</span></p>
              <p className="text-xs text-[#94A3B8] mb-6">Письмо может прийти через несколько минут. Проверьте папку «Спам».</p>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] hover:underline"><ArrowLeft size={13}/>Вернуться ко входу</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F172A]">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"/>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="h-10 w-full pl-9 pr-3 rounded-[10px] border border-[#E5E7EB] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"/>
                </div>
              </div>
              {error && <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-3 py-2 text-xs text-[#EF4444]">{error}</div>}
              <button type="submit" disabled={loading || !email}
                className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-[10px] text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Отправить ссылку'}
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"><ArrowLeft size={13}/>Вернуться ко входу</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

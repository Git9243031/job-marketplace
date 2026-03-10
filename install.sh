#!/bin/bash
# cd job-marketplace && bash ../fix-apply-and-password.sh
set -e

echo "🔧 Apply block + восстановление пароля..."

# ─────────────────────────────────────────────────────────────────
# 1. app/jobs/[id]/page.tsx — Antigravity apply block
# ─────────────────────────────────────────────────────────────────
mkdir -p "app/jobs/[id]"

cat > "app/jobs/[id]/page.tsx" << 'ENDOFFILE'
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ArrowLeft, Building2, Clock, Briefcase, DollarSign, Hash, Send, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

const FORMAT_RU:   Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид' }
const LEVEL_RU:    Record<string,string> = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', any:'Любой' }
const TYPE_RU:     Record<string,string> = { 'full-time':'Полная', 'part-time':'Частичная', contract:'Контракт', freelance:'Фриланс', internship:'Стажировка' }
const CONTRACT_RU: Record<string,string> = { trud:'Трудовой', gph:'ГПХ', ip:'С ИП', selfemployed:'Самозанятый' }
const SPHERE_RU:   Record<string,string> = { it:'IT', design:'Дизайн', marketing:'Маркетинг', finance:'Финансы', hr:'HR', sales:'Продажи', legal:'Юриспруденция', other:'Другое' }
const FC: Record<string,string> = { remote:'bg-emerald-50 text-emerald-700 border-emerald-100', office:'bg-blue-50 text-blue-700 border-blue-100', hybrid:'bg-amber-50 text-amber-700 border-amber-100' }
const LC: Record<string,string> = { junior:'bg-green-50 text-green-700 border-green-100', middle:'bg-blue-50 text-blue-700 border-blue-100', senior:'bg-purple-50 text-purple-700 border-purple-100', lead:'bg-amber-50 text-amber-700 border-amber-100' }

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return null
  const f = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}к` : String(n)
  if (min && max) return `${f(min)} — ${f(max)} ₽`
  if (min) return `от ${f(min)} ₽`
  return `до ${f(max!)} ₽`
}

function timeAgo(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000)
  if (d === 0) return 'сегодня'
  if (d === 1) return 'вчера'
  if (d < 7)  return `${d} дн. назад`
  return `${Math.floor(d / 7)} нед. назад`
}

function ApplyBlock({ job }: { job: any }) {
  const salary      = fmtSalary(job.salary_min, job.salary_max)
  const isTg        = job.contact?.startsWith('@')
  const contactHref = isTg ? `https://t.me/${job.contact.slice(1)}` : job.contact ? `mailto:${job.contact}` : null

  return (
    <>
      <style>{`
        @keyframes levitate  { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-8px) rotate(1deg)} }
        @keyframes levitate2 { 0%,100%{transform:translateY(0px) rotate(2deg)}  50%{transform:translateY(-6px) rotate(-1deg)} }
        @keyframes orb-pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.15);opacity:0.6} }
        .levitate  { animation: levitate  3.2s ease-in-out infinite; }
        .levitate2 { animation: levitate2 2.8s ease-in-out infinite; }
        .orb-pulse { animation: orb-pulse 4s   ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-[28px] bg-white border border-[#E5E7EB] shadow-[0_20px_60px_-10px_rgba(124,58,237,0.18)]">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] orb-pulse pointer-events-none" style={{filter:'blur(2px)',opacity:0.3}}/>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] orb-pulse pointer-events-none" style={{filter:'blur(3px)',opacity:0.2,animationDelay:'1.5s'}}/>
        <div className="relative p-6">

          <div className="flex justify-center mb-5">
            <div className="levitate inline-flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {job.company.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] leading-none">{job.company}</p>
                {job.location && <p className="text-[11px] text-[#94A3B8] mt-0.5">{job.location}</p>}
              </div>
            </div>
          </div>

          {salary && (
            <div className="levitate2 text-center mb-5">
              <span className="inline-block bg-gradient-to-r from-[#059669] to-[#10B981] text-white text-lg font-black px-5 py-2 rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.35)] tracking-tight">{salary}</span>
              <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium">в месяц</p>
            </div>
          )}

          <div className="border-t border-dashed border-[#E5E7EB] mb-5"/>

          <div className="space-y-2.5">
            {contactHref ? (
              <a href={contactHref} target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-between w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-bold text-sm shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 transition-all duration-200">
                <span className="flex items-center gap-2.5">
                  {isTg ? <Send size={16} className="shrink-0"/> : <ExternalLink size={16} className="shrink-0"/>}
                  {isTg ? 'Написать в Telegram' : 'Написать на email'}
                </span>
                <span className="text-white/60 group-hover:text-white transition-colors text-lg leading-none">→</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl bg-[#F1F5F9] text-[#94A3B8] text-sm font-medium">
                Контакт не указан
              </div>
            )}

            <a href="https://t.me/joba_box" target="_blank" rel="noopener noreferrer"
              className="group flex items-center justify-between w-full px-5 py-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-semibold text-sm hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:-translate-y-0.5 transition-all duration-200">
              <span className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Все вакансии в канале
              </span>
              <span className="text-[#93C5FD] group-hover:text-[#2563EB] transition-colors font-bold">@joba_box</span>
            </a>
          </div>

          <p className="text-center text-[11px] text-[#CBD5E1] mt-4 flex items-center justify-center gap-1">
            <Clock size={11}/>Опубликовано {timeAgo(job.created_at)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.09)] transition-shadow duration-300">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-4">О вакансии</p>
        <div className="space-y-3">
          {job.format && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Формат</span>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', FC[job.format] || 'bg-gray-50 text-gray-600')}>{FORMAT_RU[job.format]}</span>
            </div>
          )}
          {job.experience_level && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Уровень</span>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', LC[job.experience_level] || 'bg-gray-50 text-gray-600')}>{LEVEL_RU[job.experience_level]}</span>
            </div>
          )}
          {job.job_type && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Занятость</span>
              <span className="text-xs font-semibold text-[#0F172A]">{TYPE_RU[job.job_type]}</span>
            </div>
          )}
          {job.contract_type && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Договор</span>
              <span className="text-xs font-semibold text-[#7C3AED]">{CONTRACT_RU[job.contract_type]}</span>
            </div>
          )}
          {job.location && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">Город</span>
              <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                <MapPin size={11} className="text-[#94A3B8]"/>{job.location}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function JobDetailPage() {
  const { id } = useParams() as { id: string }
  const [job, setJob]         = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('jobs').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/>
    </div>
  )

  if (!job) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Вакансия не найдена</h1>
      <p className="text-sm text-[#64748B] mb-4">Возможно, она была удалена или ещё не опубликована.</p>
      <Link href="/" className="text-[#7C3AED] hover:underline text-sm">← Вернуться к вакансиям</Link>
    </div>
  )

  const salary = fmtSalary(job.salary_min, job.salary_max)

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
          <ArrowLeft size={14}/>Назад к вакансиям
        </Link>
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
            <div className="flex gap-2 mb-4 flex-wrap">
              {job.sphere && <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] border border-[#E5E7EB] px-2.5 py-1 rounded-full">{SPHERE_RU[job.sphere] || job.sphere}</span>}
              {job.experience_level && <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', LC[job.experience_level] || 'bg-gray-50 text-gray-600 border-gray-100')}>{LEVEL_RU[job.experience_level]}</span>}
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 leading-tight">{job.title}</h1>
            <div className="flex items-center gap-2 text-[#7C3AED] font-semibold mb-5"><Building2 size={15}/>{job.company}</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {job.format && <span className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border', FC[job.format] || 'bg-gray-50 text-gray-600 border-gray-100')}><MapPin size={13}/>{FORMAT_RU[job.format]}</span>}
              {job.job_type && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"><Briefcase size={13}/>{TYPE_RU[job.job_type]}</span>}
              {job.contract_type && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#DDD6FE] bg-[#EDE9FE] text-[#7C3AED]">{CONTRACT_RU[job.contract_type]}</span>}
              {salary && <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-[#F0FDF4] text-[#059669] border-[#D1FAE5]"><DollarSign size={13}/>{salary}</span>}
              <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] text-[#94A3B8]"><Clock size={13}/>{timeAgo(job.created_at)}</span>
            </div>
            {job.skills?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Стек / Навыки</p>
                <div className="flex flex-wrap gap-2">{job.skills.map((s: string) => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] font-medium">{s}</span>)}</div>
              </div>
            )}
            {job.tags?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 flex items-center gap-1"><Hash size={11}/>Теги</p>
                <div className="flex flex-wrap gap-1.5">{job.tags.map((t: string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">{t}</span>)}</div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Описание</p>
              <div className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </div>
          </div>
          <div className="space-y-4"><ApplyBlock job={job}/></div>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE

echo "✅ app/jobs/[id]/page.tsx"

# ─────────────────────────────────────────────────────────────────
# 2. /auth/forgot-password
# ─────────────────────────────────────────────────────────────────
mkdir -p app/auth/forgot-password

cat > app/auth/forgot-password/page.tsx << 'ENDOFFILE'
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
ENDOFFILE

echo "✅ app/auth/forgot-password/page.tsx"

# ─────────────────────────────────────────────────────────────────
# 3. /auth/reset-password
# ─────────────────────────────────────────────────────────────────
mkdir -p app/auth/reset-password

cat > app/auth/reset-password/page.tsx << 'ENDOFFILE'
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
ENDOFFILE

echo "✅ app/auth/reset-password/page.tsx"

# ─────────────────────────────────────────────────────────────────
# 4. Ссылка «Забыли пароль?» в login — awk (macOS + Linux)
# ─────────────────────────────────────────────────────────────────
LOGIN_FILE="app/auth/login/page.tsx"

if grep -q "forgot-password" "$LOGIN_FILE"; then
  echo "✅ Ссылка уже есть в $LOGIN_FILE"
else
  awk '
  /errors\.password&&/ {
    print
    print "              <div className=\"flex justify-end\">"
    print "                <Link href=\"/auth/forgot-password\" className=\"text-xs text-[#7C3AED] hover:underline\">Забыли пароль?</Link>"
    print "              </div>"
    next
  }
  { print }
  ' "$LOGIN_FILE" > /tmp/_login_patched.tsx
  mv /tmp/_login_patched.tsx "$LOGIN_FILE"
  echo "✅ Ссылка «Забыли пароль?» добавлена в login"
fi

# ─────────────────────────────────────────────────────────────────
# 5. Инструкция по Supabase
# ─────────────────────────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  ⚠️  Supabase → Authentication → URL Configuration → добавь:    ║"
echo "║                                                                   ║"
echo "║  Redirect URLs:                                                   ║"
echo "║    https://твой-проект.vercel.app/auth/reset-password            ║"
echo "║    http://localhost:3000/auth/reset-password                      ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"

rm -rf .next
echo ""
echo "✅ Готово. npm run dev"
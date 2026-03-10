'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Briefcase, LogIn, UserPlus, Menu, X, ChevronDown, User, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

const ROLE_LABELS: Record<string,string> = { admin:'Администратор', hr:'HR / Рекрутёр', candidate:'Соискатель' }
const ROLE_COLORS: Record<string,string> = {
  admin:     'bg-red-50 text-red-700 border-red-100',
  hr:        'bg-blue-50 text-blue-700 border-blue-100',
  candidate: 'bg-green-50 text-green-700 border-green-100',
}

function NavLink({ href, label }: { href:string; label:string }) {
  const p = usePathname()
  const active = p === href || p?.startsWith(href+'/')
  return (
    <Link href={href} className={cn('text-sm font-medium transition-colors px-1 py-0.5', active?'text-[#7C3AED]':'text-[#64748B] hover:text-[#0F172A]')}>{label}</Link>
  )
}

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: u } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      setUser(u)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) { setUser(null); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      setUser(u)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDropOpen(false)
    router.push('/')
  }

  const dashPath = user?.role==='admin' ? '/dashboard/admin' : user?.role==='hr' ? '/dashboard/hr' : '/dashboard/candidate'
  const initials = user?.name ? user.name.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2) : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 bg-[#7C3AED] rounded-lg flex items-center justify-center">
            <Briefcase size={14} className="text-white" />
          </div>
          <span className="font-bold text-[#0F172A] text-[15px]">ВакансияРФ</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <NavLink href="/"        label="Вакансии" />
          <NavLink href="/resumes" label="Резюме"   />
          {user && <NavLink href={dashPath} label="Кабинет" />}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(o => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E5E7EB]"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-[#0F172A] leading-none">{user.name || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5">{ROLE_LABELS[user.role]}</p>
                </div>
                <ChevronDown size={13} className={cn('text-[#94A3B8] transition-transform', dropOpen && 'rotate-180')} />
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-sm font-bold shrink-0">{initials}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A] truncate">{user.name || 'Пользователь'}</p>
                        <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className={cn('mt-2 inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border', ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link href={dashPath} onClick={()=>setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
                      <Briefcase size={14} className="text-[#64748B]" /> Мой кабинет
                    </Link>
                    <Link href="/settings" onClick={()=>setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
                      <Settings size={14} className="text-[#64748B]" /> Настройки
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/dashboard/admin" onClick={()=>setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
                        <ShieldCheck size={14} className="text-[#64748B]" /> Админ-панель
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[#E5E7EB] py-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
                      <LogOut size={14} /> Выйти из аккаунта
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-[#64748B] hover:text-[#0F172A] px-3 py-2 rounded-[8px] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5">
                <LogIn size={14} /> Войти
              </Link>
              <Link href="/auth/register" className="text-sm font-medium bg-[#7C3AED] text-white px-3.5 py-2 rounded-[8px] hover:bg-[#6D28D9] transition-colors flex items-center gap-1.5">
                <UserPlus size={13} /> Регистрация
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden ml-auto text-[#64748B] hover:text-[#0F172A]" onClick={()=>setMobileOpen(o=>!o)}>
          {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 flex flex-col gap-1">
          <Link href="/"        onClick={()=>setMobileOpen(false)} className="text-sm text-[#0F172A] py-2 px-2 rounded-[8px] hover:bg-[#F8FAFC]">Вакансии</Link>
          <Link href="/resumes" onClick={()=>setMobileOpen(false)} className="text-sm text-[#0F172A] py-2 px-2 rounded-[8px] hover:bg-[#F8FAFC]">Резюме</Link>
          {user && <Link href={dashPath} onClick={()=>setMobileOpen(false)} className="text-sm text-[#0F172A] py-2 px-2 rounded-[8px] hover:bg-[#F8FAFC]">Кабинет</Link>}
          <div className="border-t border-[#E5E7EB] pt-3 mt-2 flex flex-col gap-2">
            {user ? (
              <>
                <div className="text-xs text-[#64748B] px-2">{user.email} · {ROLE_LABELS[user.role]}</div>
                <button onClick={handleLogout} className="text-sm text-[#EF4444] text-left py-2 px-2 rounded-[8px] hover:bg-[#FEF2F2] flex items-center gap-2"><LogOut size={14}/>Выйти</button>
              </>
            ) : (
              <>
                <Link href="/auth/login"    onClick={()=>setMobileOpen(false)} className="text-sm text-[#64748B] py-2 px-2 rounded-[8px] hover:bg-[#F8FAFC]">Войти</Link>
                <Link href="/auth/register" onClick={()=>setMobileOpen(false)} className="text-sm font-medium text-[#7C3AED] py-2 px-2 rounded-[8px] hover:bg-[#EDE9FE]">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

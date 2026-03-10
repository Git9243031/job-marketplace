'use client'
import { useEffect, useState } from 'react'
import { Navbar } from './Navbar'
import { supabase } from '@/lib/supabaseClient'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [headerEnabled, setHeaderEnabled] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase
      .from('settings')
      .select('header_enabled')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setHeaderEnabled(data.header_enabled ?? true)
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  // Подписка на realtime изменения настроек (когда админ переключает)
  useEffect(() => {
    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'id=eq.1',
      }, (payload) => {
        setHeaderEnabled(payload.new.header_enabled ?? true)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <>
      {ready && headerEnabled && <Navbar />}
      <main className={headerEnabled ? 'min-h-[calc(100vh-56px)]' : 'min-h-screen'}>
        {children}
      </main>
      <footer className="border-t border-[#E5E7EB] bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#7C3AED] rounded-md flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M20 7H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9 8H4v-2h7v2zm9 0h-7v-2h7v2zm0-4H4V9h16v2z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">ВакансияРФ</span>
          </div>
          <p className="text-xs text-[#94A3B8]">© 2025 ВакансияРФ. Все права защищены.</p>
          <div className="flex gap-5 text-xs text-[#64748B]">
            <a href="/"        className="hover:text-[#7C3AED] transition-colors">Вакансии</a>
            <a href="/resumes" className="hover:text-[#7C3AED] transition-colors">Резюме</a>
            <a href="/auth/register" className="hover:text-[#7C3AED] transition-colors">Разместить вакансию</a>
          </div>
        </div>
      </footer>
    </>
  )
}

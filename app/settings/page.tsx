'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({data}) => {
      if (!data.user) { router.push('/auth/login'); return }
      const {data:u} = await supabase.from('users').select('*').eq('id',data.user.id).single()
      setUser(u)
    })
  }, [router])

  if (!user) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/></div>

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#EDE9FE] rounded-xl flex items-center justify-center"><Settings size={18} className="text-[#7C3AED]"/></div>
        <div><h1 className="text-2xl font-bold text-[#0F172A]">Настройки</h1><p className="text-sm text-[#64748B]">{user.email}</p></div>
      </div>
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Профиль</p>
          <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-[10px]">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-white font-bold">{user.email?.[0]?.toUpperCase()}</div>
            <div><p className="text-sm font-medium text-[#0F172A]">{user.email}</p><p className="text-xs text-[#64748B]">{user.role==='admin'?'Администратор':user.role==='hr'?'HR / Рекрутёр':'Соискатель'}</p></div>
          </div>
        </div>
        <div className="border-t border-[#E5E7EB] pt-4">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2] px-3 py-2 rounded-[8px] transition-colors"><LogOut size={14}/>Выйти из аккаунта</button>
        </div>
      </div>
    </div>
  )
}

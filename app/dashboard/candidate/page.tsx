'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, LogOut, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { resumesService } from '@/services/resumes'
import { formatDate } from '@/lib/utils'

export default function CandidateDashboard() {
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (!u || (u.role !== 'candidate' && u.role !== 'admin')) { router.push('/'); return }
      setUser(u)
      const { data: myResumes } = await resumesService.getMyResumes(data.user.id)
      setResumes(myResumes || [])
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin"/></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#0F172A]">Мой кабинет</h1><p className="text-sm text-[#64748B] mt-0.5">{user?.email}</p></div>
        <div className="flex gap-2">
          <Link href="/dashboard/candidate/create-resume" className="flex items-center gap-2 h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px] transition-colors"><Plus size={15}/>Создать резюме</Link>
          <button onClick={handleLogout} className="flex items-center gap-2 h-10 px-4 border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] text-sm rounded-[10px]"><LogOut size={14}/>Выйти</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[['Всего резюме',resumes.length,'text-[#7C3AED]'],['Опубликовано',resumes.filter(r=>r.visible).length,'text-[#10B981]']].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-[14px] border border-[#E5E7EB] p-5">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-[#64748B] mt-1">{l}</p>
          </div>
        ))}
      </div>
      {resumes.length===0 ? (
        <div className="bg-white rounded-[20px] border border-dashed border-[#E5E7EB] p-16 text-center">
          <FileText size={28} className="text-[#94A3B8] mx-auto mb-3"/>
          <h3 className="font-semibold text-[#0F172A] mb-1">Нет резюме</h3>
          <p className="text-sm text-[#64748B] mb-5">Создайте резюме чтобы работодатели могли вас найти</p>
          <Link href="/dashboard/candidate/create-resume" className="inline-flex items-center gap-2 h-10 px-5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-[10px]"><Plus size={14}/>Создать</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((r:any)=>(
            <div key={r.id} className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-[#0F172A]">{r.name}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${r.visible?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{r.visible?'Опубликовано':'На модерации'}</span>
                </div>
                <p className="text-xs text-[#64748B]">{r.title} · {formatDate(r.created_at)}</p>
              </div>
              <Link href={`/resumes/${r.id}`} className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors"><Eye size={13}/></Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

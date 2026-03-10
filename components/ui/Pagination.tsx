'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { page: number; totalPages: number; onChange: (p:number) => void }

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  const pages = Array.from({length:totalPages},(_,i)=>i+1)
  const visible = pages.filter(p => p===1||p===totalPages||Math.abs(p-page)<=1)
  const withDots: (number|'...')[] = []
  visible.forEach((p,i) => {
    if (i>0 && p-(visible[i-1] as number)>1) withDots.push('...')
    withDots.push(p)
  })
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button onClick={()=>onChange(page-1)} disabled={page<=1} className="w-9 h-9 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-40 disabled:pointer-events-none transition-colors">
        <ChevronLeft size={15} />
      </button>
      {withDots.map((p,i) => p==='...'
        ? <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-[#94A3B8] text-sm">…</span>
        : <button key={p} onClick={()=>onChange(p as number)} className={cn('w-9 h-9 rounded-[8px] text-sm font-medium border transition-colors', page===p?'bg-[#7C3AED] text-white border-[#7C3AED]':'border-[#E5E7EB] text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED]')}>{p}</button>
      )}
      <button onClick={()=>onChange(page+1)} disabled={page>=totalPages} className="w-9 h-9 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] disabled:opacity-40 disabled:pointer-events-none transition-colors">
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

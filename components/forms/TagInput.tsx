'use client'
import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface Props {
  label?: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  /** hashMode: нормализует теги как #тег (для Telegram) */
  hashMode?: boolean
}

export function TagInput({ label, value, onChange, placeholder = 'Добавить...', hashMode = false }: Props) {
  const [input, setInput] = useState('')

  const normalize = (raw: string): string => {
    let t = raw.trim()
    if (!t) return ''
    if (hashMode) {
      // убираем все # в начале, потом добавляем один
      t = t.replace(/^#+/, '').trim()
      // убираем пробелы внутри тега
      t = t.replace(/\s+/g, '_')
      if (!t) return ''
      return '#' + t
    }
    return t
  }

  const add = () => {
    const t = normalize(input)
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    if (e.key === ' ' && hashMode) { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0, -1))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#0F172A]">{label}</label>}
      <div className="min-h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 flex flex-wrap gap-1.5 focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/10 transition-colors cursor-text">
        {value.map(t => (
          <span key={t} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${hashMode ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#EDE9FE] text-[#7C3AED]'}`}>
            {t}
            <button type="button" onClick={() => onChange(value.filter(v => v !== t))} className="hover:opacity-70 transition-opacity">
              <X size={10}/>
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-[#94A3B8]"
        />
      </div>
      <p className="text-xs text-[#94A3B8]">
        {hashMode ? 'Пробел, Enter или запятая для добавления · # добавляется автоматически' : 'Enter или запятая для добавления'}
      </p>
    </div>
  )
}

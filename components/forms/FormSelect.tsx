import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string
  options: { value: string; label: string }[]
}
export const FormSelect = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#0F172A]">{label}</label>}
      <select ref={ref} className={cn('h-10 w-full rounded-[10px] border bg-white px-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 appearance-none cursor-pointer', error?'border-[#EF4444]':'border-[#E5E7EB]', className)} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
)
FormSelect.displayName = 'FormSelect'

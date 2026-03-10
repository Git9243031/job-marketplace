import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string
}
export const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#0F172A]">{label}</label>}
      <input ref={ref} className={cn('h-10 w-full rounded-[10px] border bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-colors', error?'border-[#EF4444]':'border-[#E5E7EB] focus:border-[#7C3AED]', className)} {...props} />
      {hint  && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
)
FormInput.displayName = 'FormInput'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary'|'cta'|'outline'|'ghost'|'danger'|'default'|'success'
  size?: 'sm'|'md'|'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant='primary', size='md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-[10px] transition-all disabled:opacity-50 disabled:pointer-events-none'
    const variants = {
      primary: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
      cta:     'bg-[#10B981] hover:bg-[#059669] text-white',
      outline: 'border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#7C3AED] hover:text-[#7C3AED]',
      ghost:   'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]',
      danger:  'bg-[#EF4444] hover:bg-[#DC2626] text-white',
      default: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
      success: 'bg-[#10B981] hover:bg-[#059669] text-white',
    }
    const sizes = { sm:'h-8 px-3 text-xs', md:'h-10 px-4 text-sm', lg:'h-11 px-6 text-sm' }
    return (
      <button ref={ref} disabled={disabled||loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

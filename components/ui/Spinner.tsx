import { cn } from '@/lib/utils'
export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-5 h-5 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin', className)} />
}

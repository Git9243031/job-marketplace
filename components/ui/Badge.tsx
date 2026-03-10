import { cn } from '@/lib/utils'
interface Props { label: string; className?: string }
export function Badge({ label, className }: Props) {
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]', className)}>{label}</span>
}

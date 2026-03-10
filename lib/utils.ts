import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Зарплата не указана'
  const f = (n: number) => n >= 1000 ? `${Math.round(n/1000)} тыс. ₽/мес` : `${n} ₽/мес`
  if (min && max) return `${Math.round(min/1000)}–${Math.round(max/1000)} тыс. ₽/мес`
  if (min) return `от ${f(min)}`
  return `до ${f(max!)}`
}

export function formatSalaryShort(min?: number, max?: number): string {
  if (!min && !max) return ''
  const k = (n: number) => `${Math.round(n/1000)}к`
  if (min && max) return `${k(min)}–${k(max)} ₽`
  if (min) return `от ${k(min)} ₽`
  return `до ${k(max!)} ₽`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })
}

export function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 3600)      return `${Math.floor(diff/60)} мин. назад`
  if (diff < 86400)     return `${Math.floor(diff/3600)} ч. назад`
  if (diff < 86400*7)   return `${Math.floor(diff/86400)} дн. назад`
  return formatDate(date)
}

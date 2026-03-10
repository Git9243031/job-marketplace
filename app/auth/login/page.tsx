'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { loginSchema, type LoginFormData } from '@/utils/schemas'

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (authError) { setError('Неверный email или пароль'); return }
    if (!authData.user) { setError('Не удалось войти'); return }
    const { data: u } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
    const role = u?.role || 'candidate'
    router.push(role==='admin'?'/dashboard/admin':role==='hr'?'/dashboard/hr':'/dashboard/candidate')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase size={22} className="text-white"/></div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Добро пожаловать</h1>
          <p className="text-sm text-[#64748B] mt-1">Войдите в свой аккаунт</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Email</label>
              <input type="email" placeholder="you@example.com" {...register('email')} className="h-10 w-full rounded-[10px] border border-[#E5E7EB] px-3 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"/>
              {errors.email&&<p className="text-xs text-[#EF4444]">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Пароль</label>
              <input type="password" placeholder="••••••••" {...register('password')} className="h-10 w-full rounded-[10px] border border-[#E5E7EB] px-3 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"/>
              {errors.password&&<p className="text-xs text-[#EF4444]">{errors.password.message}</p>}
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-xs text-[#7C3AED] hover:underline">Забыли пароль?</Link>
              </div>
            </div>
            {error&&<div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-3 py-2 text-xs text-[#EF4444]">{error}</div>}
            <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium rounded-[10px] text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2 transition-colors">
              {isSubmitting?<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<><LogIn size={15}/>Войти</>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#64748B] mt-5">Нет аккаунта? <Link href="/auth/register" className="text-[#7C3AED] font-medium hover:underline">Зарегистрироваться</Link></p>
      </div>
    </div>
  )
}

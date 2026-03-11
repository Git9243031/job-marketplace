'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Введите корректный email'),
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль не менее 6 символов'),
})
type LoginFormData = z.infer<typeof loginSchema>

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials:  'Неверный email или пароль',
  email_not_confirmed:  'Подтвердите email — проверьте почту',
  too_many_requests:    'Слишком много попыток. Подождите немного',
  user_not_found:       'Пользователь не найден',
  user_banned:          'Аккаунт заблокирован',
}

function getErrorMessage(error: any): string {
  const code = error?.code || error?.error_code || ''
  const msg  = error?.message || ''
  return ERROR_MESSAGES[code]
    || (msg.toLowerCase().includes('invalid') ? 'Неверный email или пароль' : null)
    || (msg.toLowerCase().includes('confirm') ? 'Подтвердите email — проверьте почту' : null)
    || msg
    || 'Ошибка входа. Попробуйте ещё раз'
}

export default function LoginPage() {
  const router  = useRouter()
  const [error, setError]           = useState('')
  const [showPass, setShowPass]     = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError: setFieldError } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email:    data.email.trim().toLowerCase(),
        password: data.password,
      })

      if (authError) {
        setError(getErrorMessage(authError))
        return
      }

      if (!authData.user) {
        setError('Не удалось войти. Попробуйте ещё раз')
        return
      }

      // maybeSingle — не бросает ошибку если записи нет
      const { data: u } = await supabase
        .from('users').select('role').eq('id', authData.user.id).maybeSingle()

      const role = u?.role || 'candidate'
      router.push(
        role === 'admin' ? '/dashboard/admin' :
        role === 'hr'    ? '/dashboard/hr' :
                           '/dashboard/candidate'
      )
    } catch (e: any) {
      setError('Ошибка соединения. Проверьте интернет и попробуйте ещё раз')
    }
  }

  const inputClass = (hasError: boolean) =>
    `h-10 w-full rounded-[10px] border px-3 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10 bg-[#FFF8F8]'
        : 'border-[#E5E7EB] focus:border-[#7C3AED] focus:ring-[#7C3AED]/10'
    }`

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={22} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Добро пожаловать</h1>
          <p className="text-sm text-[#64748B] mt-1">Войдите в свой аккаунт</p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-7 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#0F172A]">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-[#EF4444] flex items-center gap-1">
                  <AlertCircle size={11}/>{errors.email.message}
                </p>
              )}
            </div>

            {/* Пароль */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#0F172A]">Пароль</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={inputClass(!!errors.password) + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#EF4444] flex items-center gap-1">
                  <AlertCircle size={11}/>{errors.password.message}
                </p>
              )}
              <div className="flex justify-end mt-0.5">
                <Link href="/auth/forgot-password" className="text-xs text-[#7C3AED] hover:underline">
                  Забыли пароль?
                </Link>
              </div>
            </div>

            {/* Общая ошибка */}
            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-4 py-3 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-[#EF4444] mt-0.5 shrink-0"/>
                <p className="text-sm text-[#EF4444] leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium rounded-[10px] text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2 transition-colors"
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                : <><LogIn size={15}/>Войти</>
              }
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="text-[#7C3AED] font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </p>

      </div>
    </div>
  )
}

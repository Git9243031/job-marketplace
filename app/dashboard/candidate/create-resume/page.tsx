'use client'
import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { resumesService } from '@/services/resumes'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { TagInput } from '@/components/forms/TagInput'

const schema = z.object({
  name:             z.string().min(2, 'Введите имя'),
  title:            z.string().min(3, 'Введите должность'),
  experience_years: z.coerce.number().min(0).max(50),
  expected_salary:  z.coerce.number().optional(),
  location:         z.string().optional(),
  bio:              z.string().optional(),
  portfolio:        z.string().optional(),
  skills:           z.array(z.string()).default([]),
})

type FormData = z.infer<typeof schema>

const SPHERES = [
  {value:'',label:'Выберите сферу'},{value:'it',label:'IT'},{value:'design',label:'Дизайн'},
  {value:'marketing',label:'Маркетинг'},{value:'finance',label:'Финансы'},
  {value:'hr',label:'HR'},{value:'sales',label:'Продажи'},
  {value:'legal',label:'Юриспруденция'},{value:'other',label:'Другое'},
]
const LEVELS  = [
  {value:'',label:'Уровень'},{value:'junior',label:'Junior'},{value:'middle',label:'Middle'},
  {value:'senior',label:'Senior'},{value:'lead',label:'Lead'},{value:'any',label:'Любой'},
]
const FORMATS = [
  {value:'',label:'Формат'},{value:'remote',label:'Удалённо'},
  {value:'office',label:'Офис'},{value:'hybrid',label:'Гибрид'},
]

export default function CreateResumePage() {
  const [user, setUser]         = useState<any>(null)
  const [sphere, setSphere]     = useState('')
  const [level, setLevel]       = useState('')
  const [format, setFormat]     = useState('')
  const [serverError, setServerError] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (!u || u.role !== 'candidate') { router.push('/'); return }
      setUser(u)
    })
  }, [router])

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { skills: [], experience_years: 0 },
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    if (!user) return
    const { error } = await resumesService.createResume({
      ...data,
      sphere,
      experience_level: level,
      format,
      user_id: user.id,
      visible: false,
    })
    if (error) { setServerError((error as any).message || 'Ошибка'); return }
    router.push('/dashboard/candidate')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/dashboard/candidate" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
        <ArrowLeft size={14}/>Назад в кабинет
      </Link>

      <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Создать резюме</h1>
      <p className="text-sm text-[#64748B] mb-8">Резюме появится публично после одобрения администратором.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Основное */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">Основное</h2>
          <FormInput label="Имя и фамилия *" placeholder="Иван Иванов" {...register('name')} error={errors.name?.message}/>
          <FormInput label="Должность / специальность *" placeholder="Frontend-разработчик" {...register('title')} error={errors.title?.message}/>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Сфера"          options={SPHERES}  value={sphere}  onChange={e => setSphere(e.target.value)}/>
            <FormSelect label="Уровень"         options={LEVELS}   value={level}   onChange={e => setLevel(e.target.value)}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Формат работы"  options={FORMATS}  value={format}  onChange={e => setFormat(e.target.value)}/>
            <FormInput  label="Город"           placeholder="Москва" {...register('location')}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Опыт (лет)"       type="number" placeholder="3" {...register('experience_years')} error={errors.experience_years?.message}/>
            <FormInput label="Ожидаемая зарплата (₽)" type="number" placeholder="150 000" {...register('expected_salary')}/>
          </div>
        </div>

        {/* Навыки */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">🔧 Навыки / Стек</h2>
          <Controller control={control} name="skills" render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="TypeScript, React, Node.js..."/>
          )}/>
        </div>

        {/* О себе */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">О себе</h2>
          <textarea {...register('bio')} rows={6}
            placeholder="Расскажите о своём опыте, проектах и чем хотите заниматься..."
            className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 resize-y"/>
        </div>

        {/* Портфолио */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">Портфолио / GitHub</h2>
          <FormInput label="Ссылка" placeholder="https://github.com/username" {...register('portfolio')}/>
        </div>

        {serverError && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-4 py-3 text-sm text-[#EF4444]">{serverError}</div>
        )}

        <button type="submit" disabled={isSubmitting}
          className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-[12px] text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
          {isSubmitting
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            : 'Отправить на модерацию'}
        </button>
      </form>
    </div>
  )
}

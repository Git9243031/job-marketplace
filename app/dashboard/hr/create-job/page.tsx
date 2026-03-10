'use client'
import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Hash, Link2, Copy, Check, Send, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { jobsService } from '@/services/jobs'
import { jobSchema, type JobFormData } from '@/utils/schemas'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { TagInput } from '@/components/forms/TagInput'
import { postJobToTelegram } from '@/services/telegram'

const SPHERES      = [{value:'',label:'Выберите сферу'},{value:'it',label:'IT'},{value:'design',label:'Дизайн'},{value:'marketing',label:'Маркетинг'},{value:'finance',label:'Финансы'},{value:'hr',label:'HR'},{value:'sales',label:'Продажи'},{value:'legal',label:'Юриспруденция'},{value:'other',label:'Другое'}]
const LEVELS       = [{value:'',label:'Уровень'},{value:'junior',label:'Junior'},{value:'middle',label:'Middle'},{value:'senior',label:'Senior'},{value:'lead',label:'Lead / Team Lead'},{value:'any',label:'Любой'}]
const FORMATS      = [{value:'',label:'Формат работы'},{value:'remote',label:'Удалённо'},{value:'office',label:'Офис'},{value:'hybrid',label:'Гибрид'}]
const JOB_TYPES    = [{value:'',label:'Тип занятости'},{value:'full-time',label:'Полная'},{value:'part-time',label:'Частичная'},{value:'contract',label:'Контракт'},{value:'freelance',label:'Фриланс'},{value:'internship',label:'Стажировка'}]
const CONTRACT_TYPES = [{value:'',label:'Тип договора (опционально)'},{value:'trud',label:'Трудовой договор'},{value:'gph',label:'ГПХ'},{value:'ip',label:'Договор с ИП'},{value:'selfemployed',label:'Самозанятый'}]

const DESC_PLACEHOLDER = `🛠 Чем будете заниматься:\n• ...\n\n🔧 Стек: TypeScript, Vue, ...\n\n✨ Обязательно:\n• Опыт коммерческой разработки от N лет\n\n💼 Мы предлагаем:\n• Полную удалёнку и гибкий график`

export default function CreateJobPage() {
  const [user, setUser]             = useState<any>(null)
  const [serverError, setServerError] = useState('')
  const [copied, setCopied]         = useState(false)
  const [jobId, setJobId]           = useState('')
  const [jobUrl, setJobUrl]         = useState('')
  // Настройки модерации из adminService
  const [autoApproveJobs, setAutoApproveJobs]         = useState(false)
  const [autoApproveTelegram, setAutoApproveTelegram] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const id = crypto.randomUUID()
    setJobId(id)
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin
    setJobUrl(`${base}/jobs/${id}`)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const { data: u } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (!u || (u.role !== 'hr' && u.role !== 'admin')) { router.push('/'); return }
      setUser(u)
    })
    supabase.from('settings').select('auto_approve_jobs,auto_approve_telegram').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setAutoApproveJobs(data.auto_approve_jobs ?? false)
          setAutoApproveTelegram(data.auto_approve_telegram ?? false)
        }
      })
  }, [router])

  const copyUrl = () => {
    if (!jobId) return
    navigator.clipboard.writeText(jobUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { skills: [], tags: [] }
  })

  const onSubmit = async (data: JobFormData) => {
    setServerError('')
    if (!user || !jobId) return

    // visible = true только если включена автомодерация на сайте
    const visible = autoApproveJobs

    // Конвертируем пустые строки в undefined — иначе БД нарушает CHECK constraint
    const clean: Record<string, any> = { ...data }
    const nullableFields = ['contract_type', 'sphere', 'format', 'job_type', 'experience_level', 'location', 'contact']
    for (const f of nullableFields) {
      if (clean[f] === '') clean[f] = undefined
    }
    if (!clean.salary_min)  clean.salary_min  = undefined
    if (!clean.salary_max)  clean.salary_max  = undefined

    const { error } = await jobsService.createJob({
      ...clean,
      id: jobId,
      created_by: user.id,
      visible,
    })
    if (error) { setServerError((error as any).message || 'Ошибка'); return }

    // Telegram: отправляем только если включена автомодерация для TG И вакансия уже видима
    // (или если авто-TG включён отдельно даже без авто-апрува сайта)
    if (autoApproveTelegram) {
      try {
        await postJobToTelegram({
          ...data,
          id: jobId,
          salary_min: data.salary_min as number | undefined,
          salary_max: data.salary_max as number | undefined,
        })
      } catch (e) {
        console.warn('Telegram post failed:', e)
      }
    }

    router.push('/dashboard/hr')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/dashboard/hr" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors">
        <ArrowLeft size={14}/>Назад в кабинет
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Создать вакансию</h1>
        {/* Статус-бейджи модерации */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${autoApproveJobs ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
            <ShieldCheck size={11}/>
            {autoApproveJobs ? 'Автопубликация включена' : 'Требует модерации администратора'}
          </span>
          {autoApproveTelegram && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border bg-blue-50 text-blue-700 border-blue-100">
              <Send size={11}/>Telegram автопостинг
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Теги Telegram */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Hash size={15} className="text-[#7C3AED]"/>
            <h2 className="text-sm font-semibold text-[#0F172A]">Теги для Telegram</h2>
            <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">опционально</span>
          </div>
          <Controller control={control} name="tags" render={({field})=>(
            <TagInput value={field.value||[]} onChange={field.onChange} placeholder="#вакансия #vue #middle #frontend" hashMode/>
          )}/>
        </div>

        {/* Основное */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">Основное</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F172A]">Название вакансии *</label>
            <input {...register('title')} placeholder="🚀 Ищем Middle Frontend-разработчика" className="h-10 w-full rounded-[10px] border border-[#E5E7EB] px-3 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"/>
            {errors.title && <p className="text-xs text-[#EF4444]">{errors.title.message}</p>}
          </div>
          <FormInput label="Компания *" placeholder="Название компании" {...register('company')} error={errors.company?.message}/>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Сфера *"        options={SPHERES}       {...register('sphere')}/>
            <FormSelect label="Уровень"         options={LEVELS}        {...register('experience_level')}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Формат работы"   options={FORMATS}       {...register('format')}/>
            <FormSelect label="Тип занятости"   options={JOB_TYPES}     {...register('job_type')}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Тип договора"    options={CONTRACT_TYPES} {...register('contract_type')}/>
            <FormInput  label="Город / Локация" placeholder="Москва / Удалённо" {...register('location')}/>
          </div>
        </div>

        {/* Зарплата */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">💰 Зарплатная вилка</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="От (₽/мес)" type="number" placeholder="120 000" {...register('salary_min')} error={errors.salary_min?.message}/>
            <FormInput label="До (₽/мес)" type="number" placeholder="150 000" {...register('salary_max')} error={errors.salary_max?.message}/>
          </div>
        </div>

        {/* Навыки */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">🔧 Стек / Навыки</h2>
          <Controller control={control} name="skills" render={({field})=>(
            <TagInput value={field.value} onChange={field.onChange} placeholder="TypeScript, Vue, Nuxt..."/>
          )}/>
        </div>

        {/* Описание */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">Описание вакансии *</h2>
          <textarea {...register('description')} rows={14} placeholder={DESC_PLACEHOLDER} className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 resize-y font-mono leading-relaxed"/>
          {errors.description && <p className="text-xs text-[#EF4444]">{errors.description.message}</p>}
        </div>

        {/* Контакты */}
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">Контакты для откликов</h2>
          <FormInput label="Telegram / Email" placeholder="@username или hr@company.ru" {...register('contact')}/>
          <p className="text-xs text-[#94A3B8]">В Telegram-посте вместо контактов публикуется ссылка на страницу вакансии на сайте.</p>
        </div>

        {/* Ссылка */}
        <div className="bg-[#EDE9FE] rounded-[16px] border border-[#DDD6FE] p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-[#7C3AED]"/>
            <h2 className="text-sm font-semibold text-[#7C3AED]">Ссылка на вакансию</h2>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-[8px] border border-[#DDD6FE] px-3 py-2">
            <span className="text-xs text-[#7C3AED] font-mono flex-1 truncate">
              {jobUrl || <span className="text-[#94A3B8]">генерация...</span>}
            </span>
            <button type="button" onClick={copyUrl} disabled={!jobId} className="shrink-0 text-[#7C3AED] hover:text-[#6D28D9] disabled:opacity-40">
              {copied ? <Check size={14}/> : <Copy size={14}/>}
            </button>
          </div>
          <p className="text-xs text-[#6D28D9]">Эта ссылка публикуется в Telegram вместо прямых контактов.</p>
        </div>

        {serverError && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-4 py-3 text-sm text-[#EF4444]">{serverError}</div>
        )}

        <button type="submit" disabled={isSubmitting || !jobId}
          className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-[12px] text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
          {isSubmitting
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            : autoApproveTelegram
              ? <><Send size={14}/>Опубликовать и отправить в Telegram</>
              : autoApproveJobs
                ? <><ShieldCheck size={14}/>Опубликовать вакансию</>
                : 'Отправить на модерацию'}
        </button>
      </form>
    </div>
  )
}

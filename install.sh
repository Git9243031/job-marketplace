#!/bin/bash
# cd job-marketplace && bash ../fix-telegram-link.sh
set -e

# ─────────────────────────────────────────────────────────────────
# 1. API route — формирует ссылку на СЕРВЕРЕ где env доступен
# ─────────────────────────────────────────────────────────────────
cat > app/api/telegram/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const token   = process.env.TELEGRAM_BOT_TOKEN
  const channel = process.env.TELEGRAM_CHANNEL_ID

  if (!token || !channel) {
    return NextResponse.json({ error: 'Telegram не настроен' }, { status: 400 })
  }

  const body = await req.json()
  const { job } = body   // принимаем объект вакансии, а не готовый текст

  if (!job) {
    return NextResponse.json({ error: 'Нет данных вакансии' }, { status: 400 })
  }

  // Домен берём на СЕРВЕРЕ из env — здесь он всегда доступен
  const appUrl  = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const jobLink = `${appUrl}/jobs/${job.id}`

  const FORMAT_RU:   Record<string,string> = { remote:'удалёнка', office:'офис', hybrid:'гибрид' }
  const TYPE_RU:     Record<string,string> = { 'full-time':'полная', 'part-time':'частичная', contract:'контракт', freelance:'фриланс', internship:'стажировка' }
  const CONTRACT_RU: Record<string,string> = { trud:'Трудовой', gph:'ГПХ', ip:'ИП', selfemployed:'Самозанятый' }

  let text = ''

  // Теги
  if (job.tags?.length) {
    text += job.tags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') + '\n\n'
  }

  // Заголовок
  text += `<b>${job.title}</b>\n`
  text += `🏢 ${job.company}\n`

  // Мета
  const meta: string[] = []
  if (job.format)        meta.push(FORMAT_RU[job.format]        || job.format)
  if (job.job_type)      meta.push(TYPE_RU[job.job_type]        || job.job_type)
  if (job.contract_type) meta.push(CONTRACT_RU[job.contract_type] || job.contract_type)
  if (meta.length) text += `📋 ${meta.join(' · ')}\n`
  if (job.location) text += `📍 ${job.location}\n`

  // Зарплата
  if (job.salary_min || job.salary_max) {
    const parts: string[] = []
    if (job.salary_min) parts.push(`от ${Number(job.salary_min).toLocaleString('ru-RU')} ₽`)
    if (job.salary_max) parts.push(`до ${Number(job.salary_max).toLocaleString('ru-RU')} ₽`)
    text += `\n💰 ${parts.join(' — ')}\n`
  }

  // Описание
  if (job.description) {
    const short = String(job.description).slice(0, 700)
    text += `\n${short}${job.description.length > 700 ? '...' : ''}\n`
  }

  // Стек
  if (job.skills?.length) {
    text += `\n🔧 <b>Стек:</b> ${job.skills.join(', ')}\n`
  }

  // Ссылка — формируется здесь на сервере с реальным доменом
  text += `\n🔗 <a href="${jobLink}">Посмотреть вакансию и откликнуться</a>`

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: channel, text, parse_mode: 'HTML' }),
  })

  const data = await res.json()
  if (!data.ok) {
    console.error('Telegram API error:', data)
    return NextResponse.json({ error: data.description }, { status: 500 })
  }

  return NextResponse.json({ ok: true, link: jobLink })
}
EOF

echo "✅ app/api/telegram/route.ts"

# ─────────────────────────────────────────────────────────────────
# 2. telegram service — передаём объект вакансии, не текст
# ─────────────────────────────────────────────────────────────────
cat > services/telegram.ts << 'EOF'
export async function postJobToTelegram(job: {
  id: string
  title: string
  company: string
  location?: string
  format?: string
  job_type?: string
  contract_type?: string
  salary_min?: number | null
  salary_max?: number | null
  description?: string
  skills?: string[]
  tags?: string[]
}): Promise<void> {
  const res = await fetch('/api/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Передаём весь объект — ссылка строится на сервере
    body: JSON.stringify({ job }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Telegram post error:', err)
    throw new Error(err.error || 'Ошибка отправки в Telegram')
  }

  const data = await res.json()
  console.log('Telegram post sent, link:', data.link)
}
EOF

echo "✅ services/telegram.ts"

rm -rf .next
echo ""
echo "✅ Готово. npm run dev"
echo ""
echo "Убедись что в .env.local (и в Vercel → Environment Variables) прописан:"
echo "NEXT_PUBLIC_APP_URL=https://твой-домен.vercel.app"

